import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { FloatingNav } from '../components/FloatingNav.jsx';
import { Ic } from '../components/Ic.jsx';
import { PoseSkeleton } from '../components/PoseSkeleton.jsx';
import { analyseRefImage } from '../lib/claude.js';
import { PlanRefDetail } from './PlanRefDetail.jsx';

export const Library = ({ onBack, onNav, onShootWithRef, uploadedRefs, setUploadedRefs }) => {
  const [activeTag, setActiveTag] = useState("All");
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [catInput, setCatInput] = useState("Portraits");
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewBase64, setPreviewBase64] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [poseData, setPoseData] = useState(null);
  const [selectedForView, setSelectedForView] = useState(null);

  const baseRefs = [
    {color:"#F0C27F",label:"Golden hour portrait",cat:"Portraits",src:null,poses:null},
    {color:"#C5D5C5",label:"Park candid",cat:"Candid",src:null,poses:null},
    {color:"#C8BAD8",label:"Close-up hands",cat:"Detail",src:null,poses:null},
    {color:"#B8D4E8",label:"Urban frame",cat:"Architecture",src:null,poses:null},
    {color:"#E8B8A0",label:"Soft light portrait",cat:"Portraits",src:null,poses:null},
    {color:"#B8E8C8",label:"Walking away",cat:"Candid",src:null,poses:null},
  ];
  const plans = [
    {id:0,name:"Graduation Day",date:"Mar 22",color:C.yellow,refs:2},
    {id:1,name:"Café Shoot",date:"Feb 28",color:"#E8D5C0",refs:1},
    {id:2,name:"Street Vibes",date:null,color:"#D0D0D8",refs:0},
  ];
  const collections = [
    {name:"Portraits",color:"#F0C27F",count:8},
    {name:"Candid",color:"#C5D5C5",count:5},
    {name:"Architecture",color:"#B8D4E8",count:4},
    {name:"Detail",color:"#C8BAD8",count:3},
  ];
  const tags = ["All","Portraits","Candid","Detail","Architecture"];
  const all = [...baseRefs,...(uploadedRefs||[])];
  const filtered = activeTag==="All" ? all : all.filter(function(r){return r.cat===activeTag;});

  const handleFile = function(e) {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = function(ev) {
      const dataUrl = ev.target.result;
      setPreviewSrc(dataUrl);
      const b64 = dataUrl.split(",")[1];
      setPreviewBase64(b64);
      setPoseData(null);
      runAnalysis(b64);
    };
    rd.readAsDataURL(f);
  };

  const runAnalysis = async function(b64) {
    setAnalysing(true);
    const result = await analyseRefImage(b64);
    setPoseData(result);
    setAnalysing(false);
  };

  const handleSave = function() {
    if (!previewSrc) return;
    setUploadedRefs(function(prev){return [...prev,{
      src:previewSrc, label:labelInput||"My reference",
      cat:catInput, color:null, poses:poseData,
    }];});
    setPreviewSrc(null); setPreviewBase64(null); setLabelInput(""); setCatInput("Portraits"); setPoseData(null); setShowUploadSheet(false);
  };

  // Full-screen viewer
  const Viewer = function({ item, onClose, onShootWithRef }) {
    const [mode, setMode] = useState("full");
    const imgW = 320, imgH = 400;
    const firstPerson = item.poses && item.poses.people && item.poses.people[0];
    return (
      <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.96)",zIndex:200,display:"flex",flexDirection:"column" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"56px 20px 16px" }}>
          <p style={{ margin:0,fontSize:15,fontWeight:600,color:C.white }}>{item.label}</p>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",width:36,height:36,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic n="close" size={16} color={C.white}/>
          </button>
        </div>
        {item.src && firstPerson && (
          <div style={{ display:"flex",background:"rgba(255,255,255,0.08)",borderRadius:12,padding:3,margin:"0 20px 16px",width:"fit-content",alignSelf:"center" }}>
            {[{id:"full",label:"Full photo"},{id:"skeleton",label:"Pose outline"}].map(function(opt){
              return <button key={opt.id} onClick={function(){setMode(opt.id);}}
                style={{ padding:"7px 16px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:mode===opt.id?600:400,background:mode===opt.id?C.white:"transparent",color:mode===opt.id?C.dark:"rgba(255,255,255,0.5)" }}>{opt.label}</button>;
            })}
          </div>
        )}
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}>
          {item.src ? (
            <div style={{ position:"relative",width:imgW,height:imgH }}>
              {mode==="full" && <img src={item.src} style={{ width:imgW,height:imgH,objectFit:"cover",borderRadius:16 }} alt=""/>}
              {mode==="skeleton" && item.poses && item.poses.people && item.poses.people[0] && (
                <PoseSkeleton keypoints={item.poses.people[0].keypoints} width={imgW} height={imgH} color={C.yellow}/>
              )}
            </div>
          ) : (
            <div style={{ width:280,height:360,borderRadius:16,background:item.color,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Ic n="image" size={40} color="rgba(255,255,255,0.4)"/>
            </div>
          )}
        </div>
        {item.poses && item.poses.guidance && (
          <div style={{ margin:"0 20px 16px",background:"rgba(255,255,255,0.07)",borderRadius:14,padding:14 }}>
            <p style={{ fontSize:11,fontWeight:700,color:C.yellow,margin:"0 0 6px",letterSpacing:0.5,textTransform:"uppercase" }}>AI Guidance</p>
            <p style={{ fontSize:13,color:C.white,margin:"0 0 4px" }}>{item.poses.guidance.mood}</p>
            {(item.poses.guidance.action||[]).slice(0,2).map(function(a,i){ return <p key={i} style={{ fontSize:12,color:"rgba(255,255,255,0.6)",margin:"2px 0" }}>{"🧍 "+a}</p>; })}
          </div>
        )}
        <div style={{ display:"flex",gap:10,padding:"0 20px 40px" }}>
          <button onClick={onClose} style={{ flex:1,padding:"13px 0",borderRadius:14,background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",fontSize:14,fontWeight:600,color:C.white,fontFamily:"inherit" }}>Close</button>
          <button onClick={function(){onShootWithRef(item);}} style={{ flex:2,padding:"13px 0",borderRadius:14,background:C.yellow,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,color:C.dark,fontFamily:"inherit" }}>📷 Shoot with this</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",position:"relative",background:C.white }}>
      <StatusBar/>
      <div style={{ flex:1,overflowY:"auto",padding:"16px 0 120px" }}>

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 20px",marginBottom:16 }}>
          <h1 style={{ fontSize:24,fontWeight:700,margin:0,color:C.dark }}>References</h1>
          <button onClick={function(){setShowUploadSheet(true);}}
            style={{ width:34,height:34,borderRadius:17,background:C.yellow,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic n="plus" size={16} color={C.dark}/>
          </button>
        </div>

        {/* ── SECTION 1: Plans with refs ── */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 20px",marginBottom:10 }}>
            <p style={{ fontSize:13,fontWeight:700,color:C.dark,margin:0 }}>Plans</p>
            <button onClick={function(){onNav("plan");}} style={{ fontSize:12,color:C.gray400,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit" }}>See all →</button>
          </div>
          <div style={{ display:"flex",gap:10,overflowX:"auto",padding:"0 20px",paddingBottom:4 }}>
            {plans.map(function(plan){
              return (
                <div key={plan.id} style={{ flexShrink:0,width:140,borderRadius:16,background:plan.color,padding:"12px 12px 10px",cursor:"pointer" }}
                  onClick={function(){ onNav("plan"); }}>
                  <p style={{ fontSize:12,fontWeight:700,color:C.dark,margin:"0 0 2px" }}>{plan.name}</p>
                  <p style={{ fontSize:10,color:"rgba(0,0,0,0.45)",margin:"0 0 8px" }}>{plan.date||"No date"}</p>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:9,fontWeight:700,background:"rgba(0,0,0,0.1)",borderRadius:6,padding:"2px 6px",color:"rgba(0,0,0,0.5)" }}>{plan.refs} refs</span>
                    <span style={{ fontSize:11,color:"rgba(0,0,0,0.35)" }}>+</span>
                  </div>
                </div>
              );
            })}
            {/* Add new plan */}
            <div style={{ flexShrink:0,width:100,borderRadius:16,background:C.gray100,border:"1.5px dashed "+C.gray200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",padding:12 }}
              onClick={function(){ onNav("plan"); }}>
              <Ic n="plus" size={18} color={C.gray400}/>
              <span style={{ fontSize:10,color:C.gray400,fontFamily:"inherit" }}>New plan</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Collections ── */}
        <div style={{ marginBottom:22 }}>
          <p style={{ fontSize:13,fontWeight:700,color:C.dark,margin:"0 0 10px",padding:"0 20px" }}>Collections</p>
          <div style={{ display:"flex",gap:10,overflowX:"auto",padding:"0 20px",paddingBottom:4 }}>
            {collections.map(function(col){
              return (
                <div key={col.name} style={{ flexShrink:0,width:110,borderRadius:14,background:col.color,padding:"10px 12px",cursor:"pointer" }}
                  onClick={function(){setActiveTag(col.name);}}>
                  <div style={{ width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.4)",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Ic n="image" size={14} color="rgba(0,0,0,0.4)"/>
                  </div>
                  <p style={{ fontSize:12,fontWeight:700,color:C.dark,margin:"0 0 1px" }}>{col.name}</p>
                  <p style={{ fontSize:10,color:"rgba(0,0,0,0.45)",margin:0 }}>{col.count} images</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: Filtered grid (waterfall feel) ── */}
        <div style={{ padding:"0 20px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <p style={{ fontSize:13,fontWeight:700,color:C.dark,margin:0 }}>All References</p>
          </div>
          {/* Filter tags */}
          <div style={{ display:"flex",gap:8,overflowX:"auto",marginBottom:14,paddingBottom:2 }}>
            {tags.map(function(t){
              return <button key={t} onClick={function(){setActiveTag(t);}}
                style={{ flexShrink:0,padding:"5px 13px",borderRadius:16,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:activeTag===t?700:400,background:activeTag===t?C.dark:C.gray100,color:activeTag===t?C.white:C.gray600 }}>{t}</button>;
            })}
          </div>
          {/* Two-column masonry-ish grid */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {filtered.map(function(item,idx){
              const tall = idx%3===0;
              return (
                <div key={idx} onClick={function(){setSelectedForView(item);}}
                  style={{ borderRadius:14,overflow:"hidden",cursor:"pointer",
                    background:item.src?"transparent":item.color,
                    aspectRatio:tall?"2/3":"1/1",
                    position:"relative" }}>
                  {item.src
                    ? <img src={item.src} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""/>
                    : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <Ic n="image" size={22} color="rgba(255,255,255,0.5)"/>
                      </div>
                  }
                  {/* Label overlay */}
                  <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.55))",padding:"20px 10px 8px" }}>
                    <p style={{ fontSize:10,fontWeight:600,color:C.white,margin:0 }}>{item.label}</p>
                  </div>
                  {/* AI badge */}
                  {item.poses && item.poses.people && item.poses.people.length>0 && (
                    <div style={{ position:"absolute",top:6,right:6,background:C.yellow,borderRadius:6,width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <span style={{ fontSize:9,fontWeight:700,color:C.dark }}>AI</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload bottom sheet */}
      {showUploadSheet && (
        <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"flex-end" }}
          onClick={function(e){if(e.target===e.currentTarget)setShowUploadSheet(false);}}>
          <div style={{ width:"100%",background:C.white,borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",maxHeight:"90%",overflowY:"auto" }}>
            <div style={{ width:36,height:4,background:C.gray200,borderRadius:2,margin:"0 auto 20px" }}/>
            <p style={{ fontSize:17,fontWeight:700,color:C.dark,margin:"0 0 16px" }}>Add Reference</p>
            {!previewSrc ? (
              <label style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:160,borderRadius:16,border:"2px dashed "+C.gray200,background:C.gray50,cursor:"pointer",gap:8 }}>
                <Ic n="plus" size={28} color={C.gray400}/>
                <span style={{ fontSize:13,color:C.gray400,fontFamily:"inherit" }}>Tap to upload image</span>
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile}/>
              </label>
            ) : (
              <div style={{ position:"relative",marginBottom:12 }}>
                <img src={previewSrc} style={{ width:"100%",height:160,objectFit:"cover",borderRadius:14 }} alt=""/>
                {analysing && (
                  <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                    <div style={{ width:18,height:18,borderRadius:9,border:"2px solid "+C.yellow,borderTopColor:"transparent",animation:"spin 0.8s linear infinite" }}/>
                    <span style={{ fontSize:13,color:C.white,fontFamily:"inherit" }}>Analysing…</span>
                  </div>
                )}
                {!analysing && poseData && (
                  <div style={{ position:"absolute",top:8,right:8,background:C.yellow,borderRadius:8,padding:"3px 8px",display:"flex",alignItems:"center",gap:4 }}>
                    <span style={{ fontSize:10,fontWeight:700,color:C.dark }}>AI done</span>
                  </div>
                )}
              </div>
            )}

            {/* Analysis result — shown after analysis completes */}
            {!analysing && poseData && (
              <div style={{ background:"rgba(245,200,66,0.1)",borderRadius:14,padding:"14px 16px",marginBottom:4,border:"1px solid rgba(245,200,66,0.35)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                  <div style={{ width:30,height:30,borderRadius:15,background:C.yellow,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.dark} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize:12,fontWeight:700,color:"#6B4C00",margin:0 }}>
                      {poseData.people && poseData.people.length > 0 ? "Pose detected" : "Scene analysed"}
                    </p>
                    {poseData.people && poseData.people[0] && poseData.people[0].poseLabel && (
                      <p style={{ fontSize:11,color:"rgba(0,0,0,0.5)",margin:0 }}>{poseData.people[0].poseLabel}</p>
                    )}
                  </div>
                </div>
                {poseData.guidance && (
                  <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                    {poseData.guidance.mood && (
                      <p style={{ fontSize:12,color:"rgba(0,0,0,0.65)",margin:0,fontStyle:"italic",lineHeight:1.45,borderLeft:"2px solid rgba(245,200,66,0.7)",paddingLeft:8 }}>{poseData.guidance.mood}</p>
                    )}
                    {(poseData.guidance.poseSteps || poseData.guidance.action || []).slice(0,3).map(function(s,i){
                      return (
                        <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
                          <span style={{ fontSize:10,fontWeight:700,color:"#6B4C00",background:"rgba(245,200,66,0.4)",borderRadius:5,padding:"1px 6px",flexShrink:0,marginTop:1 }}>{i+1}</span>
                          <p style={{ fontSize:12,color:"rgba(0,0,0,0.7)",margin:0,lineHeight:1.45 }}>{s}</p>
                        </div>
                      );
                    })}
                    {poseData.guidance.composition && poseData.guidance.composition[0] && (
                      <p style={{ fontSize:11,color:"rgba(0,0,0,0.5)",margin:"2px 0 0",display:"flex",gap:5 }}>
                        <span>📐</span><span>{poseData.guidance.composition[0]}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <input value={labelInput} onChange={function(e){setLabelInput(e.target.value);}} placeholder="Label (e.g. Golden hour portrait)"
              style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"1.5px solid "+C.gray200,fontSize:13,fontFamily:"inherit",marginTop:10,outline:"none",boxSizing:"border-box" }}/>
            <div style={{ display:"flex",gap:8,marginTop:10,flexWrap:"wrap" }}>
              {["Portraits","Candid","Detail","Architecture","Other"].map(function(c){
                return <button key={c} onClick={function(){setCatInput(c);}}
                  style={{ padding:"5px 12px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:catInput===c?700:400,background:catInput===c?C.dark:C.gray100,color:catInput===c?C.white:C.gray600 }}>{c}</button>;
              })}
            </div>
            <button onClick={handleSave} disabled={!previewSrc||analysing}
              style={{ width:"100%",padding:"14px 0",borderRadius:14,background:previewSrc&&!analysing?C.yellow:"rgba(0,0,0,0.1)",border:"none",cursor:previewSrc&&!analysing?"pointer":"not-allowed",fontSize:15,fontWeight:700,color:previewSrc&&!analysing?C.dark:C.gray400,fontFamily:"inherit",marginTop:14 }}>
              Save Reference
            </button>
          </div>
        </div>
      )}

      {/* Full-screen viewer */}
      {selectedForView && (
        <Viewer item={selectedForView} onClose={function(){setSelectedForView(null);}} onShootWithRef={function(item){onShootWithRef(item); setSelectedForView(null);}}/>
      )}

      <FloatingNav active="library" onNav={onNav}/>
    </div>
  );
};
