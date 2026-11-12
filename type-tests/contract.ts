import { createClient } from '../node/dist/index.js';
import { createWidgetClient } from '../react-widget/dist/index.js';
const api=createClient({baseURL:'https://example.test',apiKey:'test'});
void api.request('/v1/public-api/conversations','post',{contact_uuid:'contact',inbox_uuid:'inbox',subject:'Question'},{idempotencyKey:'stable'});
// @ts-expect-error server SDK never exposes platform/session routes
void api.request('/v1/platform/users','get');
// @ts-expect-error public contacts collection only supports GET
void api.request('/v1/public-api/contacts','delete');
// @ts-expect-error generated request payload has a string subject
void api.request('/v1/public-api/conversations','post',{subject:42});
const widget=createWidgetClient({publicId:'id'});
void widget.identify({user_id:'user',user_hash:'signed-on-server'});
// @ts-expect-error identification always requires a server-signed HMAC
void widget.identify({user_id:'user'});
import { clickFix, loadClickFix } from '../react-widget/dist/index.js';
const sdk=loadClickFix({appOrigin:'https://app.example.test',widgetId:'id',locale:'tr',theme:'dark'});
sdk('on','message',m=>{const text:string=m.text;void text;});
sdk('identify',{user_id:'u'},'server-hash');
sdk('startConversation','Merhaba',{send:true});
const unread:number=clickFix().getUnreadCount();void unread;
// @ts-expect-error unknown events are rejected
sdk('on','nope',()=>{});
// @ts-expect-error locale is tr or en
loadClickFix({appOrigin:'x',widgetId:'id',locale:'de'});
import { createVisitorClient, parseMessage, type BridgeCommand } from '../visitor-core/dist/index.js';
const core=createVisitorClient({publicId:'id',mode:'app',app:{key:'cf_app_x',packageName:'com.example.app'},baseURL:'https://support.example.test/api'});
void core.identify({user_id:'user',user_hash:'signed-on-server',company:{id:'F-1'}});
void core.sendMessage('c',{text:'hi'},{uri:'file:///a.png',name:'a.png',type:'image/png'});
// @ts-expect-error identification always requires a server-signed HMAC
void core.identify({user_id:'user'});
// @ts-expect-error attributes are scalars
void core.setAttributes({nested:{a:1}});
const cmd:BridgeCommand={type:'clickfix:session',token:core.getToken()};void cmd;
// @ts-expect-error unknown bridge command
const bad:BridgeCommand={type:'clickfix:nope'};void bad;
const msg=parseMessage('{}');if(msg&&msg.type==='clickfix:session'){const t:string=msg.token;void t;}
import type { ClickFixProviderProps, IdentifyOptions, SecureStorage, Message } from '../react-native/dist/index.js';
import { parseConversationLink, memoryStorage, keychainStorage } from '../react-native/dist/index.js';
import type { ChatScreenProps, ClickFixTheme } from '../react-native/dist/ui/index.js';
import type { ClickFixExpoProviderProps } from '../expo/dist/index.js';
import { conversationURL, fileAttachment } from '../expo/dist/index.js';
const rnProps:ClickFixProviderProps={appKey:'cf_app_x',packageName:'com.example.app',widgetId:'id',baseUrl:'https://support.example.test',getUserHash:async(userId,companyId)=>`${userId}${companyId??''}`};void rnProps;
// @ts-expect-error the bare provider needs the package name the app key is bound to
const noPackage:ClickFixProviderProps={appKey:'k',widgetId:'id',baseUrl:'https://x'};void noPackage;
const expoProps:ClickFixExpoProviderProps={appKey:'cf_app_x',widgetId:'id',baseUrl:'https://support.example.test'};void expoProps; // packageName comes from app.json
const who:IdentifyOptions={userId:'1001',company:{id:'F-77'}};void who; // userHash optional with getUserHash
// @ts-expect-error user_hash is never computed on the device: no secret option exists
const leak:IdentifyOptions={userId:'1001',identitySecret:'s'};void leak;
const store:SecureStorage=memoryStorage();void store;void keychainStorage({setGenericPassword:async()=>true,getGenericPassword:async()=>false,resetGenericPassword:async()=>true});
const link:string|null=parseConversationLink('myapp://conversation/x');void link;void conversationURL('x');
const file=fileAttachment('file:///a.png',{maxBytes:1});const uri:string=file.uri;void uri;
const chat:ChatScreenProps={conversation:null,pickFile:async()=>({uri:'file:///a',name:'a',type:'image/png'})};void chat;
// @ts-expect-error a chat screen is always told which conversation (or null for a new one)
const noConversation:ChatScreenProps={};void noConversation;
const theme:ClickFixTheme['colors']['primary']='#000';void theme;
const m:Message['direction']='in';void m;
// Contact upsert by your user id: ContactInput plus a required external_id (was ContactInput & Record<string, never>).
void api.request('/v1/public-api/contacts/by-external-id','put',{external_id:'1001',name:'Ada',email:'ada@example.test'},{idempotencyKey:'u-1001'});
// @ts-expect-error external_id is required for the upsert
void api.request('/v1/public-api/contacts/by-external-id','put',{name:'Ada'},{idempotencyKey:'u-1001'});
// Company events: source is optional (the API defaults it to "api").
void api.request('/v1/public-api/company-events','post',{external_id:'F-77',name:'seat_limit_reached'},{idempotencyKey:'e-1'});
// sdk('reset') resolves like sdk.reset() (was typed void).
const resetting:Promise<void>=sdk('reset');void resetting;
const resetMethod:Promise<void>=sdk.reset();void resetMethod;
// Headless client on your own domain: the ClickFix app origin, not a same-origin proxy.
const crossOrigin=createWidgetClient({publicId:'id',appOrigin:'https://app.example.test'});void crossOrigin;
// Bridge events carry typed payloads (were unknown); narrowing on the event name gives the payload.
import { parseMessage as rnParseMessage, commandScript as rnCommandScript } from '../react-native/dist/index.js';
const ev=parseMessage('{"type":"clickfix:event","event":"unread","payload":{"count":2}}');
if(ev?.type==='clickfix:event'&&ev.event==='unread'){const n:number=ev.payload.count;void n;}
if(ev?.type==='clickfix:event'&&ev.event==='identify'){const ok:boolean=ev.payload.company_verified;void ok;}
// @ts-expect-error payload fields are typed per event
if(ev?.type==='clickfix:event'&&ev.event==='unread'){const s:string=ev.payload.count;void s;}
void rnParseMessage;void rnCommandScript({type:'clickfix:session',token:'t'});
