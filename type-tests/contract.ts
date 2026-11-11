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
