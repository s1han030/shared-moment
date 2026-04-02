import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { Ic } from '../components/Ic.jsx';

export const PlanRefDetail = ({ plan, onBack, onAddRef, uploadedRefs }) => {
  const planRefs = (uploadedRefs||[]).filter(function(r){ return r.planId===plan.id; });
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",background:C.white }}>
      <StatusBar/>
      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:"1px solid "+C.gray100 }}>
        <button onClick={onBack} style={{ width:36,height:36,borderRadius:18,background:C.gray100,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.dark} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:15,fontWeight:700,color:C.dark,margin:0 }}>{plan.name}</p>
          <p style={{ fontSize:11,color:C.gray400,margin:0 }}>{plan.date||"No date"} · {planRefs.length} references</p>
        </div>
        <button onClick={function(){setShowAdd(true);}}
          style={{ width:34,height:34,borderRadius:17,background:C.dark,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <Ic n="plus" size={14} color={C.white}/>
        </button>
      </div>

      <div style={{ flex:1,overflowY:"auto",padding:"16px 20px 40px" }}>
        {planRefs.length===0 && (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 0",gap:12 }}>
            <div style={{ width:64,height:64,borderRadius:32,background:C.gray100,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Ic n="image" size={24} color={C.gray400}/>
            </div>
            <p style={{ fontSize:15,fontWeight:600,color:C.dark,margin:0 }}>No references yet</p>
            <p style={{ fontSize:13,color:C.gray400,margin:0,textAlign:"center" }}>Add reference images to guide your shoot</p>
            <button onClick={function(){setShowAdd(true);}}
              style={{ marginTop:8,padding:"11px 24px",borderRadius:14,background:C.dark,border:"none",cursor:"pointer",fontSize:14,fontWeight:600,color:C.white,fontFamily:"inherit" }}>
              Add Reference
            </button>
          </div>
        )}
        {planRefs.length>0 && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {planRefs.map(function(item,idx){
              const tall=idx%3===0;
              return (
                <div key={idx} style={{ borderRadius:14,overflow:"hidden",aspectRatio:tall?"3/4":"1/1",background:item.src?"transparent":item.color||C.gray200,position:"relative",boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
                  {item.src && <img src={item.src} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""/>}
                  <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.55))",padding:"24px 10px 8px" }}>
                    <p style={{ fontSize:10,fontWeight:600,color:C.white,margin:0 }}>{item.label}</p>
                  </div>
                  {item.poses&&item.poses.people&&item.poses.people.length>0&&(
                    <div style={{ position:"absolute",top:6,right:6,background:C.yellow,borderRadius:6,padding:"2px 5px" }}>
                      <span style={{ fontSize:8,fontWeight:700,color:C.dark }}>AI</span>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Add more card */}
            <div onClick={function(){setShowAdd(true);}}
              style={{ borderRadius:14,aspectRatio:"1/1",background:C.gray50,border:"2px dashed "+C.gray200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer" }}>
              <Ic n="plus" size={22} color={C.gray400}/>
              <span style={{ fontSize:11,color:C.gray400,fontFamily:"inherit" }}>Add ref</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload sheet */}
      {showAdd && (
        <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"flex-end" }}
          onClick={function(e){if(e.target===e.currentTarget)setShowAdd(false);}}>
          <div style={{ width:"100%",background:C.white,borderRadius:"24px 24px 0 0",padding:"20px 20px 40px" }}>
            <div style={{ width:36,height:4,background:C.gray200,borderRadius:2,margin:"0 auto 16px" }}/>
            <p style={{ fontSize:16,fontWeight:700,color:C.dark,margin:"0 0 14px" }}>Add to {plan.name}</p>
            <label style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:140,borderRadius:16,border:"2px dashed "+C.gray200,background:C.gray50,cursor:"pointer",gap:8 }}>
              <Ic n="plus" size={26} color={C.gray400}/>
              <span style={{ fontSize:13,color:C.gray400,fontFamily:"inherit" }}>Tap to upload image</span>
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={function(e){
                const f=e.target.files[0]; if(!f) return;
                const rd=new FileReader();
                rd.onload=function(ev){
                  onAddRef({ src:ev.target.result, label:"Reference", cat:"Portraits", planId:plan.id, color:null, poses:null });
                  setShowAdd(false);
                };
                rd.readAsDataURL(f);
              }}/>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
