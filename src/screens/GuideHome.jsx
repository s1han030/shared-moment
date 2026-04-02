import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { FloatingNav } from '../components/FloatingNav.jsx';

export const GuideHome = ({ onNav, onGoTo }) => (
  <div style={{ display:"flex",flexDirection:"column",height:"100%",position:"relative",background:C.white }}>
    <StatusBar/>
    <div style={{ flex:1,overflowY:"auto",padding:"16px 24px 120px" }}>
      <h1 style={{ fontSize:24,fontWeight:700,color:C.dark,margin:"0 0 4px" }}>Guides</h1>
      <p style={{ fontSize:13,color:C.gray400,margin:"0 0 24px" }}>Tips for better photos</p>
      {[{title:"Lighting basics",desc:"Golden hour, soft light, avoid harsh midday sun",color:"#F5E6C8"},{title:"Composition rules",desc:"Rule of thirds, leading lines, framing",color:"#C8D8E8"},{title:"Posing people",desc:"Natural stances, hands, eye contact",color:"#D8C8E8"},{title:"Camera settings",desc:"Exposure, portrait mode, zoom tips",color:"#C8E8D0"}].map(function(g,i){
        return <div key={i} style={{ background:g.color,borderRadius:18,padding:18,marginBottom:12,cursor:"pointer" }}>
          <p style={{ fontSize:16,fontWeight:700,color:C.dark,margin:"0 0 4px" }}>{g.title}</p>
          <p style={{ fontSize:13,color:"rgba(0,0,0,0.55)",margin:0 }}>{g.desc}</p>
        </div>;
      })}
    </div>
    <FloatingNav active="guide" onNav={onNav}/>
  </div>
);
