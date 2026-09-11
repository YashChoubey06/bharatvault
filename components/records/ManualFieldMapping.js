"use client";
import {useState} from "react";
import api from "@/services/api/client";
import {useAuth} from "@/context/AuthContext";
import styles from "./ManualFieldMapping.module.css";
const fields=["owner_name","buyer","seller","survey_number","khata_number","area","gis_area","village","tehsil","district","land_classification","mutation_status","mutation_number","mutation_date","registration_number","registration_date"];
export default function ManualFieldMapping({document,onSaved}){
 const {user}=useAuth();const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 if(!["verification_officer","revenue_officer"].includes(user?.role)||!document.ocrLines?.length)return null;
 async function save(event){event.preventDefault();const form=event.currentTarget;const data=new FormData(form);setBusy(true);setError("");try{await api.post(`/documents/${document.id}/fields`,{lineIndex:Number(data.get("lineIndex")),field:data.get("field"),value:data.get("value"),notes:data.get("notes")});await onSaved();form.reset();}catch(err){setError(err.message);}finally{setBusy(false);}}
 return <details className={styles.mapping}><summary>Map a missed field from OCR text</summary><p>Choose the actual source line and enter the field value. The original text, confidence and source region remain attached. This does not automatically verify the field.</p><form onSubmit={save}><label>OCR source line<select name="lineIndex" required>{document.ocrLines.map((line,i)=><option value={i} key={i}>Page {line.page} · {line.text}</option>)}</select></label><label>Field type<select name="field">{fields.map(field=><option key={field} value={field}>{field.replaceAll("_"," ")}</option>)}</select></label><label>Mapped value<input name="value" maxLength={1000} required/></label><label>Mapping note<input name="notes" maxLength={4000} required/></label>{error&&<p role="alert">{error}</p>}<button disabled={busy}>{busy?"Saving…":"Save source-linked field"}</button></form></details>;
}
