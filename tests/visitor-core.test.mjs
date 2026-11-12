// @getclickfix/visitor-core: runs under plain Node 22 (no DOM). The
// same checks hold on React Native (Hermes): the core only touches
// globalThis.fetch/FormData/WebSocket/timers, which these tests inject.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createVisitorClient,createRealtime,VisitorError,parseMessage,encodeCommand,commandScript,isSafeLink,COMMAND_TYPES,MESSAGE_TYPES,randomUUID,CORE_VERSION} from '../visitor-core/dist/index.js';
// The public SDK mirror has no frontend/: the contract comparisons run only in the product repository.
const mirror=!(await import('node:fs')).existsSync(new URL('../../frontend/public/widget.d.ts',import.meta.url))&&'frontend/ is not part of the SDK mirror';
const response=(data,status=200,code='DENIED',headers={})=>new Response(JSON.stringify({success:status<400,data,error:{code},meta:{request_id:'req-1'}}),{status,headers:{'Content-Type':'application/json',...headers}});
const APP={key:'cf_app_0123456789abcdef0123456789abcdef01234567',packageName:'com.example.shop'};

// Code only: comments and string/template literals are dropped first (the
// bridge builds a `window.ClickFixBridge` script *for the webview*).
const code=(src)=>src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').replace(/`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/g,'""');
test('dist uses no browser API (Hermes/Node safe) and no DOM lib',async()=>{
 for(const f of ['index.js','client.js','realtime.js','bridge.js','env.js']){
  const src=code(await readFile(new URL(`../visitor-core/dist/${f}`,import.meta.url),'utf8'));
  for(const bad of [/\bwindow\b/,/\bdocument\b/,/\bnavigator\b/,/\blocalStorage\b/,/\bsessionStorage\b/,/\blocation\b/,/\bURLSearchParams\b/,/\bXMLHttpRequest\b/])assert.ok(!bad.test(src),`${f} uses ${bad}`);
 }
 const tsconfig=JSON.parse(await readFile(new URL('../visitor-core/tsconfig.json',import.meta.url),'utf8'));
 assert.deepEqual(tsconfig.compilerOptions.lib,['ES2022']);assert.deepEqual(tsconfig.compilerOptions.types,[]);
});

test('app mode sends the app key headers instead of relying on Origin; browser mode does not',async()=>{
 const calls=[];const fetch=async(url,init)=>{calls.push({url,init});return url.endsWith('/bootstrap')?response({visitor:{token:'t1',id:'v1'},conversations:[]}):response({items:[]});};
 assert.throws(()=>createVisitorClient({publicId:'w',mode:'app',fetch}),/app\.key/);
 assert.throws(()=>createVisitorClient({publicId:'w',mode:'app',app:APP,fetch}),/absolute baseURL/);
 const app=createVisitorClient({publicId:'w',mode:'app',app:APP,baseURL:'https://support.example.test/api/',fetch,screen:'orders',language:'tr-TR'});
 await app.init();
 assert.equal(calls[0].url,'https://support.example.test/api/v1/widget/w/bootstrap');
 assert.equal(calls[0].init.headers['X-ClickFix-App-Key'],APP.key);assert.equal(calls[0].init.headers['X-ClickFix-App-Package'],'com.example.shop');
 assert.deepEqual(JSON.parse(calls[0].init.body),{sdk_version:CORE_VERSION,page_url:'orders',language:'tr'});
 assert.equal(calls[0].init.credentials,'omit');assert.equal(calls[0].init.redirect,'error');
 await app.conversations();assert.equal(calls[1].init.headers.Authorization,'Bearer t1');assert.equal(calls[1].init.headers['X-ClickFix-App-Key'],APP.key);
 const browser=createVisitorClient({publicId:'w',fetch});await browser.init();
 assert.equal(calls[2].url,'/api/v1/widget/w/bootstrap');assert.equal(calls[2].init.headers['X-ClickFix-App-Key'],undefined);
});

test('GET and idempotent sends retry on 503/network with Retry-After; identify does not',async()=>{
 let n=0;const client=createVisitorClient({publicId:'w',baseDelayMs:0,fetch:async(url)=>{n++;if(url.endsWith('/identify'))return response({},503);if(n===1)throw new TypeError('offline');if(n===2)return response({},503,'X',{'Retry-After':'0'});return response({items:[1]});}});
 assert.deepEqual(await client.conversations(),{items:[1]});assert.equal(n,3);
 n=0;await assert.rejects(client.identify({user_id:'u',user_hash:'h'}),(e)=>e instanceof VisitorError&&e.status===503&&e.requestId==='req-1');assert.equal(n,1);
 n=0;const sent=await client.sendMessage('c',{text:'hi'});assert.equal(n,3);assert.ok(sent);
});

test('a rejected token renews the session once and replays the request with the new token',async()=>{
 const tokens=[];const calls=[];let bootstraps=0;
 const client=createVisitorClient({publicId:'w',token:'stale',onToken:(t)=>tokens.push(t),fetch:async(url,init)=>{
  calls.push(url.replace(/.*\/widget\/w/,''));
  if(url.endsWith('/bootstrap')){bootstraps++;return response({visitor:{token:'fresh',id:'v2'},conversations:[]});}
  if(init.headers.Authorization==='Bearer stale')return response({},401,'WIDGET_VISITOR_TOKEN_INVALID');
  return response({items:[{uuid:'c1'}]});
 }});
 const [a,b]=await Promise.all([client.conversations(),client.conversations()]);
 assert.deepEqual(a,{items:[{uuid:'c1'}]});assert.deepEqual(b,a);
 assert.equal(bootstraps,1,'concurrent renewals are deduplicated');assert.deepEqual(tokens,['fresh']);
 assert.equal(client.getToken(),'fresh');assert.equal(client.getSnapshot().visitor.id,'v2');
 // A 401 with another code, or one that persists after renewal, surfaces.
 const dead=createVisitorClient({publicId:'w',token:'x',fetch:async(url)=>url.endsWith('/bootstrap')?response({visitor:{token:'x',id:'v'},conversations:[]}):response({},401,'WIDGET_VISITOR_TOKEN_INVALID')});
 await assert.rejects(dead.conversations(),(e)=>e.code==='WIDGET_VISITOR_TOKEN_INVALID');
});

test('track events ride with the next message, screen sets page_url, native files go as descriptors',async()=>{
 const calls=[];const client=createVisitorClient({publicId:'w',fetch:async(url,init)=>{calls.push(init);return response({});}});
 client.setScreen('screen://orders/42');client.track('viewed_order',{id:42});client.track('x'.repeat(200));
 assert.equal(client.pendingEvents().length,2);assert.equal(client.pendingEvents()[1].name.length,100);
 await client.createConversation({text:'help',client_id:'id-1'});
 const body=JSON.parse(calls[0].body);assert.equal(body.page_url,'screen://orders/42');assert.equal(body.events.length,2);assert.equal(body.events[0].name,'viewed_order');assert.ok(body.events[0].at);
 assert.equal(client.pendingEvents().length,0,'sent events are cleared');
 await client.sendMessage('c',{text:'file'},{uri:'file:///tmp/a.png',name:'a.png',type:'image/png'});
 const form=calls[1].body;assert.ok(form instanceof FormData);assert.equal(form.get('text'),'file');assert.ok(form.get('client_id'));assert.equal(form.get('page_url'),'screen://orders/42');
 assert.equal(calls[1].headers['Content-Type'],undefined);
 await client.setAttributes({plan:'pro',seats:3});assert.deepEqual(JSON.parse(calls[2].body),{attributes:{plan:'pro',seats:3}});assert.equal(calls[2].method,'PATCH');
 await client.rate('c',5,'great');assert.deepEqual(JSON.parse(calls[3].body),{score:5,comment:'great'});
 await client.markRead('c');assert.equal(calls[4].method,'POST');
 await client.messages('c',{before:'m 1'});
 client.adoptToken('from-webview');assert.equal(client.getToken(),'from-webview');assert.equal(client.getSnapshot().visitor,null);
 client.reset();assert.equal(client.getToken(),'');assert.equal(client.pendingEvents().length,0);
 assert.match(randomUUID(),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('realtime connects, subscribes, answers pings, delivers channel pushes and reconnects',async()=>{
 const sockets=[];class FakeSocket{constructor(url){this.url=url;this.sent=[];sockets.push(this);queueMicrotask(()=>this.onopen?.());}send(d){this.sent.push(d);}close(){this.onclose?.();}}
 const events=[];const states=[];let tokenCalls=0;
 const rt=createRealtime({tokens:async()=>{tokenCalls++;return {ws_url:'wss://rt.test',connection_token:'c',subscription_token:'s',channel:'widget:v1'};},onEvent:(d)=>events.push(d),onState:(s)=>states.push(s),WebSocket:FakeSocket,maxDelayMs:1});
 rt.start();await new Promise(r=>setTimeout(r,5));
 const ws=sockets[0];assert.equal(ws.url,'wss://rt.test');assert.deepEqual(ws.sent.map(JSON.parse).map(c=>Object.keys(c)[1]),['connect','subscribe']);
 ws.onmessage({data:'{}\n{"id":2,"subscribe":{}}\n{"push":{"channel":"widget:v1","pub":{"data":{"type":"message"}}}}\n{"push":{"channel":"other","pub":{"data":1}}}'});
 assert.equal(ws.sent.at(-1),'{}');assert.deepEqual(events,[{type:'message'}]);assert.equal(rt.connected,true);assert.deepEqual(states,[true]);
 ws.onmessage({data:'{"error":{"code":109}}'});assert.equal(rt.connected,false);
 await new Promise(r=>setTimeout(r,1100));assert.ok(sockets.length>=2,'reconnected after the error');assert.ok(tokenCalls>=2);
 rt.stop();assert.equal(rt.connected,false);
 const noWs=createRealtime({tokens:async()=>({ws_url:'wss://x',connection_token:'',subscription_token:'',channel:''}),onEvent(){},WebSocket:undefined,socket:undefined});
 noWs.start();noWs.stop();
});

test('bridge helpers encode commands, decode only widget messages and gate links',()=>{
 assert.equal(encodeCommand({type:'clickfix:session',token:'t'}),'{"type":"clickfix:session","token":"t"}');
 assert.match(commandScript({type:'clickfix:close'}),/^window\.ClickFixBridge && window\.ClickFixBridge\.receive\("\{\\"type\\":\\"clickfix:close\\"\}"\); true;$/);
 assert.deepEqual(parseMessage('{"type":"clickfix:ready","bridge_version":1,"widget_id":"w","visitor_id":"v"}').widget_id,'w');
 assert.deepEqual(parseMessage({type:'clickfix:session',token:'tok',visitor_id:'v'}).token,'tok');
 assert.equal(parseMessage('{"type":"clickfix:identify","user":{}}'),null,'commands are not messages');
 assert.equal(parseMessage('nope'),null);assert.equal(parseMessage({type:'clickfix:result',id:1,ok:true}),null);assert.equal(parseMessage('[]'),null);
 assert.ok(isSafeLink('https://help.example.com/a?b=1'));assert.ok(isSafeLink('http://localhost:3000/x'));
 assert.ok(!isSafeLink('intent://x'));assert.ok(!isSafeLink('javascript:alert(1)'));assert.ok(!isSafeLink('http://evil.test'));
 assert.ok(COMMAND_TYPES.includes('clickfix:session'));assert.ok(MESSAGE_TYPES.includes('clickfix:session'));
});

test('core bridge types mirror the widget contract (frontend/public/widget.d.ts and shared/bridge.ts)',{skip:mirror},async()=>{
 const types=(s)=>[...s.matchAll(/"(clickfix:[a-z-]+)"/g)].map(m=>m[1]);
 const dts=await readFile(new URL('../../frontend/public/widget.d.ts',import.meta.url),'utf8');
 const widget=await readFile(new URL('../../frontend/widget-sdk/src/shared/bridge.ts',import.meta.url),'utf8');
 const core=await readFile(new URL('../visitor-core/src/bridge.ts',import.meta.url),'utf8');
 const all=new Set([...COMMAND_TYPES,...MESSAGE_TYPES]);
 assert.deepEqual(new Set(types(dts)),all,'widget.d.ts');
 assert.deepEqual(new Set(types(widget)),all,'shared/bridge.ts');
 assert.deepEqual(new Set(types(core.replace(/'/g,'"'))),all,'core bridge.ts');
});

test('bridge events: known names with an object payload pass, others are ignored; names match the widget',{skip:mirror},async()=>{
 const {EVENT_NAMES}=await import('../visitor-core/dist/index.js');
 const ok=parseMessage('{"type":"clickfix:event","event":"unread","payload":{"count":3}}');
 assert.equal(ok.payload.count,3);
 assert.equal(parseMessage({type:'clickfix:event',event:'nope',payload:{}}),null,'unknown event name');
 assert.equal(parseMessage({type:'clickfix:event',event:'unread'}),null,'missing payload');
 const widget=await readFile(new URL('../../frontend/widget-sdk/src/shared/bridge.ts',import.meta.url),'utf8');
 const block=/FORWARDED_EVENTS[^=]*=\s*\[([^\]]*)\]/.exec(widget)[1];
 const forwarded=[...block.matchAll(/"([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual([...EVENT_NAMES].sort(),[...forwarded].sort(),'EVENT_NAMES must equal FORWARDED_EVENTS in frontend/widget-sdk/src/shared/bridge.ts');
});

test('CORE_VERSION (sent as sdk_version) follows the package version',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../visitor-core/package.json',import.meta.url),'utf8'));
 assert.equal(CORE_VERSION,`core-${pkg.version}`);
});
