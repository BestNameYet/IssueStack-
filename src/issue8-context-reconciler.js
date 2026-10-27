'use strict';
/**
 * Read-only Issue #8 registry audit and drift planner. An observation is not
 * authorization to edit GitHub. This module deliberately contains NO writes.
 */
const registry=require('./agent-context-registry.js');
const publisher=require('./issue8-context-publisher.js');
const MARK=/^<!-- ISSUESTACK_CONTEXT_PAGE:([a-z0-9-]+) -->\n/;
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const acceptedId=id=>Number.isSafeInteger(id)&&id>0;
const iso=s=>{const n=Date.parse(s);if(!Number.isFinite(n))throw Error('Invalid timestamp');return new Date(n).toISOString();};
function inspectComment(comment){
  if(!acceptedId(comment?.id)||typeof comment.body!=='string')throw Error('Invalid GitHub issue comment');
  const match=MARK.exec(comment.body);
  if(!match)return null;
  const id=match[1];
  let data;try{data=JSON.parse(comment.body.slice(match[0].length));}catch{throw Error('Invalid registry JSON '+id);}
  if(!isObject(data))throw Error('Non-object registry page '+id);
  if(id==='toc'&&data.schema!=='issuestack.agent-context.toc.v1')throw Error('Invalid registry TOC schema');
  if(id!=='toc'&&data.schema!=='issuestack.agent-context.page.v1')throw Error('Invalid registry page schema '+id);
  return {page_id:id,id:comment.id,body:comment.body,data,sha256:registry.sha(comment.body)};
}
function audit(comments,{repo='BestNameYet/IssueStack-',now,maxFreshnessHours=48}={}){
  const pages=new Map(),warnings=[],problems=[];
  for(const comment of comments){
    const item=inspectComment(comment);
    if(!item){warnings.push('Non-registry comment ID '+comment.id);continue;}
    if(pages.has(item.page_id))problems.push('Duplicate page marker '+item.page_id);
    else pages.set(item.page_id,item);
  }
  const toc=pages.get('toc');
  if(!toc)problems.push('Missing permanent-ID TOC');
  if(toc){
    if(!Array.isArray(toc.data.pages))problems.push('Missing TOC links');
    else{
      const seen=new Set(),ids=new Set();
      for(const p of toc.data.pages){
        if(!p||typeof p.page_id!=='string'||!acceptedId(p.comment_id)||typeof p.sha256!=='string'){problems.push('Invalid TOC entry');continue;}
        if(seen.has(p.page_id)||ids.has(p.comment_id)){problems.push('Duplicate TOC reference '+p.page_id);continue;}
        seen.add(p.page_id);ids.add(p.comment_id);
        const item=pages.get(p.page_id);
        if(!item||item.id!==p.comment_id||item.sha256!==p.sha256)problems.push('TOC checksum/identity mismatch '+p.page_id);
        const expected='https://github.com/'+repo+'/issues/8#issuecomment-'+p.comment_id;
        if(p.url!==expected)problems.push('TOC link mismatch '+p.page_id);
        if(item&&item.data.source_commit!==toc.data.commit)problems.push('Source commit mismatch '+p.page_id);
      }
      for(const [id] of pages)if(id!=='toc'&&!seen.has(id))problems.push('Unindexed registry page '+id);
    }
  }
  const runtime=pages.get('runtime'),observedAt=runtime?.data?.data?.observed_at||null;
  const nowMs=Date.parse(iso(now)),observeMs=observedAt?Date.parse(observedAt):NaN;
  const ageHours=Number.isFinite(observeMs)?(nowMs-observeMs)/3600000:null;
  if(ageHours===null)problems.push('No readable runtime observation timestamp');
  else if(ageHours< -0.1)problems.push('Future-dated runtime observation');
  else if(ageHours>maxFreshnessHours)warnings.push('Runtime observation stale: '+ageHours.toFixed(2)+' hours');
  const all=[...pages.values()];
  const ok=problems.length===0;
  return {schema:'issuestack.agent-context.audit.v1',checked_at:iso(now),ok,problems,warnings,source_commit:toc?.data?.commit||null,
    toc_comment_id:toc?.id||null,page_count:all.length-Number(!!toc),runtime_observed_at:observedAt,runtime_age_hours:ageHours,
    stale:ageHours===null||ageHours>maxFreshnessHours,entries:all.map(p=>({page_id:p.page_id,comment_id:p.id,sha256:p.sha256}))};
}
function semanticPage(page){
  if(!isObject(page))throw Error('Page content not object');
  const v=JSON.parse(JSON.stringify(page));
  if(has(v,'generated_at'))delete v.generated_at;
  // The runtime observation timestamp is evidence; it must not be erased.
  return JSON.stringify(v);
}
function plan({comments,desiredPages,sourceCommit,now,config,repo='BestNameYet/IssueStack-'}){
  registry.validateConfig(config);
  const current=audit(comments,{repo,now,maxFreshnessHours:config.max_freshness_hours});
  const found=new Map(comments.map(c=>[MARK.exec(c.body||'')?.[1],c]).filter(([id])=>id));
  const changes=[],desiredIds=new Set();
  for(const page of desiredPages){
    if(!page||!/^[a-z0-9-]+$/.test(page.id)||desiredIds.has(page.id)||page.id==='toc')throw Error('Invalid or duplicate desired page ID');
    desiredIds.add(page.id);
    const want=publisher.pageBody(page.id,page.contents);
    const old=found.get(page.id);
    let action,reason;
    if(!old){action='create';reason='Registry section not yet published';}
    else{
      const previous=inspectComment(old);
      const same=semanticPage(previous.data)===semanticPage(page.contents);
      if(!same){action='update';reason='Meaningful registry content differs';}
      else if(page.id==='runtime'&&current.stale){action='update';reason='Stale runtime timestamp needs new observation';}
      else{action='no_op';reason='Semantically identical content; ignore generation timestamp';}
    }
    changes.push({page_id:page.id,action,reason,existing_comment_id:old?.id||null,
      before_sha256:old?registry.sha(old.body):null,after_sha256:registry.sha(want)});
  }
  for(const id of found.keys())if(id!=='toc'&&!desiredIds.has(id))changes.push({page_id:id,action:'unmanaged',reason:'Existing registry page absent from generator',existing_comment_id:found.get(id).id});
  if(current.source_commit!==sourceCommit)current.warnings.push('Published source commit differs from current checkout');
  const material=changes.some(c=>c.action!=='no_op')||current.problems.length>0||current.source_commit!==sourceCommit;
  return {schema:'issuestack.agent-context.plan.v1',checked_at:iso(now),current,desired_source_commit:sourceCommit,
    source_drift:current.source_commit!==sourceCommit,changes,needs_review:material,
    mode:'read_only',publication_allowed:false,
    warning:material?'Manual per-change review required; this report cannot authorize issue mutation.':'No registry edit required; last observation retains its age/stale label.'};
}
async function readIssue8(github,{owner,repo}){
  if(!github?.paginate||!github?.rest?.issues?.listComments)throw Error('Read-only GitHub integration required');
  const comments=await github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:8,per_page:100});
  if(!Array.isArray(comments))throw Error('Issue #8 comments unavailable');
  return comments;
}
module.exports={inspectComment,audit,semanticPage,plan,readIssue8};
