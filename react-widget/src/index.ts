'use client';
// UI-free visitor client for React (CF-199). The transport lives in
// @getclickfix/visitor-core (CF-201): this package only binds it to React in
// browser mode (same-origin BFF, the page origin is the credential).
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  createVisitorClient,
  VisitorError,
  type AbortSignalLike,
  type FileInput,
  type VisitorClientOptions,
} from '@getclickfix/visitor-core';
export type { paths, components } from '@getclickfix/visitor-core';
export type {
  Bootstrap, Visitor, Conversation, MessagePage, SendInput, IdentifyInput, HelpResult, Session,
} from '@getclickfix/visitor-core';
/** Error of a visitor API call (`status`, `code`); the core's VisitorError. */
export const WidgetError = VisitorError;
export type WidgetError = VisitorError;
export interface WidgetOptions extends Omit<VisitorClientOptions,'mode'|'app'> {
 /** Same-origin BFF prefix, usually /api. */
 baseURL?:string;
}
/** Create once per mounted widget. No global storage, DOM access or shared user state. */
export function createWidgetClient(options:WidgetOptions){
 return createVisitorClient({...options,mode:'browser'});
}
export type WidgetClient=ReturnType<typeof createWidgetClient>;
/** Keep client stable (useState/useMemo); call init explicitly after consent. */
export function useWidget(client:WidgetClient){return {...useSyncExternalStore(client.subscribe,client.getSnapshot,client.getSnapshot),client,init:client.init,identify:client.identify,createConversation:client.createConversation,sendMessage:client.sendMessage,typing:client.typing,helpSearch:client.helpSearch};}
function useResource<T>(load:(signal:AbortSignalLike)=>Promise<T>){
 const [state,setState]=useState<{data:T|null;error:unknown;loading:boolean;source:typeof load|null}>({data:null,error:null,loading:true,source:null});
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  const abort=new AbortController();setState({data:null,error:null,loading:true,source:load});
  void load(abort.signal).then(data=>{if(!abort.signal.aborted)setState({data,error:null,loading:false,source:load});},error=>{if(!abort.signal.aborted)setState({data:null,error,loading:false,source:load});});
  return()=>abort.abort();
 },[load,revision]);
 const reload=useCallback(()=>setRevision(v=>v+1),[]);
 return state.source===load ? {...state,reload} : {data:null,error:null,loading:true,reload};
}
export function useConversations(client:WidgetClient){const session=useSyncExternalStore(client.subscribe,client.getSnapshot,client.getSnapshot);return useResource(useCallback(signal=>client.conversations(signal),[client,session]));}
export function useMessages(client:WidgetClient,conversation:string){const session=useSyncExternalStore(client.subscribe,client.getSnapshot,client.getSnapshot);return useResource(useCallback(signal=>client.messages(conversation,{},signal),[client,conversation,session]));}
export function useHelpSearch(client:WidgetClient,q:string,locale:'tr'|'en'='tr'){return useResource(useCallback(signal=>client.helpSearch(q,locale,signal),[client,q,locale]));}
export function useTyping(client:WidgetClient,conversation:string){return useCallback((typing:boolean,signal?:AbortSignalLike)=>client.typing(conversation,typing,signal),[client,conversation]);}
export type { FileInput };
export { loadClickFix, clickFix, useClickFix, useClickFixEvent } from './script.js';
export type { LoadOptions, ClickFixWidgetState } from './script.js';
export type * from './clickfix.js';
