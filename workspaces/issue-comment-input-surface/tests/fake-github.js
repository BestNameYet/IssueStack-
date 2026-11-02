'use strict';

const crypto = require('node:crypto');
const ROOT = 'workspaces/issue-comment-input-surface';
const sha = body => crypto.createHash('sha256').update(body).digest('hex');
const REPO = 'BestNameYet/IssueStack-';
const issueUrl = n => 'https://api.github.com/repos/' + REPO + '/issues/' + n;

function makeHarness(options = {}) {
  const files = new Map();
  const comments = new Map();
  const calls = [];
  let counter = 0, nextCommentId = 90000;
  const issueNumber = options.issueNumber ?? 2;
  const commentId = options.commentId ?? 111;
  const body = options.body ?? 'original';
  const setFile = (path, text) => files.set(path, {body: text, sha: sha(text) + '-' + ++counter});
  setFile('config/file-metadata.json', JSON.stringify({schema:'issuestack.file-metadata.v1',files:[]})+'\n');
  const instructionFile = ROOT + '/instructions/fixture.json';
  setFile(instructionFile, JSON.stringify(options.instruction ?? {
    issue_number: issueNumber, comment_id: commentId, text: 'new text', operation: 'replace'
  }));
  comments.set(commentId, {id:commentId, issue_url:issueUrl(options.commentIssue ?? issueNumber),
    body, user:{login:'BestNameYet'}});

  const fail = stage => {
    if (options.failAt === stage) {
      const error = new Error('Injected failure at ' + stage);
      error.status = 500;
      throw error;
    }
  };
  const api = {
    rest: {
      repos: {
        async getContent({path}) {
          calls.push(['getContent',path]);
          fail('getContent:' + path);
          const entry = files.get(path);
          if (!entry) {
            const error = new Error('Not Found'); error.status = 404; throw error;
          }
          return {data:{type:'file',encoding:'base64',content:Buffer.from(entry.body).toString('base64'),sha:entry.sha}};
        },
        async createOrUpdateFileContents({path,content,sha:expected}) {
          calls.push(['putFile',path]);
          fail('putFile:' + path);
          const prior = files.get(path);
          if ((prior && expected !== prior.sha) || (!prior && expected)) {
            const error = new Error('SHA conflict'); error.status=409; throw error;
          }
          if (prior && !expected) {
            const error = new Error('Expected SHA'); error.status=422; throw error;
          }
          const text = Buffer.from(content,'base64').toString('utf8');
          const nextSha=sha(text)+'-'+ ++counter;
          files.set(path,{body:text,sha:nextSha});
          return {data:{content:{sha:nextSha}}};
        },
        async compareCommits() {
          calls.push(['compareCommits']);
          return {data:{files:options.changedFiles ?? []}};
        }
      },
      issues: {
        async get({issue_number}) {
          calls.push(['getIssue',issue_number]);
          fail('getIssue');
          return {data:{number:issue_number,url:issueUrl(issue_number),
            ...(options.isPullRequest ? {pull_request:{url:'PR'}} : {})}};
        },
        async getComment({comment_id}) {
          calls.push(['getComment',comment_id]);
          fail('getComment');
          const c = comments.get(comment_id);
          if (!c) {const error=new Error('not found');error.status=404;throw error;}
          if(options.mutateBeforePrewriteCheck && calls.filter(x=>x[0]==='getComment').length===2)
            c.body += '-concurrent';
          return {data:{...c, ...(options.corruptReadback && calls.some(x=>x[0]==='updateComment'||x[0]==='createComment') ? {body:'mismatch'}:{})}};
        },
        async updateComment({comment_id,body}) {
          calls.push(['updateComment',comment_id]);
          fail('updateComment');
          const c=comments.get(comment_id);
          if(!c)throw Error('unknown ID');
          c.body=body;
          return {data:{...c}};
        },
        async createComment({issue_number,body}) {
          calls.push(['createComment',issue_number]);
          fail('createComment');
          const id=nextCommentId++;
          const c={id,issue_url:issueUrl(issue_number),body,user:{login:'github-actions[bot]'}};
          comments.set(id,c);
          return {data:{...c}};
        }
      }
    }
  };
  const outputs = {};
  const core={info:()=>{},setOutput:(name,value)=>{outputs[name]=value;}};
  const context={repo:{owner:options.owner??'BestNameYet',repo:options.repo??'IssueStack-'},
    actor:options.actor??'BestNameYet',eventName:options.eventName??'push',
    ref:options.ref??'refs/heads/main',sha:options.sha??'a'.repeat(40),
    payload:{before:'b'.repeat(40),inputs:{instruction_file:instructionFile}},
    get repository(){return this.repo.owner+'/'+this.repo.repo;}};
  const receipts=()=>[...files].filter(([p])=>p.startsWith(ROOT+'/receipts/'))
    .map(([p,e])=>({path:p,record:JSON.parse(e.body)}));
  return {github:api,context,core,files,comments,calls,outputs,instructionFile,setFile,receipts};
}
module.exports={makeHarness,ROOT,REPO,issueUrl};
