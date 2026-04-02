import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';

export const StatusBar = ({ dark=false }) => {
  const fmt = () => { const n = new Date(); return n.getHours() + ':' + String(n.getMinutes()).padStart(2,'0'); };
  const [time, setTime] = useState(fmt);
  useEffect(() => { const t = setInterval(() => setTime(fmt()), 10000); return () => clearInterval(t); }, []);
  return (
    <div className="mock-status-bar" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 28px 0", height:44, flexShrink:0 }}>
      <span style={{ fontSize:15, fontWeight:600, color:dark?C.white:C.dark }}>{time}</span>
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        {/* WiFi */}
        <svg width={16} height={12} viewBox="0 0 24 18" fill="none">
          <circle cx="12" cy="16" r="2" fill={dark?C.white:C.dark}/>
          <path d="M7 11.5a7.5 7.5 0 0 1 10 0" stroke={dark?C.white:C.dark} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.65"/>
          <path d="M2.5 7a13.5 13.5 0 0 1 19 0" stroke={dark?C.white:C.dark} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.35"/>
        </svg>
        {/* Battery */}
        <svg width={25} height={13} viewBox="0 0 25 13" fill="none">
          <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" stroke={dark?C.white:C.dark} strokeOpacity="0.4"/>
          <rect x="2" y="2" width="16" height="9" rx="2" fill={dark?C.white:C.dark}/>
          <path d="M23 4.5v4a2 2 0 0 0 0-4z" fill={dark?C.white:C.dark} fillOpacity="0.45"/>
        </svg>
      </div>
    </div>
  );
};

// ─── Floating Nav — ALL TABS: icon on top, label below ────────────────────────
