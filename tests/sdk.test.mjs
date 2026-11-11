import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createClient,verifyWebhook,paginate,APIError,identityHash} from '../node/dist/index.js';
import {createWidgetClient} from '../react-widget/dist/index.js';
const response=(data,status=200)=>new Response(JSON.stringify({success:status<400,data,error:{code:'DENIED'}}),{status,headers:{'Content-Type':'application/json'}});
test('retries preserve idempotency key, body and auth; unsafe writes do not retry',async()=>{
 const calls=[];
 const client=createClient({baseURL:'https://example.test',apiKey:'test',baseDelayMs:0,fetch:async(url,init)=>{calls.push({url:String(url),...init});return calls.length<2?response({},503):response({uuid:'created'},201);}});
 await client.request('/v1/public-api/conversations','post',{subject:'hello'},{idempotencyKey:'same'});
 assert.equal(calls.length,2);assert.equal(calls[0].body,calls[1].body);assert.equal(calls[1].headers['Idempotency-Key'],'same');assert.equal(calls[1].headers.Authorization,'Bearer test');
 calls.length=0;
 await assert.rejects(client.request('/v1/public-api/conversations','post',{}),APIError);assert.equal(calls.length,1);
});
test('webhook verification checks raw bytes, timestamp window, future values and signature',()=>{
 const body=Buffer.from('{"hello":1}');const stamp='1700000000';const signature='v1='+createHmac('sha256','test').update(stamp+'.').update(body).digest('hex');
 assert.ok(verifyWebhook('test',stamp,signature,body,1700000000000));
 assert.ok(!verifyWebhook('test',stamp,signature,Buffer.from('changed'),1700000000000));
 assert.ok(!verifyWebhook('test',stamp,signature,body,1700000400000));
 assert.ok(!verifyWebhook('test',stamp,signature,body,1699999600000));
 assert.ok(!verifyWebhook('test',stamp,'v1=zz',body,1700000000000));
});
test('iterator advances by actual items and exits on empty page',async()=>{
 const offsets=[];const out=[];for await(const item of paginate(async(limit,offset)=>{offsets.push(offset);return {items:offset===0?[1,2]:[],total:10,limit,offset};}))out.push(item);
 assert.deepEqual(out,[1,2]);assert.deepEqual(offsets,[0,2]);
});
test('widget session renewal, HMAC input, multipart file, typing and help use existing API',async()=>{
 const calls=[];const client=createWidgetClient({publicId:'public-id',fetch:async(url,init)=>{
  calls.push({url,init});if(url.endsWith('/bootstrap'))return response({visitor:{token:'initial'},conversations:[]});
  if(url.endsWith('/identify'))return response({token:'identified'});return response({});
 }});
 await client.init();await client.identify({user_id:'user-1',user_hash:'server-hash'});
 await client.sendMessage('conv-1',{text:'hello',client_id:'stable-id'},new File(['text'],'test.txt'));
 assert.equal(calls[1].init.headers.Authorization,'Bearer initial');assert.equal(JSON.parse(calls[1].init.body).user_hash,'server-hash');
 assert.equal(calls[2].init.headers.Authorization,'Bearer identified');assert.equal(calls[2].init.body.get('client_id'),'stable-id');assert.ok(calls[2].init.body.get('file'));assert.equal(calls[2].init.headers['Content-Type'],undefined);
 await client.typing('conv-1',true);assert.deepEqual(JSON.parse(calls[3].init.body),{typing:true});
 await client.helpSearch('a & b','en');assert.ok(calls[4].url.includes('q=a+%26+b'));
 client.reset();assert.equal(client.getSnapshot().visitor,null);
});
test('aborted requests do not retry',async()=>{
 let calls=0;const abort=new AbortController();abort.abort();
 const client=createClient({baseURL:'https://example.test',apiKey:'test',fetch:async()=>{calls++;throw new Error('aborted');}});
 await assert.rejects(client.request('/v1/public-api/contacts','get',undefined,{signal:abort.signal}));assert.equal(calls,1);
});
test('react-widget ships the same script SDK contract as frontend/public/widget.d.ts',async()=>{
 const {readFile}=await import('node:fs/promises');
 const a=await readFile(new URL('../react-widget/src/clickfix.d.ts',import.meta.url),'utf8');
 const b=await readFile(new URL('../../frontend/public/widget.d.ts',import.meta.url),'utf8');
 assert.equal(a,b,'copy frontend/public/widget.d.ts to sdks/react-widget/src/clickfix.d.ts');
});
test('identityHash signs the user id alone or with the company id (CF-206)',()=>{
 const secret='identity-secret-0123456789abcdef';
 assert.equal(identityHash(secret,'1001'),createHmac('sha256',secret).update('1001').digest('hex'));
 assert.equal(identityHash(secret,'1001',''),identityHash(secret,'1001'));
 const withCompany=identityHash(secret,'1001','F-77');
 assert.equal(withCompany,createHmac('sha256',secret).update('1001\nF-77').digest('hex'));
 assert.notEqual(withCompany,identityHash(secret,'1001'));
 assert.notEqual(withCompany,identityHash(secret,'1001F-77'));
 assert.notEqual(identityHash(secret,'1','12'),identityHash(secret,'11','2'));
 assert.throws(()=>identityHash(secret,'10\n01'));
 assert.throws(()=>identityHash(secret,'1001','F\n77'));
 assert.throws(()=>identityHash('','1001'));
});
