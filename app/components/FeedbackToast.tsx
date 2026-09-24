'use client';
import {CheckCircle2,AlertCircle,X} from 'lucide-react';
export function FeedbackToast({message,error=false,onClose}:{message:string;error?:boolean;onClose:()=>void}){
  if(!message)return null;
  return <div className={`feedback-toast ${error?'is-error':''}`} role={error?'alert':'status'} aria-live={error?'assertive':'polite'}>
    {error?<AlertCircle size={20}/>:<CheckCircle2 size={20}/>}<span>{message}</span>
    <button type="button" aria-label="Fechar mensagem" onClick={onClose}><X size={18}/></button>
  </div>;
}
