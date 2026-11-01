"use strict";

/**
 * Reads the ORIGINAL captured response.html, finds conversation-bearing script
 * data, and writes exactly one readable, chronologically ordered Markdown file:
 * user messages, assistant commentary, and assistant final responses.
 *
 * Does not consume the alphabetized HTML-tag index, conversation.json,
 * conversation.md, or any "linear_conversation" convenience field.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const source = process.argv[2] || path.join(__dirname, "response.html");
const output = process.argv[3] || path.join(__dirname, "conversation-user-commentary-final.md");
const sourceBytes = fs.readFileSync(source);
const html = sourceBytes.toString("utf8");
const sha = x => crypto.createHash("sha256").update(x).digest("hex");

function readIndexedPayload(sourceHtml) {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
  const enqueueRegex = /window\.__reactRouterContext\.streamController\.enqueue\(("(?:\\.|[^"\\])*")\)/g;
  let script;
  while ((script = scriptRegex.exec(sourceHtml))) {
    if (!script[1].includes("window.__reactRouterContext.streamController.enqueue")) continue;
    enqueueRegex.lastIndex = 0;
    let call;
    while ((call = enqueueRegex.exec(script[1]))) {
      const payloadText = JSON.parse(call[1]);
      if (!payloadText.trimStart().startsWith("[")) continue;
      const table = JSON.parse(payloadText);
      if (!Array.isArray(table) || table.length === 0) throw Error("Invalid indexed React Router stream data");
      return table;
    }
  }
  throw Error("No indexed conversation payload found inside the source HTML script tags");
}

const table = readIndexedPayload(html);
function deref(index) {
  return Number.isInteger(index) && index >= 0 && index < table.length ? table[index] : undefined;
}
function fieldRef(objectRef, name) {
  const obj = deref(objectRef);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return undefined;
  for (const [key, value] of Object.entries(obj)) {
    if (/^_\d+$/.test(key) && deref(Number(key.slice(1))) === name) return value;
  }
  return undefined;
}
function field(objectRef, name) { return deref(fieldRef(objectRef, name)); }

// Locate the conversation mapping in the decoded HTML script.
// In particular, do not use the unrelated linear_conversation field.
function findConversationRoot() {
  const frontier = [{ref: 0, depth: 0}];
  const seen = new Set();
  for (let at = 0; at < frontier.length; at++) {
    const {ref, depth} = frontier[at];
    if (!Number.isInteger(ref) || ref < 0 || depth > 12 || seen.has(ref)) continue;
    seen.add(ref);
    if (fieldRef(ref, "mapping") !== undefined && fieldRef(ref, "current_node") !== undefined) return ref;
    const obj = deref(ref);
    if (!obj || Array.isArray(obj) || typeof obj !== "object") continue;
    for (const [key, value] of Object.entries(obj)) {
      if (!/^_\d+$/.test(key) || !Number.isInteger(value)) continue;
      if (deref(Number(key.slice(1))) === "linear_conversation") continue;
      if (deref(value) !== null && typeof deref(value) === "object") {
        frontier.push({ref: value, depth: depth + 1});
      }
    }
  }
  throw Error("Missing conversation mapping and current_node in the original HTML's scripts");
}

const conversationRef = findConversationRoot();
const rawMapping = field(conversationRef, "mapping");
const currentNodeId = field(conversationRef, "current_node");
if (!rawMapping || Array.isArray(rawMapping) || typeof rawMapping !== "object" || typeof currentNodeId !== "string") {
  throw Error("Malformed conversation mapping/current_node");
}
const byId = new Map();
for (const [indexedKey, nodeRef] of Object.entries(rawMapping)) {
  if (!/^_\d+$/.test(indexedKey)) continue;
  const id = deref(Number(indexedKey.slice(1)));
  if (typeof id === "string") byId.set(id, nodeRef);
}
if (!byId.has(currentNodeId)) throw Error("current_node is not in message mapping");

const chain = [];
const visited = new Set();
let cursor = currentNodeId;
while (cursor != null) {
  if (visited.has(cursor)) throw Error("Cycle in message parent links");
  visited.add(cursor);
  const nodeRef = byId.get(cursor);
  if (nodeRef === undefined) throw Error("Missing parent message node: " + cursor);
  chain.push(nodeRef);
  cursor = field(nodeRef, "parent");
}
// The reverse of the node-to-root parent chain is the source-defined
// conversation order, rather than a timestamp-based guess.
chain.reverse();

const retained = [];
const counts = {user: 0, commentary: 0, final: 0};
for (const nodeRef of chain) {
  const messageRef = fieldRef(nodeRef, "message");
  if (messageRef === undefined || deref(messageRef) == null) continue;

  const role = field(fieldRef(messageRef, "author"), "role");
  const channel = field(messageRef, "channel") ?? null;
  let label, countKey;
  if (role === "user") {
    label = "User";
    countKey = "user";
  } else if (role === "assistant" && channel === "commentary") {
    label = "Assistant · Commentary";
    countKey = "commentary";
  } else if (role === "assistant" && channel === "final") {
    label = "Assistant · Final";
    countKey = "final";
  } else {
    continue; // never render tools, internal records, or other assistant channels
  }

  const contentRef = fieldRef(messageRef, "content");
  const partRefs = field(contentRef, "parts");
  if (!Array.isArray(partRefs)) continue;
  const text = partRefs.map(deref).filter(value => typeof value === "string").join("\n");
  if (!text.trim()) continue;
  retained.push({label, text: text.trimEnd(), role, channel});
  counts[countKey]++;
}

if (!counts.user || !counts.commentary || !counts.final) {
  throw Error("Expected nonempty user, assistant commentary and assistant final records");
}
if (!retained.some(x=>x.role==="user" &&
    x.text.includes("So, so the validate, the validation service")) ||
    !retained.some(x=>x.channel==="final" &&
    x.text.includes("Use **separate validation contracts"))) {
  throw Error("Required screenshot-derived source anchors not present");
}
if (retained.some(x=> !["User","Assistant · Commentary","Assistant · Final"].includes(x.label))) {
  throw Error("Output contains disallowed role/channel");
}

// Message bodies are preserved verbatim (except trailing blank lines).
// No tool outputs, internal records, message IDs, diagnostic fields or JSON
// are emitted in the human-readable Markdown.
const sections = retained.map((message, index) =>
  "## " + String(index + 1).padStart(3, "0") + " — " + message.label +
  "\n\n" + message.text
);
const markdown = "# User and Assistant Conversation\n\n" + sections.join("\n\n---\n\n") + "\n";
fs.writeFileSync(output, markdown, "utf8");
const bytes = fs.readFileSync(output);
const countsTotal = counts.user + counts.commentary + counts.final;
if (countsTotal !== retained.length) throw Error("Message count mismatch");
console.log(JSON.stringify({
  source: path.basename(source),
  source_sha256: sha(sourceBytes),
  output,
  output_bytes: bytes.length,
  output_sha256: sha(bytes),
  chronology: "source message parent chain (root to leaf)",
  messages: retained.length,
  counts,
  excluded: "all roles and channels except user, assistant commentary and assistant final"
}));
