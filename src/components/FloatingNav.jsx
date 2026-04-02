import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { Ic } from './Ic.jsx';

export const FloatingNav = ({ active, onNav }) => (
  <div style={{ position:"absolute", bottom:20, left:0, right:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
    {/* Left capsule: Plan / Ref / Profile */}
    <div style={{ display:"flex", alignItems:"center", background:C.dark, borderRadius:28, padding:"6px 6px", boxShadow:"0 8px 32px rgba(0,0,0,0.28)" }}>
      {[
        { id:"plan",    label:"Plan",    icon:"plan"    },
        { id:"library", label:"Ref",     icon:"image"   },
        { id:"profile", label:"Profile", icon:"profile" },
      ].map(function(tab) {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={function(){ onNav(tab.id); }} style={{
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2,
            background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
            border:"none", cursor:"pointer", padding:"7px 16px", borderRadius:22,
          }}>
            <Ic n={tab.icon} size={17} color={isActive ? C.white : "rgba(255,255,255,0.4)"} />
            <span style={{ fontSize:9, fontWeight:isActive?700:400, color:isActive?C.white:"rgba(255,255,255,0.4)", letterSpacing:0.2 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
    {/* Right: Shoot button */}
    <button onClick={function(){ onNav("shoot"); }}
      style={{ width:56, height:56, borderRadius:28, background:C.yellow, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(245,200,66,0.5)" }}>
      <Ic n="camera" size={22} color={C.dark}/>
    </button>
  </div>
);

// ─── Chip ─────────────────────────────────────────────────────────────────────
