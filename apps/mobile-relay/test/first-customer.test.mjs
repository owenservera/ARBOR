import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const from = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=from('app.js'),html=from('index.html');
const kernel=readFileSync(new URL('../../../core/programmability/src/product_kernel.rs',import.meta.url),'utf8');
const bridge=readFileSync(new URL('../../../packages/vec-ui-engines/src/rust-wasm.mjs',import.meta.url),'utf8');

test('first-contact is Direct-only, opt-in, and uses existing paired Host composer',()=>{
  assert.match(app,/const FIRST_CONTACT = transport\.direct && !HOST_PREVIEW/);
  assert.match(app,/get\('first'\) === '1'/);
  assert.match(app,/mountUniversalDock\(\);\s*mountFirstWiki\(\);/);
  assert.match(app,/void vivimChat\.send\(body\)/);
  assert.match(app,/admitted\.executionAuthorized !== false/);
  assert.match(app,/admitted\.effectPerformed !== false/);
  assert.match(app,/rustFirstContact\(\{text:field\.value\}\)/);
  assert.match(html,/body\.first-contact #top/);
  assert.match(html,/#msgs > \.vivim-intro/);
  assert.match(html,/#msgs > section\.vivim-plan/);
  assert.match(html,/#chat-composer \.row > :not\(#text\):not\(#send\)/);
});
test('first-contact computation is implemented in canonical Rust product kernel',()=>{
  assert.match(kernel,/"first-contact"=>crate::first_contact::project\(input\)/);
  assert.match(bridge,/export function rustFirstContact\(input\)/);
  assert.match(bridge,/invoke\('first-contact',input\)/);
});
test('typing searches only an authorized, source-admitted Wiki with no effect or provider calls',()=>{
  assert.match(app,/function firstWikiScope\(\)/);
  assert.match(app,/S\.device\.scopes\?\.includes\('control:read'\)/);
  assert.match(app,/firstWikiAbort=new AbortController\(\)/);
  assert.match(app,/fetch\(scope\.url,/);
  assert.match(app,/verifyWikiSourceStamp\(wiki,/);
  assert.match(app,/admitted\.state!=='accepted'\|\|!admitted\.native/);
  assert.match(app,/rustWikiSearch\?\.\(source\.wiki,text\.slice\(0,160\)\)/);
  assert.match(app,/found\.results\.slice\(0,6\)/);
  assert.match(app,/window\.addEventListener\('vivim:paired',\(\)=>resetFirstWiki\(\)\)/);
  assert.match(app,/if\(document\.hidden\)resetFirstWiki\(\)/);
});

test('Wiki results occupy the visible phone area above the composer and clear after send',()=>{
  assert.match(app,/insertBefore\(firstWikiPanel,\$\('chat-composer'\)\)/);
  assert.match(html,/#first-wiki \{/);
  assert.match(app,/if \(FIRST_CONTACT\) resetFirstWiki\(\)/);
});

test('real PWA Wiki rows expand source only while the exact device grant is live',async()=>{
  const vm=await import('node:vm');
  function functionSource(source,name){
    const start=source.indexOf('function '+name+'(');
    assert.notEqual(start,-1);
    let depth=0,begin=source.indexOf('{',start);
    for(let at=begin;at<source.length;at++){
      if(source[at]==='{')depth++;
      if(source[at]==='}'&&--depth===0)return source.slice(start,at+1);
    }
    throw Error('Unbalanced source function');
  }
  function node(tag,klass,text=''){
    return {
      tag,klass,textContent:text,children:[],hidden:true,open:false,events:{},
      append(...children){this.children.push(...children)},
      replaceChildren(...children){this.children=[...children]},
      addEventListener(name,fn){this.events[name]=fn},
      querySelector(selector){return this.children.find(c=>'.'+c.klass===selector)||null}
    };
  }
  const wiki={revision:2,pages:{'ARBOR':{sections:{
    'Rust Core':'<img src=x onerror=alert(1)> Rust code remains plain text'
  },links:[]}}};
  const source={wiki,stamp:{revision:2,digest:'a'.repeat(64)}};
  const panel=node('aside','first-wiki');let grant='grant-a';
  const env={firstWikiPanel:panel,firstWikiGrant:'grant-a',
    firstWikiSource:source,firstWikiHighWater:source.stamp,
    firstWikiScope:()=>({key:grant}),
    rustWikiSearch:()=>({wikiRevision:2,wikiDigest:'a'.repeat(64),
      matches:1,results:[{page:'ARBOR',section:'Rust Core',excerpt:'Rust code'}]}),
    el:node,Array,observeFirstWiki:()=>{}};
  vm.createContext(env);
  vm.runInContext(functionSource(app,'renderFirstWiki'),env);
  env.renderFirstWiki('Rust',source);
  assert.equal(panel.hidden,false);
  const row=panel.children[1];
  assert.equal(row.tag,'details');
  row.open=true;row.events.toggle();
  assert.equal(row.children.find(c=>c.klass==='first-wiki-detail').textContent,
    wiki.pages.ARBOR.sections['Rust Core']);
  grant='grant-b';row.open=true;row.events.toggle();
  assert.equal(row.open,false,'old Wiki result cannot expand after a grant switch');
});

test('Tailscale owner first-contact is a usable read-only composer without device enrollment',()=>{
  assert.match(app,/key:'tailnet-owner-first-contact',url:'\/mobile\/api\/first-contact\/wiki'/);
  assert.match(app,/if \(FIRST_CONTACT\) \{/);
  assert.match(app,/S\.paired = false; S\.tab = 'talk'; N\.target = 'vivim'/);
  assert.match(app,/if \(FIRST_CONTACT && !S\.paired\) \{/);
  assert.match(app,/await refreshFirstWiki\(\)/);
  assert.match(app,/\/\/ Submit exclusively to the Host plan boundary/);
  assert.match(html,/body\.first-contact #chat-composer/);
});
