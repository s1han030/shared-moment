import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { Ic } from '../components/Ic.jsx';

export const CreateEvent = ({ onBack, onGoTo, initialPlan }) => {
  const [name, setName] = useState(initialPlan ? initialPlan.name : "");
  const [desc, setDesc] = useState(initialPlan ? (initialPlan.desc||"") : "");
  const [loc,  setLoc]  = useState(initialPlan ? (initialPlan.loc||"")  : "");
  const [selectedDate, setSelectedDate] = useState(initialPlan ? initialPlan.date : null);
  const [selectedStyle, setSelectedStyle] = useState(initialPlan ? (initialPlan.style||[]) : []);
  const [privacy, setPrivacy] = useState(false);
  const [refs, setRefs] = useState(initialPlan ? (initialPlan.refs||[]) : []);
  const [showAddRef, setShowAddRef] = useState(false);
  const [refPreview, setRefPreview] = useState(null);
  const [refLabel, setRefLabel] = useState("");
  const [collaborators, setCollaborators] = useState(
    initialPlan ? (initialPlan.collaborators||[{name:"You",role:"Owner",status:"active"}])
                : [{name:"You",role:"Owner",status:"active"}]
  );
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("view");

  const styleOptions = ["Golden hour","Candid","Moody","Close-up","Bright","Urban","BW","Soft light","Portrait","Street"];
  const dates = ["Mar 22","Mar 28","Apr 5","Apr 12","No date"];

  function toggleStyle(s) {
    setSelectedStyle(function(prev){ return prev.includes(s) ? prev.filter(function(x){return x!==s;}) : [...prev,s]; });
  }
  function sendInvite() {
    if (!inviteName.trim()) return;
    setCollaborators(function(prev){ return [...prev, {name:inviteName.trim(), role:inviteRole, status:"pending"}]; });
    setInviteName(""); setShowInvite(false);
  }
  function handleRefFile(e) {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = function(ev){ setRefPreview(ev.target.result); };
    rd.readAsDataURL(f);
  }
  function saveRef() {
    if (!refPreview) return;
    setRefs(function(prev){ return [{src:refPreview, label:refLabel||"Reference", color:null}, ...prev]; });
    setRefPreview(null); setRefLabel(""); setShowAddRef(false);
  }

  const isEdit = !!initialPlan;

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",background:C.white }}>
      <StatusBar/>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid "+C.gray100 }}>
        <button onClick={onBack} style={{ width:40,height:40,borderRadius:20,background:C.gray100,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.dark} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <p style={{ fontSize:15,fontWeight:700,color:C.dark,margin:0 }}>{isEdit ? "Edit Plan" : "Create Plan"}</p>
        <button onClick={onBack} style={{ width:40,height:40,borderRadius:20,background:C.gray100,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.dark} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>

      <div style={{ flex:1,overflowY:"auto",padding:"16px 20px 40px" }}>

        {/* Name + Desc */}
        <div style={{ background:C.gray50,borderRadius:20,overflow:"hidden",marginBottom:20,border:"1px solid "+C.gray100 }}>
          <div style={{ display:"flex",alignItems:"center",padding:"14px 16px",borderBottom:"1px solid "+C.gray100 }}>
            <div style={{ width:36,height:36,borderRadius:12,background:C.white,border:"1px solid "+C.gray200,display:"flex",alignItems:"center",justifyContent:"center",marginRight:12,flexShrink:0 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.gray600} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <input value={name} onChange={function(e){setName(e.target.value);}} placeholder="Plan name"
              style={{ flex:1,fontSize:15,fontWeight:600,color:C.dark,background:"none",border:"none",outline:"none",fontFamily:"inherit" }}/>
          </div>
          <div style={{ display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid "+C.gray100 }}>
            <div style={{ width:36,height:36,borderRadius:12,background:C.white,border:"1px solid "+C.gray200,display:"flex",alignItems:"center",justifyContent:"center",marginRight:12,flexShrink:0 }}>
              <Ic n="location" size={14} color={C.gray600}/>
            </div>
            <input value={loc} onChange={function(e){setLoc(e.target.value);}} placeholder="Add location"
              style={{ flex:1,fontSize:14,color:C.dark,background:"none",border:"none",outline:"none",fontFamily:"inherit" }}/>
          </div>
          <div style={{ display:"flex",alignItems:"center",padding:"12px 16px" }}>
            <div style={{ width:36,height:36,borderRadius:12,background:C.white,border:"1px solid "+C.gray200,display:"flex",alignItems:"center",justifyContent:"center",marginRight:12,flexShrink:0 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.gray600} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg>
            </div>
            <input value={desc} onChange={function(e){setDesc(e.target.value);}} placeholder="Add description"
              style={{ flex:1,fontSize:13,color:C.gray600,background:"none",border:"none",outline:"none",fontFamily:"inherit" }}/>
          </div>
        </div>

        {/* Date */}
        <p style={{ fontSize:13,fontWeight:700,color:C.dark,margin:"0 0 10px" }}>Date</p>
        <div style={{ display:"flex",gap:8,overflowX:"auto",marginBottom:20,paddingBottom:2 }}>
          {dates.map(function(d){
            return <button key={d} onClick={function(){setSelectedDate(d==="No date"?null:d);}}
              style={{ flexShrink:0,padding:"7px 14px",borderRadius:16,border:"1.5px solid "+(selectedDate===d||(d==="No date"&&!selectedDate)?C.dark:C.gray200),background:selectedDate===d||(d==="No date"&&!selectedDate)?C.dark:"transparent",color:selectedDate===d||(d==="No date"&&!selectedDate)?C.white:C.gray600,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{d}</button>;
          })}
        </div>

        {/* Style tags */}
        <p style={{ fontSize:13,fontWeight:700,color:C.dark,margin:"0 0 10px" }}>Style / Focus</p>
        <div style={{ display:"flex",gap:7,flexWrap:"wrap",marginBottom:20 }}>
          {styleOptions.map(function(s){
            const on=selectedStyle.includes(s);
            return <button key={s} onClick={function(){toggleStyle(s);}}
              style={{ padding:"6px 13px",borderRadius:16,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:on?700:400,background:on?C.dark:C.gray100,color:on?C.white:C.gray600 }}>{s}</button>;
          })}
        </div>

        {/* References */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <div>
            <p style={{ fontSize:13,fontWeight:700,color:C.dark,margin:0 }}>References</p>
            <p style={{ fontSize:11,color:C.gray400,margin:"2px 0 0" }}>Add inspiration images for your shoot</p>
          </div>
          <button onClick={function(){setShowAddRef(true);}}
            style={{ width:32,height:32,borderRadius:16,background:C.dark,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic n="plus" size={13} color={C.white}/>
          </button>
        </div>
        {refs.length===0 && (
          <div onClick={function(){setShowAddRef(true);}}
            style={{ height:90,borderRadius:16,border:"2px dashed "+C.gray200,background:C.gray50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",marginBottom:20 }}>
            <Ic n="plus" size={20} color={C.gray400}/>
            <span style={{ fontSize:12,color:C.gray400,fontFamily:"inherit" }}>Add reference images</span>
          </div>
        )}
        {refs.length>0 && (
          <div style={{ display:"flex",gap:8,overflowX:"auto",marginBottom:20,paddingBottom:2 }}>
            {refs.map(function(r,i){
              return (
                <div key={i} style={{ flexShrink:0,width:72,height:90,borderRadius:12,overflow:"hidden",position:"relative",border:"1.5px solid "+C.gray100 }}>
                  {r.src ? <img src={r.src} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""/>
                    : <div style={{ width:"100%",height:"100%",background:r.color||C.gray200,display:"flex",alignItems:"center",justifyContent:"center" }}><Ic n="image" size={16} color="rgba(255,255,255,0.6)"/></div>}
                  {r.label && (
                    <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.6))",padding:"10px 4px 4px" }}>
                      <p style={{ fontSize:8,color:C.white,margin:0,lineHeight:1.2 }}>{r.label}</p>
                    </div>
                  )}
                </div>
              );
            })}
            <div onClick={function(){setShowAddRef(true);}}
              style={{ flexShrink:0,width:72,height:90,borderRadius:12,border:"2px dashed "+C.gray200,background:C.gray50,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
              <Ic n="plus" size={16} color={C.gray400}/>
            </div>
          </div>
        )}

        {/* Collaborators */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <p style={{ fontSize:13,fontWeight:700,color:C.dark,margin:0 }}>Members ({collaborators.length})</p>
          <button onClick={function(){setShowInvite(true);}}
            style={{ fontSize:12,fontWeight:600,color:C.dark,background:C.gray100,border:"none",cursor:"pointer",borderRadius:10,padding:"5px 12px",fontFamily:"inherit" }}>+ Invite</button>
        </div>
        <div style={{ display:"flex",gap:14,overflowX:"auto",marginBottom:20,paddingBottom:4 }}>
          {collaborators.map(function(c,i){
            const isPending = c.status==="pending";
            const colors=["#D4A853","#8B7BAB","#7BAB8B","#AB8B7B","#7B9BAB"];
            return (
              <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5,flexShrink:0 }}>
                <div style={{ position:"relative" }}>
                  <div style={{ width:50,height:50,borderRadius:25,background:isPending?"rgba(0,0,0,0.08)":colors[i%colors.length],border:isPending?"2px dashed "+C.gray300:"2px solid "+C.white,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isPending?"none":"0 2px 8px rgba(0,0,0,0.12)",opacity:isPending?0.7:1 }}>
                    <span style={{ fontSize:18,filter:isPending?"grayscale(1)":"none" }}>👤</span>
                  </div>
                  {/* Status dot */}
                  <div style={{ position:"absolute",bottom:0,right:0,width:14,height:14,borderRadius:7,background:isPending?C.gray400:"#4ADE80",border:"2px solid "+C.white,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    {isPending && <span style={{ fontSize:7,color:C.white,fontWeight:700 }}>?</span>}
                  </div>
                </div>
                <p style={{ fontSize:10,fontWeight:600,color:C.dark,margin:0,textAlign:"center" }}>{c.name}</p>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
                  <span style={{ fontSize:9,color:isPending?C.gray400:C.gray600,fontFamily:"inherit",background:isPending?"rgba(0,0,0,0.06)":C.gray100,borderRadius:5,padding:"1px 6px" }}>{c.role}</span>
                  {isPending && <span style={{ fontSize:8,color:C.gray400,fontStyle:"italic" }}>Pending</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Privacy */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:C.gray50,borderRadius:16,padding:"14px 16px",marginBottom:24,border:"1px solid "+C.gray100 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.gray600} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div>
              <p style={{ fontSize:13,fontWeight:600,color:C.dark,margin:0 }}>Private plan</p>
              <p style={{ fontSize:11,color:C.gray400,margin:0 }}>Only members can view</p>
            </div>
          </div>
          <div onClick={function(){setPrivacy(function(v){return !v;});}} style={{ width:38,height:22,borderRadius:11,background:privacy?C.dark:"rgba(0,0,0,0.15)",position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0 }}>
            <div style={{ width:18,height:18,borderRadius:9,background:C.white,position:"absolute",top:2,left:privacy?18:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
          </div>
        </div>

        <button onClick={function(){onGoTo("eventDetail");}}
          style={{ width:"100%",padding:"16px 0",borderRadius:18,background:name?C.dark:"rgba(0,0,0,0.1)",border:"none",cursor:name?"pointer":"not-allowed",fontSize:15,fontWeight:700,color:name?C.white:C.gray400,fontFamily:"inherit" }}>
          {isEdit ? "Save Changes" : "Create Plan"}
        </button>
      </div>

      {/* Add Ref sheet */}
      {showAddRef && (
        <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"flex-end" }}
          onClick={function(e){if(e.target===e.currentTarget){setShowAddRef(false);setRefPreview(null);setRefLabel("");}}}>
          <div style={{ width:"100%",background:C.white,borderRadius:"24px 24px 0 0",padding:"20px 20px 44px" }}>
            <div style={{ width:36,height:4,background:C.gray200,borderRadius:2,margin:"0 auto 16px" }}/>
            <p style={{ fontSize:16,fontWeight:700,color:C.dark,margin:"0 0 14px" }}>Add Reference Image</p>
            {!refPreview
              ? <label style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:140,borderRadius:16,border:"2px dashed "+C.gray200,background:C.gray50,cursor:"pointer",gap:8 }}>
                  <Ic n="plus" size={26} color={C.gray400}/>
                  <span style={{ fontSize:13,color:C.gray400,fontFamily:"inherit" }}>Tap to upload</span>
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleRefFile}/>
                </label>
              : <img src={refPreview} style={{ width:"100%",height:140,objectFit:"cover",borderRadius:14,marginBottom:10 }} alt=""/>
            }
            <input value={refLabel} onChange={function(e){setRefLabel(e.target.value);}} placeholder="Label (optional)"
              style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"1.5px solid "+C.gray200,fontSize:13,fontFamily:"inherit",marginTop:8,outline:"none",boxSizing:"border-box" }}/>
            <button onClick={saveRef} disabled={!refPreview}
              style={{ width:"100%",padding:"13px 0",borderRadius:14,background:refPreview?C.dark:"rgba(0,0,0,0.08)",border:"none",cursor:refPreview?"pointer":"not-allowed",fontSize:14,fontWeight:700,color:refPreview?C.white:C.gray400,fontFamily:"inherit",marginTop:12 }}>
              Add to Plan
            </button>
          </div>
        </div>
      )}

      {/* Invite sheet */}
      {showInvite && (
        <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"flex-end" }}
          onClick={function(e){if(e.target===e.currentTarget)setShowInvite(false);}}>
          <div style={{ width:"100%",background:C.white,borderRadius:"24px 24px 0 0",padding:"20px 20px 44px" }}>
            <div style={{ width:36,height:4,background:C.gray200,borderRadius:2,margin:"0 auto 16px" }}/>
            <p style={{ fontSize:16,fontWeight:700,color:C.dark,margin:"0 0 16px" }}>Invite Member</p>
            <input value={inviteName} onChange={function(e){setInviteName(e.target.value);}} placeholder="Name or email"
              style={{ width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid "+C.gray200,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12 }}/>
            <p style={{ fontSize:12,fontWeight:600,color:C.gray600,margin:"0 0 8px" }}>Permission</p>
            <div style={{ display:"flex",gap:8,marginBottom:20 }}>
              {[{id:"view",label:"Can view",desc:"See plan and refs"},{id:"edit",label:"Can edit",desc:"Add refs, edit shots"},{id:"shoot",label:"Can shoot",desc:"Access camera mode"}].map(function(r){
                return (
                  <div key={r.id} onClick={function(){setInviteRole(r.id);}}
                    style={{ flex:1,padding:"10px 8px",borderRadius:14,border:"1.5px solid "+(inviteRole===r.id?C.dark:C.gray200),background:inviteRole===r.id?"rgba(0,0,0,0.04)":"transparent",cursor:"pointer",textAlign:"center" }}>
                    <p style={{ fontSize:12,fontWeight:700,color:C.dark,margin:"0 0 2px" }}>{r.label}</p>
                    <p style={{ fontSize:10,color:C.gray400,margin:0 }}>{r.desc}</p>
                  </div>
                );
              })}
            </div>
            <button onClick={sendInvite}
              style={{ width:"100%",padding:"13px 0",borderRadius:14,background:C.dark,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,color:C.white,fontFamily:"inherit" }}>
              Send Invite
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
