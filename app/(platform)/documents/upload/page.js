"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {getParcels,createParcel} from "@/services/api/parcels";
import {uploadDocument} from "@/services/api/documents";
import {useAuth} from "@/context/AuthContext";
import styles from "./upload.module.css";
export default function UploadPage(){
 const router=useRouter(), {user}=useAuth();
 const [parcels,setParcels]=useState([]), [parcelId,setParcelId]=useState(""), [busy,setBusy]=useState(false), [error,setError]=useState("");
 useEffect(()=>{getParcels().then(data=>{setParcels(data);setParcelId(new URLSearchParams(window.location.search).get("parcelId") || data[0]?.id || "new");}).catch(err=>setError(err.message));},[]);
 async function submit(event){
  event.preventDefault();setBusy(true);setError("");
  try{
   const form=new FormData(event.currentTarget);let id=parcelId;
   if(id==="new"){const p=await createParcel({surveyNumber:form.get("surveyNumber"),currentRecordedOwner:form.get("owner"),village:form.get("village"),tehsil:form.get("tehsil"),district:user.district});id=p.id;}
   const data=new FormData();["file","language","documentType"].forEach(k=>data.set(k,form.get(k)));data.set("parcelId",id);
   const doc=await uploadDocument(data);router.push("/documents/"+doc.id);
  }catch(err){setError(err.message);setBusy(false);}
 }
 return <div className={styles.page}><Link href="/documents">← Documents</Link><h1>Upload source evidence</h1><p>Local English / Hindi OCR. Originals stay on this computer. Results require officer review.</p>
 <form className={styles.form} onSubmit={submit}>
 <label>Linked parcel<select value={parcelId} onChange={e=>setParcelId(e.target.value)} required><option value="" disabled>Select a parcel</option>{parcels.map(p=><option key={p.id} value={p.id}>{p.id} · {p.currentRecordedOwner}{p.sample?" (synthetic sample)":""}</option>)}<option value="new">Create a new parcel</option></select></label>
 {parcelId==="new" && <fieldset><legend>Parcel context — manually entered, not yet verified</legend>{[["surveyNumber","Survey / Khasra number"],["owner","Recorded owner"],["village","Village"],["tehsil","Tehsil"]].map(([key,label])=><label key={key}>{label}<input name={key} required maxLength={100}/></label>)}<p>Assigned district: {user?.district}</p></fieldset>}
 <label>Document type<select name="documentType">{["Auto detect","Current RoR","Historical RoR","Registration Deed","Mutation Record","GIS Extract","Other"].map(type=><option key={type}>{type}</option>)}</select></label>
 <label>Recognition language<select name="language" defaultValue="eng+hin"><option value="eng+hin">English + Hindi</option><option value="eng">English</option><option value="hin">Hindi</option></select></label>
 <label>Source file<input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff" required /></label>
 <p>PDF, PNG, JPEG or TIFF · up to 20 MB / 20 pages. Printed text is the MVP focus; handwriting and damaged scans may need manual review.</p>
 {error && <p role="alert">{error}</p>}<button disabled={busy || !parcelId}>{busy?"Uploading locally…":"Upload and process"}</button></form></div>;
}
