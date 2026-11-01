"use strict";

/**
 * Extract the displayed user/assistant conversation from the ORIGINAL saved HTML.
 * No html-tags-alphabetical.json input and no linear_conversation shortcut.
 * Source: <script> window.__reactRouterContext.streamController.enqueue(...) </script>.
 * The embedded devalue array contains indexed property-name references. We decode
 * mapping/current_node and walk the message parent links to establish turn order.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;
const source = process.argv[2] || path.join(root, "response.html");
const outputJson = process.argv[3] || path.join(root, "conversation.json");
const outputMarkdown = process.argv[4] || path.join(root, "conversation.md");
const EXPECTED_SCRIPT_SUBSTRING = "window.__reactRouterContext.streamController.enqueue";
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function loadChunks(html) {
  const scriptTags = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
  const call = /window\.__reactRouterContext\.streamController\.enqueue\(("(?:\\.|[^"\\])*")\)/g;
  const scripts = [];
  const chunks = [];
  let match;
  while ((match = scriptTags.exec(html)) !== null) {
    if (!match[1].includes(EXPECTED_SCRIPT_SUBSTRING)) continue;
    scripts.push({startOffset: match.index, scriptOrdinal: scripts.length});
    let callMatch;
    while ((callMatch = call.exec(match[1])) !== null) {
      const decoded = JSON.parse(callMatch[1]); // JS string containing devalue serialization
      chunks.push({text: decoded, scriptOrdinal: scripts.length - 1});
    }
    call.lastIndex = 0;
  }
  if (!chunks.length) throw new Error("No conversation-bearing stream enqueue in source <script> tags");
  const first = chunks.find(x => x.text.trimStart().startsWith("["));
  if (!first) throw new Error("No indexed devalue array in script stream");
  const table = JSON.parse(first.text);
  if (!Array.isArray(table)) throw new Error("Devalue root is not an indexed array");
  return {table, scriptLocations: scripts, streamChunkCount: chunks.length};
}

function makeReader(table) {
  function deref(index) {
    if (!Number.isInteger(index) || index < 0 || index >= table.length) return undefined;
    return table[index];
  }
  function propRef(objectRef, prop) {
    const obj = deref(objectRef);
    if (!obj || Array.isArray(obj) || typeof obj !== "object") return undefined;
    for (const [keyRef, valueRef] of Object.entries(obj)) {
      if (!/^_\d+$/.test(keyRef)) continue;
      if (deref(Number(keyRef.slice(1))) === prop) return valueRef;
    }
    return undefined;
  }
  function get(objectRef, prop) { return deref(propRef(objectRef, prop)); }
  function materialize(ref, depth = 0, seen = new Set()) {
    if (!Number.isInteger(ref) || ref < 0) return null;
    const v = deref(ref);
    if (v === null || typeof v !== "object") return v === undefined ? null : v;
    if (depth >= 12 || seen.has(ref)) return {unexpanded_ref: ref};
    const next = new Set(seen); next.add(ref);
    if (Array.isArray(v)) {
      // A tagged devalue record is not an array of indexed child values.
      if (v.length && typeof v[0] === "string" && /^[A-Z]$/.test(v[0])) {
        return {serialized_type: v[0], arguments: v.slice(1).map(x => materialize(x,depth+1,next))};
      }
      return v.map(x => materialize(x,depth+1,next));
    }
    const result = {};
    for (const [keyRef,valueRef] of Object.entries(v)) {
      if (!/^_\d+$/.test(keyRef)) continue;
      result[String(deref(Number(keyRef.slice(1))))] = materialize(valueRef,depth+1,next);
    }
    return result;
  }
  return {deref,propRef,get,materialize};
}

function findSharedConversation(reader) {
  // Traverse the *decoded script payload's named loader objects*, not linear_conversation.
  const {deref,propRef} = reader;
  const frontier = [{ref:0,depth:0}];
  const seen = new Set();
  while(frontier.length) {
    const {ref,depth} = frontier.shift();
    if (!Number.isInteger(ref) || ref < 0 || seen.has(ref) || depth>9) continue;
    seen.add(ref);
    if (propRef(ref,"mapping") !== undefined && propRef(ref,"current_node") !== undefined) return ref;
    const obj=deref(ref);
    if(!obj || typeof obj!=="object" || Array.isArray(obj)) continue;
    for (const [key,val] of Object.entries(obj)) {
      if(!/^_\d+$/.test(key) || !Number.isInteger(val)) continue;
      const field=deref(Number(key.slice(1)));
      if (field === "linear_conversation") continue; // explicit non-use
      if (typeof deref(val) === "object") frontier.push({ref:val,depth:depth+1});
    }
  }
  throw new Error("Unable to find message mapping/current_node in source script");
}

function reconstruct(table) {
  const reader=makeReader(table);
  const {deref,propRef,get,materialize}=reader;
  const conversationRef=findSharedConversation(reader);
  const mapping=deref(propRef(conversationRef,"mapping"));
  const currentNode=get(conversationRef,"current_node");
  if (!mapping || typeof mapping!=="object" || !currentNode) {
    throw new Error("Missing message map or current node");
  }
  // Object keys '_N' map table[N] (message UUID) to node reference.
  const byId=new Map();
  for (const [key,nodeRef] of Object.entries(mapping)) {
    if(!/^_\d+$/.test(key)) continue;
    const id=deref(Number(key.slice(1)));
    if(typeof id==="string") byId.set(id,nodeRef);
  }
  if(!byId.has(currentNode)) throw new Error("Current conversation node absent from message map");
  const ancestry=[],visited=new Set();
  let id=currentNode;
  while(id!==null && id!==undefined) {
    if(visited.has(id)) throw new Error("Cycle in message ancestry");
    visited.add(id);
    const nodeRef=byId.get(id);
    if(nodeRef===undefined) throw new Error("Missing parent node "+id);
    ancestry.push({id,nodeRef});
    id=get(nodeRef,"parent");
  }
  ancestry.reverse();
  const messages=[];
  const ignored={};
  for (const entry of ancestry) {
    const messageRef=propRef(entry.nodeRef,"message");
    if(messageRef===undefined || deref(messageRef)===null) continue;
    const authorRef=propRef(messageRef,"author");
    const role=get(authorRef,"role");
    const channel=get(messageRef,"channel") || null;
    const recipient=get(messageRef,"recipient") || null;
    const contentRef=propRef(messageRef,"content");
    const contentType=get(contentRef,"content_type") || null;
    const partsRef=propRef(contentRef,"parts");
    const partPointers=deref(partsRef);
    const parts=Array.isArray(partPointers)?partPointers.map(r=>materialize(r)):[];
    const text=parts.filter(x=>typeof x==="string").join("\n");
    const user=role==="user";
    const assistant=role==="assistant" &&
       (channel==="final" || channel==="commentary" ||
         (channel===null && recipient==="all" && contentType==="text" &&
           text && text!=="The output of this plugin was redacted."));
    if ((!user && !assistant) || !text.trim()) {
      const reason=String(role||"null")+"/"+String(channel||contentType||"null");
      ignored[reason]=(ignored[reason]||0)+1;
      continue;
    }
    messages.push({
      index: messages.length + 1,
      id:entry.id,
      role: user ? "user" : "assistant",
      channel,
      create_time: get(messageRef,"create_time") ?? null,
      update_time: get(messageRef,"update_time") ?? null,
      content_type:contentType,
      text, parts,
      source: {script: "React Router stream enqueue",message_node_id:entry.id,
        content_reference: contentRef, parts_reference: partsRef}
    });
  }
  if (!messages.length || !messages.some(m=>m.role==="user") ||
      !messages.some(m=>m.role==="assistant")) {
    throw new Error("No verifiable user/assistant messages recovered");
  }
  for(let i=0;i<messages.length;i++) if(messages[i].index!==i+1)throw Error("Broken message sequence");
  const anchorUser="So, so the validate, the validation service";
  const anchorAssistant="Use **separate validation contracts";
  const anchors={
    user:messages.some(m=>m.role==="user"&&m.text.includes(anchorUser)),
    assistant:messages.some(m=>m.role==="assistant"&&m.text.includes(anchorAssistant)),
  };
  if(!anchors.user || !anchors.assistant) throw Error("Required source-grounded message anchors were not recovered");
  return {messages,ignored,ancestryCount:ancestry.length,mappingCount:byId.size,anchors,currentNode};
}

function main() {
  const raw=fs.readFileSync(source);
  const html=raw.toString("utf8");
  const parsed=loadChunks(html);
  const result=reconstruct(parsed.table);
  const meta={
    schema:"chatgpt.conversation-from-html-script.v1",
    original_source:path.basename(source),
    original_sha256:sha256(raw),
    source_method:"HTML <script> → React Router streamController.enqueue → devalue indexed table → mapping/current_node → parent chain",
    method_excludes:["html-tags-alphabetical.json","linear_conversation"],
    scripts_with_stream:parsed.scriptLocations,
    stream_chunks:parsed.streamChunkCount,
    indexed_table_values:parsed.table.length,
    mapped_node_count:result.mappingCount,
    chain_nodes:result.ancestryCount,
    recovered_message_count:result.messages.length,
    role_counts:result.messages.reduce((o,m)=>(o[m.role]=(o[m.role]||0)+1,o),{}),
    excluded_node_counts:result.ignored,
    anchors:result.anchors,
    accuracy_status:"hypothesis output; user review required"
  };
  const out={...meta,messages:result.messages};
  fs.writeFileSync(outputJson,JSON.stringify(out,null,2)+"\n");
  const lines=["# Reconstructed conversation", "",
    "Source: "+path.basename(source),
    "Method: original HTML script → indexed message mapping → parent chain",
    "Status: hypothesis output for comparison, not independently certified complete",
    "Recovered messages: "+result.messages.length, ""];
  for(const msg of result.messages) {
    lines.push("## "+msg.index+" — "+(msg.role==="user"?"User":"Assistant"),"");
    lines.push("Message ID: "+msg.id+(msg.channel?" | Channel: "+msg.channel:""),"");
    lines.push(msg.text,"");
  }
  fs.writeFileSync(outputMarkdown,lines.join("\n")+"\n");
  const receipt={...meta,files:[
    {path:outputJson,bytes:fs.statSync(outputJson).size,sha256:sha256(fs.readFileSync(outputJson))},
    {path:outputMarkdown,bytes:fs.statSync(outputMarkdown).size,sha256:sha256(fs.readFileSync(outputMarkdown))}
  ]};
  console.log(JSON.stringify(receipt));
}
main();
