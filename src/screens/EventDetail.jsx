import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { FloatingNav } from '../components/FloatingNav.jsx';
import { Ic } from '../components/Ic.jsx';
import { CreateEvent } from './CreateEvent.jsx';

export const EventDetail = ({ onBack, onGoTo, onNav }) => {
  const [editing, setEditing] = useState(false);

  if (editing) return (
    <CreateEvent
      onBack={function(){setEditing(false);}}
      onGoTo={onGoTo}
      initialPlan={{
        name:"Graduation Day", desc:"Our big day at Central Park",
        loc:"Central Park", date:"Mar 22",
        style:["Golden hour","Candid"],
        refs:[{color:"#F0C27F",label:"Fountain walk"},{color:"#C5D5C5",label:"Cap toss"},{color:"#C8BAD8",label:"Diploma detail"}],
        collaborators:[
          {name:"You",role:"Owner",status:"active"},
          {name:"Alex K.",role:"edit",status:"active"},
          {name:"Jamie L.",role:"view",status:"pending"},
        ]
      }}
    />
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",position:"relative" }}>
      <div style={{ background:C.dark,padding:"0 24px 24px",flexShrink:0 }}>
        <StatusBar dark/>
        <div style={{ display:"flex",justifyContent:"space-between",marginTop:8,marginBottom:16 }}>
          <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}>
            <Ic n="back" size={20} color={C.white}/>
          </button>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={function(){setEditing(true);}} style={{ background:"rgba(255,255,255,0.12)",border:"none",cursor:"pointer",padding:"6px 14px",borderRadius:20,display:"flex",alignItems:"center",gap:6 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span style={{ fontSize:13,color:C.white,fontFamily:"inherit" }}>Edit</span>
            </button>
            <button style={{ background:"rgba(255,255,255,0.12)",border:"none",cursor:"pointer",padding:"6px 14px",borderRadius:20,display:"flex",alignItems:"center",gap:6 }}>
              <Ic n="share" size={13} color={C.white}/>
              <span style={{ fontSize:13,color:C.white,fontFamily:"inherit" }}>Share</span>
            </button>
          </div>
        </div>
        <p style={{ fontSize:11,color:C.gray400,margin:"0 0 4px",letterSpacing:1,textTransform:"uppercase" }}>Mar 22 · Central Park</p>
        <h2 style={{ fontSize:26,fontWeight:700,color:C.white,margin:"0 0 6px" }}>Graduation Day</h2>
        <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
          {["Golden hour","Candid"].map(function(t){
            return <span key={t} style={{ fontSize:10,fontWeight:600,background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"2px 9px",color:C.white }}>{t}</span>;
          })}
        </div>
        {/* Collaborators with status */}
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          {[{name:"Alex K.",status:"active"},{name:"Jamie L.",status:"pending"}].map(function(c,i){
            return (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ position:"relative" }}>
                  <div style={{ width:28,height:28,borderRadius:14,background:["rgba(212,168,83,0.9)","rgba(139,123,171,0.5)"][i],border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",opacity:c.status==="pending"?0.65:1 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:C.white }}>{c.name[0]}</span>
                  </div>
                  <div style={{ position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:5,background:c.status==="pending"?"#9CA3AF":"#4ADE80",border:"1.5px solid #1A1A18" }}/>
                </div>
                <span style={{ fontSize:12,color:c.status==="pending"?"rgba(255,255,255,0.45)":C.gray400 }}>{c.name}{c.status==="pending"?" (pending)":""}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex:1,overflowY:"auto",padding:"20px 24px 110px" }}>
        <button onClick={function(){onGoTo("shootCamera");}} style={{ width:"100%",padding:16,background:C.yellow,color:C.dark,borderRadius:16,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24 }}>
          <Ic n="camera" size={18} color={C.dark}/>Start Capturing
        </button>

        {/* Ref strip */}
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:14,fontWeight:600,color:C.dark,margin:"0 0 10px" }}>References</p>
          <div style={{ display:"flex",gap:8,overflowX:"auto" }}>
            {[{color:"#F0C27F",label:"Fountain walk"},{color:"#C5D5C5",label:"Cap toss"},{color:"#C8BAD8",label:"Diploma"}].map(function(r,i){
              return (
                <div key={i} style={{ flexShrink:0,width:64,height:80,borderRadius:12,background:r.color,border:"1.5px solid "+C.gray100,position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.5))",padding:"12px 5px 5px" }}>
                    <p style={{ fontSize:8,color:C.white,margin:0 }}>{r.label}</p>
                  </div>
                </div>
              );
            })}
            <div onClick={function(){setEditing(true);}} style={{ flexShrink:0,width:64,height:80,borderRadius:12,border:"2px dashed "+C.gray200,background:C.gray50,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
              <Ic n="plus" size={16} color={C.gray400}/>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize:14,fontWeight:600,color:C.dark,margin:"0 0 12px" }}>Planned Shots</h3>
        {[
          {t:"Walk together at the fountain",n:"Wide shot, natural movement",ref:"#F0C27F"},
          {t:"Cap toss moment",n:"From below, sky in background",ref:null},
          {t:"Diploma close-up",n:"Detail shot, hands visible",ref:"#C5D5C5"},
          {t:"Family portrait",n:"Golden hour if possible",ref:null},
          {t:"Candid walk away",n:"Long lens, unaware",ref:"#C8BAD8"},
        ].map(function(shot,i){
          return (
            <div key={i} onClick={function(){onGoTo("shootCamera");}} style={{ background:C.gray50,borderRadius:14,padding:14,marginBottom:10,display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer",border:"1px solid "+C.gray100 }}>
              <div style={{ width:24,height:24,borderRadius:12,background:C.gray200,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <span style={{ fontSize:11,fontWeight:700,color:C.gray600 }}>{i+1}</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:0,fontSize:14,fontWeight:600,color:C.dark }}>{shot.t}</p>
                <p style={{ margin:"3px 0 0",fontSize:12,color:C.gray400 }}>{shot.n}</p>
              </div>
              {shot.ref && <div style={{ width:40,height:40,borderRadius:8,background:shot.ref,flexShrink:0 }}/>}
            </div>
          );
        })}
      </div>
      <FloatingNav active="plan" onNav={onNav}/>
    </div>
  );
};
