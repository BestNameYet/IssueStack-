'use strict';

// A pure, deterministic compiler: validated projection data + versioned
// presentation rules => complete inert ChatGPT DIL component markup.
// The GitHub workflow stores this markup; ChatGPT renders it verbatim.
const crypto = require('node:crypto');
const DEFAULT_RULES = require('../config/issue5-presentation-rules.json');
const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const assert = (v,m) => { if (!v) throw Error(m); };
const sha256 = s => crypto.createHash('sha256').update(s,'utf8').digest('hex');
const closed = (o,fields,name) => {
  assert(isObject(o),name+' must be an object');
  for(const k of fields) assert(Object.hasOwn(o,k),name+': missing '+k);
  for(const k of Object.keys(o)) assert(fields.includes(k),name+': unexpected '+k);
};
const ALLOWED = new Set(['col','box','text','title','blockquote','list','list-item','divider','bold','italic','code','table','table-row','table-cell']);
const PROPS = new Set(['gap','size','weight','color','border','radius','padding','marker','preserveWhitespace','header','dividers','scrollable']);
const SIZES = new Set(['xs','sm','md','lg']);
const COLORS = new Set(['secondary','default']);

function validateRules(rules) {
  closed(rules,['schema','target','principles','layout','typography','semantic_rules','roles','modes','security'],'presentation rules');
  assert(rules.schema==='issuestack.issue5.presentation-rules.v1','unknown presentation rules');
  assert(rules.target==='chatgpt-dil','unsupported render target');
  closed(rules.principles,['fidelity','workflow','safety','appearance'],'principles');
  for(const value of Object.values(rules.principles))assert(typeof value==='string' && value.length>0,'empty principle');
  closed(rules.layout,['columns','outer_gap','section_gap','list_gap','surface_padding','surface_radius','responsive','decorative_badges','auto_interactive_controls','max_table_columns','max_table_rows'],'layout');
  assert(rules.layout.columns===1 && rules.layout.responsive==='mobile-first-natural-wrap','unsupported layout dimensions');
  for(const k of ['outer_gap','section_gap','list_gap','surface_padding'])
    assert(Number.isInteger(rules.layout[k]) && rules.layout[k]>=0 && rules.layout[k]<=6,'invalid spacing '+k);
  assert(rules.layout.surface_radius==='lg','unsupported surface radius');
  assert(Number.isInteger(rules.layout.max_table_columns) && rules.layout.max_table_columns>=1 && rules.layout.max_table_columns<=10,'invalid table column limit');
  assert(Number.isInteger(rules.layout.max_table_rows) && rules.layout.max_table_rows>=1 && rules.layout.max_table_rows<=100,'invalid table row limit');
  assert(rules.layout.decorative_badges===false && rules.layout.auto_interactive_controls===false,'unsupported decorative/active elements');
  closed(rules.typography,['role_header','field_label','body','heading','code'],'typography');
  for(const [name,style] of Object.entries(rules.typography)){
    assert(isObject(style),'invalid style '+name);
    const allowed=['tag','size','weight','color','preserveWhitespace'];
    for(const k of Object.keys(style))assert(allowed.includes(k),'unsupported style property');
    assert((name==='heading' ? style.tag==='title':style.tag==='text'),'unsupported typography tag');
    assert(SIZES.has(style.size),'unsupported text size');
    if('weight' in style)assert(['normal','medium','semibold','bold'].includes(style.weight),'invalid weight');
    if('color' in style)assert(COLORS.has(style.color),'invalid color');
    if('preserveWhitespace' in style)assert(style.preserveWhitespace===true && name==='code','invalid preserveWhitespace');
  }
  closed(rules.roles,['user','agent'],'roles');
  closed(rules.roles.user,['title','analysis_title','fields'],'user role');
  closed(rules.roles.agent,['title','required_fidelity'],'agent role');
  assert(rules.roles.agent.required_fidelity==='faithful','agent fidelity requirement cannot be disabled');
  const expectedKeys=['explicit_meaning','implicit_meaning','salient_surrounding_context','tone','mood','date','time'];
  assert(Array.isArray(rules.roles.user.fields) && rules.roles.user.fields.length===expectedKeys.length,'missing user fields');
  assert(rules.roles.user.fields.map(x=>x?.key).join('|')===expectedKeys.join('|'),'user fields must be complete and ordered');
  for(const x of rules.roles.user.fields){closed(x,['key','label'],'user field');assert(typeof x.label==='string'&&x.label.length>0,'missing label');}
  for(const x of [rules.roles.user.title,rules.roles.user.analysis_title,rules.roles.agent.title])
    assert(typeof x==='string' && x.trim().length>0,'empty title');
  closed(rules.modes,['user','agent'],'modes');
  assert(JSON.stringify(rules.modes.user)===JSON.stringify(['markdown','json']),'invalid user modes');
  assert(JSON.stringify(rules.modes.agent)===JSON.stringify(['markdown','json','hidden']),'invalid agent modes');
  const knownSemantics=['atx-headings','paragraphs','bulleted-lists','numbered-lists','blockquotes','fenced-code','inline-bold','inline-italic','inline-code','pipe-tables','unsupported'];
  assert(Array.isArray(rules.semantic_rules) && rules.semantic_rules.map(x=>x?.id).join('|')===knownSemantics.join('|'),'unsupported semantic grammar');
  const expectedRender=['title','text','list+list-item','list+list-item','blockquote','text[preserveWhitespace]','bold','italic','code','table+table-row+table-cell','literal text'];
  for(let i=0;i<rules.semantic_rules.length;i++){const x=rules.semantic_rules[i];closed(x,['id','source','render','preserve_order'],'semantic mapping');assert(x.preserve_order===true,'semantic ordering cannot be disabled');assert(typeof x.source==='string' && x.source.length>0 && x.render===expectedRender[i],'invalid semantic mapping');}
  closed(rules.security,['literal_interpolation','allowed_tags','allowed_props','reject_source_truncation','max_source_chars','max_markup_chars'],'security');
  assert(rules.security.literal_interpolation==='json-string-expression','literal escaping must not be disabled');
  assert(rules.security.reject_source_truncation===true,'truncation forbidden');
  assert(Array.isArray(rules.security.allowed_tags) && rules.security.allowed_tags.length===ALLOWED.size && rules.security.allowed_tags.every(x=>ALLOWED.has(x)),'unsupported tag allowlist');
  assert(Array.isArray(rules.security.allowed_props) && rules.security.allowed_props.length===PROPS.size && rules.security.allowed_props.every(x=>PROPS.has(x)),'unsupported prop allowlist');
  assert(Number.isInteger(rules.security.max_source_chars) && rules.security.max_source_chars>0 && rules.security.max_source_chars<=50000,'invalid source ceiling');
  assert(Number.isInteger(rules.security.max_markup_chars) && rules.security.max_markup_chars>0 && rules.security.max_markup_chars<=60000,'invalid markup ceiling');
  return rules;
}

// User-controlled bytes exist ONLY as a JavaScript string literal expression,
// never as tag source. Escaping braces and angle brackets also protects simple
// token-based renderers that do not fully parse JavaScript literals.
function literal(value){
  const encoded=JSON.stringify(String(value)).replace(/[<>&{}]/g,c=>({
    '<':'\u003c','>':'\u003e','&':'\u0026','{':'\u007b','}':'\u007d'
  }[c])).replace(/\u2028/g,'\u2028').replace(/\u2029/g,'\u2029');
  return '{'+encoded+'}';
}
function props(attrs){
  let result='';
  for(const [key,value] of Object.entries(attrs)){
    assert(PROPS.has(key),'unsafe component prop');
    if(typeof value==='boolean'){if(value)result+=' '+key;}
    else if(typeof value==='number'){assert(Number.isFinite(value),'invalid numeric prop');result+=' '+key+'={'+value+'}';}
    else {assert(typeof value==='string' && /^[a-z-]+$/.test(value),'invalid prop value');result+=' '+key+'="'+value+'"';}
  }
  return result;
}
function tag(name,attributes,contents){
  assert(ALLOWED.has(name),'unsupported tag');
  assert(typeof contents==='string','invalid tag children');
  if (name==='divider') { assert(contents==='', 'divider has no children'); return `<divider${props(attributes)}/>`; }
  return `<${name}${props(attributes)}>${contents}</${name}>`;
}
function label(text,style){const {tag:tagName,...attributes}=style;return tag(tagName,attributes,literal(text));}
function plain(text,style){const {tag:tagName,...attributes}=style;return tag(tagName,attributes,literal(text));}
function renderInline(src){
  const pattern=/(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;
  let result='',last=0,match;
  while((match=pattern.exec(src))!==null){
    if(match.index>last)result+=literal(src.slice(last,match.index));
    const s=match[0];
    if(s.startsWith('**'))result+=tag('bold',{},literal(s.slice(2,-2)));
    else if(s.startsWith('`'))result+=tag('code',{},literal(s.slice(1,-1)));
    else result+=tag('italic',{},literal(s.slice(1,-1)));
    last=match.index+s.length;
  }
  if(last<src.length)result+=literal(src.slice(last));
  return result;
}
function blockStart(line){
  return /^\s*(?:#{1,3}\s+|[-*+]\s+|\d+\.\s+|>\s*|`{3,}|~{3,})/.test(line);
}
function parsePipeCells(line){
  if(!line.includes('|') || line.includes('\\|'))return null;
  const trimmed=line.trim().replace(/^\|/,'').replace(/\|$/,'');
  const cells=trimmed.split('|').map(s=>s.trim());
  return cells.length>=2 ? cells:null;
}
function tableAt(lines,index,rules){
  if(index+1>=lines.length)return null;
  const header=parsePipeCells(lines[index]),delimiter=parsePipeCells(lines[index+1]);
  if(!header||!delimiter||header.length!==delimiter.length||header.length>rules.layout.max_table_columns)return null;
  if(!delimiter.every(x=>/^:?-{3,}:?$/.test(x)))return null;
  let end=index+2;const data=[];
  while(end<lines.length && lines[end].trim()!=='' && data.length<rules.layout.max_table_rows){
    const cells=parsePipeCells(lines[end]);if(cells && cells.length!==header.length)return null;
    if(!cells)break;
    data.push(cells);end++;
  }
  // Fall back to literal, without discarding data, when an oversized table exists.
  if(end<lines.length && parsePipeCells(lines[end])?.length===header.length)return null;
  const row=(cells,isHeader)=>tag('table-row',isHeader?{header:true}:{},cells.map(v=>tag('table-cell',isHeader?{header:true}:{},tag('text',{size:'sm'},renderInline(v)))).join('\n'));
  const body=tag('table',{dividers:true},[row(header,true),...data.map(v=>row(v,false))].join('\n'));
  return {markup:tag('box',{scrollable:true},body),end};
}
function markdownBlocks(input,rules){
  const lines=String(input).replace(/\r\n?/g,'\n').split('\n');
  const result=[];let i=0;
  const body=rules.typography.body, heading=rules.typography.heading;
  function inlineBlock(str,sty=body){const {tag:tagName,...a}=sty;return tag(tagName,a,renderInline(str));}
  while(i<lines.length){
    if(lines[i].trim()===''){i++;continue;}
    const table=tableAt(lines,i,rules);if(table){result.push(table.markup);i=table.end;continue;}
    const line=lines[i],head=line.match(/^\s*(#{1,3})\s+(.+)$/);
    if(head){result.push(inlineBlock(head[2],heading));i++;continue;}
    const fence=line.match(/^\s*(`{3,}|~{3,})([^`]*)$/);
    if(fence){const delimiter=fence[1][0],length=fence[1].length;const collected=[];i++;
      while(i<lines.length && !new RegExp('^\\s*'+(delimiter==='`'?'`':'~')+'{'+length+',}\\s*$').test(lines[i]))collected.push(lines[i++]);
      if(i<lines.length)i++;result.push(plain(collected.join('\n'),rules.typography.code));continue;}
    const bullet=line.match(/^\s*([-*+])\s+(.+)$/),ordered=line.match(/^\s*(\d+)\.\s+(.+)$/);
    if(bullet||ordered){const items=[];const orderedKind=Boolean(ordered);while(i<lines.length){const m=lines[i].match(orderedKind?/^\s*\d+\.\s+(.+)$/:/^\s*[-*+]\s+(.+)$/);if(!m)break;items.push(tag('list-item',{},inlineBlock(m[1])));i++;}
      result.push(tag('list',{marker:orderedKind?'number':'bullet',gap:rules.layout.list_gap},items.join('\n')));continue;}
    if(/^\s*>\s?/.test(line)){const quoted=[];while(i<lines.length&&/^\s*>\s?/.test(lines[i]))quoted.push(lines[i++].replace(/^\s*>\s?/,''));result.push(tag('blockquote',{},inlineBlock(quoted.join('\n'))));continue;}
    const paragraph=[];while(i<lines.length && lines[i].trim()!=='' && (paragraph.length===0 || !blockStart(lines[i])))paragraph.push(lines[i++]);
    if(!paragraph.length){paragraph.push(lines[i++]);}result.push(inlineBlock(paragraph.join('\n')));
  }
  return result;
}
function renderMarkup({role,mode,source,rules=DEFAULT_RULES}){
  validateRules(rules);
  assert(['user','agent'].includes(role),'invalid role');
  assert(rules.modes[role].includes(mode),'invalid projection mode');
  if(mode==='hidden')return {markup:'',sha256:sha256(''),rules_schema:rules.schema};
  const serialized=typeof source==='string'?source:JSON.stringify(source);
  if(role==='agent' && mode==='markdown')assert(typeof source==='string' && source.trim().length>0,'empty second-run source');
  assert(serialized.length<=rules.security.max_source_chars,'source exceeds safe render limit; no truncation');
  let blocks=[];
  if(mode==='json'){
    const json=JSON.stringify(source,null,2);
    blocks=[label(role==='user'?rules.roles.user.title:rules.roles.agent.title,rules.typography.role_header),plain(json,rules.typography.code)];
  }else if(role==='user'){
    assert(isObject(source),'validated user source object required');
    assert(typeof source.verbatim_user_prompt==='string','verbatim prompt missing');
    const values=rules.roles.user.fields;
    for(const field of values)assert(typeof source[field.key]==='string','user analysis field missing: '+field.key);
    const prompt=tag('box',{border:true,radius:rules.layout.surface_radius,padding:rules.layout.surface_padding},
      tag('col',{gap:rules.layout.section_gap},markdownBlocks(source.verbatim_user_prompt,rules).join('\n')));
    const fields=values.map(field=>tag('col',{gap:1},label(field.label,rules.typography.field_label)+ '\n'+plain(source[field.key],rules.typography.body)));
    blocks=[label(rules.roles.user.title,rules.typography.role_header),prompt,tag('divider',{color:'subtle'},''),label(rules.roles.user.analysis_title,rules.typography.role_header),tag('col',{gap:rules.layout.section_gap},fields.join('\n'))];
  }else{
    assert(typeof source==='string','second-run response text must be a string');
    blocks=[label(rules.roles.agent.title,rules.typography.role_header),tag('col',{gap:rules.layout.section_gap},markdownBlocks(source,rules).join('\n'))];
  }
  const markup=tag('col',{gap:rules.layout.outer_gap},blocks.join('\n'));
  assert(markup.length<=rules.security.max_markup_chars,'generated markup exceeds safe output limit; no truncation');
  return {markup,sha256:sha256(markup),rules_schema:rules.schema};
}
module.exports={DEFAULT_RULES,validateRules,literal,renderInline,markdownBlocks,renderMarkup,sha256};
