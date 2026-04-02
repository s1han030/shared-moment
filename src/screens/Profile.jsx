import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { FloatingNav } from '../components/FloatingNav.jsx';

export const Profile = ({ onNav }) => (
  <div style={{ display:"flex",flexDirection:"column",height:"100%",position:"relative",background:C.white }}>
    <StatusBar/>
    <div style={{ flex:1,overflowY:"auto",padding:"16px 24px 120px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:28 }}>
        <div style={{ width:64,height:64,borderRadius:32,background:"linear-gradient(135deg,"+C.yellow+",#E8A020)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <span style={{ fontSize:24 }}>👤</span>
        </div>
        <div>
          <p style={{ fontSize:18,fontWeight:700,color:C.dark,margin:"0 0 2px" }}>Your Profile</p>
          <p style={{ fontSize:13,color:C.gray400,margin:0 }}>Photographer</p>
        </div>
      </div>
      {[{label:"My Plans",value:"5 active"},{label:"References saved",value:"8 images"},{label:"Photos taken",value:"47"},{label:"Notifications",value:"On"}].map(function(row,i){
        return <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+C.gray100 }}>
          <span style={{ fontSize:14,color:C.dark,fontFamily:"inherit" }}>{row.label}</span>
          <span style={{ fontSize:13,color:C.gray400,fontFamily:"inherit" }}>{row.value}</span>
        </div>;
      })}
    </div>
    <FloatingNav active="profile" onNav={onNav}/>
  </div>
);
