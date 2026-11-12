import { createHmac, timingSafeEqual } from 'node:crypto';
import type { paths } from './schema.js';
export type { paths, components, operations } from './schema.js';
type Method = 'get'|'post'|'put'|'patch'|'delete';
type AllowedMethod<P extends keyof paths> = {[M in Method]: M extends keyof paths[P] ? NonNullable<paths[P][M]> extends never ? never : M : never}[Method];
type Operation<P extends keyof paths,M extends Method> = M extends keyof paths[P] ? NonNullable<paths[P][M]> : never;
type JSONBody<O> = O extends {requestBody: {content: {'application/json': infer B}}} ? B : never;
type JSONResponse<O> = O extends {responses: infer R} ? {[K in keyof R]: K extends 200|201 ? R[K] extends {content:{'application/json':infer B}} ? B : never : never}[keyof R] : never;
export class APIError extends Error {
 constructor(public status:number,public code:string,public requestId:string|null,public details:unknown){super(`ClickFix ${status}: ${code}`);}
}
export interface Options {baseURL:string;apiKey:string;fetch?:typeof fetch;attempts?:number;baseDelayMs?:number}
export interface RequestOptions {path?:Record<string,string>;query?:Record<string,string|number|undefined>;idempotencyKey?:string;signal?:AbortSignal}
export interface Page<T>{items:T[];total:number;limit:number;offset:number}
const sleep = (ms:number,signal?:AbortSignal) => new Promise<void>((resolve,reject)=>{
 if(signal?.aborted){reject(signal.reason);return;}
 const abort=()=>{clearTimeout(timer);reject(signal?.reason);};
 const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);
 signal?.addEventListener('abort',abort,{once:true});
});
export function createClient(options:Options){
 if(!options.apiKey.trim())throw new Error('API key required');
 const transport=options.fetch??fetch;
 async function request<P extends keyof paths,M extends AllowedMethod<P>>(path:P,method:M,body?:JSONBody<Operation<P,M>>,opts:RequestOptions={}):Promise<JSONResponse<Operation<P,M>>>{
  let route:string=path;
  for(const [k,v] of Object.entries(opts.path??{}))route=route.replace(`{${k}}`,encodeURIComponent(v));
  if(route.includes('{'))throw new Error('Missing path parameter');
  const url=new URL(options.baseURL.replace(/\/$/,'')+route);
  for(const [k,v] of Object.entries(opts.query??{}))if(v!==undefined)url.searchParams.set(k,String(v));
  const headers:Record<string,string>={Authorization:`Bearer ${options.apiKey}`,Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(opts.idempotencyKey)headers['Idempotency-Key']=opts.idempotencyKey;
  const attempts=Number.isFinite(options.attempts??3)?Math.min(Math.max(Math.trunc(options.attempts??3),1),5):3;
  const safe=method==='get'||!!opts.idempotencyKey;
  for(let attempt=0;;attempt++){
   let res:Response;
   try {res=await transport(url,{method:method.toUpperCase(),headers,body:body===undefined?undefined:JSON.stringify(body),signal:opts.signal,redirect:'error'});}catch(err){
    if(!safe||attempt+1>=attempts||opts.signal?.aborted)throw err;
    await sleep(Math.min((options.baseDelayMs??250)*2**attempt,30000),opts.signal);continue;
   }
   if(safe&&[429,502,503,504].includes(res.status)&&attempt+1<attempts){
    const retry=res.headers.get('Retry-After');
    let wait=Math.min((options.baseDelayMs??250)*2**attempt,30000);
    if(retry!==null){const n=Number(retry);const ms=Number.isFinite(n)?n*1000:Date.parse(retry)-Date.now();if(Number.isFinite(ms))wait=Math.min(Math.max(ms,0),30000);}
    await res.body?.cancel();await sleep(wait,opts.signal);continue;
   }
   const data=await res.json() as {error?:{code?:string};meta?:{request_id?:string}};
   if(!res.ok)throw new APIError(res.status,data.error?.code??'HTTP_ERROR',data.meta?.request_id??res.headers.get('X-Request-ID'),data);
   return data as JSONResponse<Operation<P,M>>;
  }
 }
 return {request};
}
export async function* paginate<T>(fetchPage:(limit:number,offset:number)=>Promise<Page<T>>,signal?:AbortSignal):AsyncGenerator<T>{
 let offset=0;for(;;){signal?.throwIfAborted();const page=await fetchPage(100,offset);if(!page.items.length)return;yield* page.items;offset+=page.items.length;if(offset>=page.total)return;}
}
/** Verify raw bytes before JSON parsing. Persist Webhook-Id separately for deduplication. */
export function verifyWebhook(secret:string,timestamp:string,signature:string,body:Uint8Array,now=Date.now(),toleranceMs=300000):boolean{
 if(!secret||!Number.isFinite(toleranceMs)||!Number.isFinite(now)||toleranceMs<=0||!/^\d+$/.test(timestamp)||!/^v1=[a-fA-F0-9]{64}$/.test(signature))return false;
 const stamp=Number(timestamp)*1000;if(!Number.isSafeInteger(stamp)||Math.abs(now-stamp)>toleranceMs)return false;
 const expected=createHmac('sha256',secret).update(timestamp+'.').update(body).digest();
 return timingSafeEqual(expected,Buffer.from(signature.slice(3),'hex'));
}
/**
 * Server-only: send the hash to your browser; keep the secret on your server.
 * With companyId (the company's id in your system, sent as identify `company.id`)
 * the hash covers both ids: hex(HMAC-SHA256(secret, userId + "\n" + companyId)),
 * so a signed-in user cannot claim another company. Without it the
 * original formula hex(HMAC-SHA256(secret, userId)) is used. Neither id may
 * contain a line break.
 */
export function identityHash(secret:string,userId:string,companyId?:string):string{
 if(!secret)throw new Error('identity secret required');
 if(!userId||/[\r\n]/.test(userId)||(companyId&&/[\r\n]/.test(companyId)))throw new Error('user id and company id must be non-empty without line breaks');
 const mac=createHmac('sha256',secret).update(userId);
 if(companyId)mac.update('\n').update(companyId);
 return mac.digest('hex');
}
