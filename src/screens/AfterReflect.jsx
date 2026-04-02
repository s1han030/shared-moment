import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { FloatingNav } from '../components/FloatingNav.jsx';
import { Ic } from '../components/Ic.jsx';

export const AfterReflect = ({ onNav, onBack }) => (
  <div style={{ display:"flex",flexDirection:"column",height:"100%",position:"relative" }}>
    <StatusBar/>
    <div style={{ flex:1,overflowY:"auto",padding:"0 0 110px" }}>
      <div style={{ padding:"4px 24px 0" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:8 }}><Ic n="back" size={20} color={C.dark}/></button>
      </div>
      <div style={{ background:C.dark,margin:"0 24px",borderRadius:24,padding:24,marginBottom:24,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-30,right:-30,width:120,height:120,background:C.yellow,borderRadius:"50%",opacity:0.12 }}/>
        <p style={{ fontSize:11,color:C.gray400,margin:"0 0 8px",letterSpacing:1,textTransform:"uppercase" }}>Captured · Mar 22</p>
        <h2 style={{ fontSize:24,fontWeight:700,color:C.white,margin:"0 0 6px" }}>Graduation Day</h2>
        <p style={{ fontSize:14,color:C.gray400,margin:"0 0 16px" }}>Central Park — with Alex & Jamie</p>
        <div style={{ display:"flex",gap:10 }}>
          {[{n:"5",l:"shots planned",col:C.yellow},{n:"23",l:"photos taken",col:C.white},{n:"2",l:"collaborators",col:C.white}].map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.08)",borderRadius:10,padding:"6px 14px",textAlign:"center" }}>
              <p style={{ fontSize:20,fontWeight:700,color:s.col,margin:0 }}>{s.n}</p>
              <p style={{ fontSize:11,color:C.gray400,margin:0 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:"0 24px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <h3 style={{ fontSize:16,fontWeight:600,color:C.dark,margin:0 }}>Moments from this day</h3>
          <span style={{ fontSize:13,color:C.gray400 }}>See all</span>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20 }}>
          <div style={{ aspectRatio:"3/4",borderRadius:14,background:"linear-gradient(135deg,#F0C27F,#E8A84C)",gridRow:"1 / span 2" }}/>
          <div style={{ aspectRatio:"1",borderRadius:14,background:"linear-gradient(135deg,#C5D5C5,#A5C0A5)" }}/>
          <div style={{ aspectRatio:"1",borderRadius:14,background:"linear-gradient(135deg,#C8BAD8,#A89AC8)" }}/>
        </div>
        <h3 style={{ fontSize:16,fontWeight:600,color:C.dark,margin:"0 0 12px" }}>How it went</h3>
        {[{s:"Walk at the fountain",done:true},{s:"Cap toss",done:true},{s:"Diploma close-up",done:true},{s:"Family portrait",done:false},{s:"Candid walk away",done:true}].map((item,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.gray100}` }}>
            <div style={{ width:22,height:22,borderRadius:11,background:item.done?C.yellow:C.gray100,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {item.done&&<Ic n="check" size={11} color={C.dark}/>}
            </div>
            <p style={{ margin:0,fontSize:14,color:item.done?C.dark:C.gray400,fontWeight:item.done?500:400 }}>{item.s}</p>
          </div>
        ))}
        <div style={{ background:C.yellowLight,borderRadius:16,padding:16,marginTop:20,borderLeft:`3px solid ${C.yellow}` }}>
          <p style={{ fontSize:13,fontWeight:600,color:C.dark,margin:"0 0 6px" }}>✨ A moment worth keeping</p>
          <p style={{ fontSize:13,color:C.gray600,margin:0,lineHeight:1.6 }}>4 out of 5 shots captured just as you planned.</p>
        </div>
      </div>
    </div>
    <FloatingNav active="plan" onNav={onNav}/>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// S6 — REFERENCE LIBRARY  (with Claude API pose analysis)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PlanRefDetail: shown when tapping a plan inside Library ─────────────────
