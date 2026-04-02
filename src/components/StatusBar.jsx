import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';

export const StatusBar = ({ dark=false }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 28px 0", height:44, flexShrink:0 }}>
    <span style={{ fontSize:15, fontWeight:600, color:dark?C.white:C.dark }}>9:41</span>
    <div style={{ display:"flex", gap:5, alignItems:"center" }}>
      {[3,2,1].map(b=><div key={b} style={{ width:4, height:b*4+4, background:dark?C.white:C.dark, borderRadius:2, opacity:b===1?0.3:1 }}/>)}
      <div style={{ width:16, height:10, border:`1.5px solid ${dark?C.white:C.dark}`, borderRadius:3, marginLeft:2, position:"relative" }}>
        <div style={{ width:10, height:6, background:dark?C.white:C.dark, borderRadius:1.5, position:"absolute", top:1, left:1 }}/>
      </div>
    </div>
  </div>
);

// ─── Floating Nav — ALL TABS: icon on top, label below ────────────────────────
