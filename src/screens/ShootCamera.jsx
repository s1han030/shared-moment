import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { Ic } from '../components/Ic.jsx';
import { PoseSkeleton } from '../components/PoseSkeleton.jsx';
import { analyseRefImage, checkPoseMatch } from '../lib/claude.js';

export const ShootCamera = ({ onBack, onGoTo, initialRef, uploadedRefs }) => {
  const [phase, setPhase] = useState("scanning");
  const [scanPct, setScanPct] = useState(0);
  const [selRef, setSelRef] = useState(1);
  const [hintStep, setHintStep] = useState(0);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [showPose, setShowPose] = useState(false);
  const [libTab, setLibTab] = useState("All");
  const [expandedRef, setExpandedRef] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);
  const [poseMatch, setPoseMatch] = useState(null);
  const [autoAnalysing, setAutoAnalysing] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [liveHint, setLiveHint] = useState(null);   // {text, type, score, age}
  const [showMatchPanel, setShowMatchPanel] = useState(false);
  const [activeRefGuidance, setActiveRefGuidance] = useState(initialRef||null);
  const [guideVisible, setGuideVisible] = useState(true);
  const [shootModeSheet, setShootModeSheet] = useState(!initialRef);
  const [sheetTab, setSheetTab] = useState("plan");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const autoTimerRef = useRef(null);
  const isAnalysingRef = useRef(false);

  // Scan animation
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setInterval(() => {
      setScanPct(p => {
        if (p >= 100) { clearInterval(t); setTimeout(()=>setPhase("lighthint"),300); return 100; }
        return p + 3;
      });
    }, 50);
    return () => clearInterval(t);
  }, [phase]);

  // Start / restart camera whenever we are in capture phase
  useEffect(() => {
    if (phase !== "capture") return;
    startCamera();
    return () => stopCamera();
  }, [phase, facingMode]); // eslint-disable-line

  // Auto-analysis loop — every 6 seconds when enabled
  useEffect(() => {
    if (phase !== "capture") return;
    if (!autoEnabled) {
      clearInterval(autoTimerRef.current);
      return;
    }
    const runOnce = async () => {
      if (isAnalysingRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      isAnalysingRef.current = true;
      setAutoAnalysing(true);
      try {
        canvas.width = Math.min(video.videoWidth || 640, 640);
        canvas.height = Math.min(video.videoHeight || 480, 480);
        const ctx = canvas.getContext("2d");
        ctx.setTransform(1,0,0,1,0,0);
        if (facingMode === "user") { ctx.translate(canvas.width,0); ctx.scale(-1,1); }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const liveB64 = canvas.toDataURL("image/jpeg", 0.55).split(",")[1];
        const refSrc = activeRefGuidance?.src;
        const refB64 = refSrc ? refSrc.split(",")[1] : null;
        let result;
        if (refB64 || activeRefGuidance?.poses) {
          result = await checkPoseMatch(liveB64, activeRefGuidance?.poses || null, refB64 || null);
        } else {
          // No reference image — just give live framing tips
          const prompt = `You are a photography coach. Analyse this live camera frame.
Return ONLY valid JSON (no markdown):
{"matchScore":null,"matchLabel":"Live tips","topPriority":"Position your subject in the frame","pose":{"score":null,"status":"partial","instruction":"Ask subject to angle their body 45 degrees"},"composition":{"score":null,"status":"partial","instruction":"Move back slightly for more breathing room"},"mood":{"score":null,"status":"partial","instruction":"Encourage a natural relaxed expression"}}`;
          const text = await callClaude([{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:"image/jpeg",data:liveB64}},
            {type:"text",text:prompt}
          ]}], 400);
          result = JSON.parse(text);
        }
        if (result) {
          setPoseMatch(result);
          // Pick the lowest-scoring dimension as the live hint
          const dims = [
            {key:"pose",icon:"🧍",label:"Pose"},
            {key:"composition",icon:"📐",label:"Framing"},
            {key:"mood",icon:"✨",label:"Mood"},
          ];
          const worst = dims
            .filter(d => result[d.key]?.instruction)
            .sort((a,b) => (result[a.key]?.score??50) - (result[b.key]?.score??50))[0];
          const topText = result.topPriority || (worst ? result[worst.key].instruction : null);
          if (topText) {
            setLiveHint({
              text: topText,
              score: result.matchScore,
              label: result.matchLabel,
              dimBreakdown: dims.filter(d=>result[d.key]).map(d=>({
                ...d, score:result[d.key].score, status:result[d.key].status,
                instruction:result[d.key].instruction
              })),
            });
            setHintDismissed(false);
          }
        }
      } catch(e) { console.warn("Auto-analyse error", e); }
      isAnalysingRef.current = false;
      setAutoAnalysing(false);
    };
    runOnce(); // run immediately on enable
    autoTimerRef.current = setInterval(runOnce, 6000);
    return () => clearInterval(autoTimerRef.current);
  }, [phase, autoEnabled, activeRefGuidance, facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width:{ ideal:1280 }, height:{ ideal:720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraError(null);
    } catch(e) {
      setCameraError(e.message || "Camera unavailable");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current = null;
  };

  const flipCamera = () => setFacingMode(f => f==="environment" ? "user" : "environment");

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhotos(prev => [...prev, dataUrl]);
    // Flash effect
    const flash = document.createElement("div");
    flash.style.cssText = "position:fixed;inset:0;background:white;opacity:0.8;z-index:9999;pointer-events:none;transition:opacity 0.3s";
    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = "0"; setTimeout(()=>flash.remove(), 300); }, 50);
  };

  const savePhoto = (dataUrl, idx) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `moment-shot-${idx+1}.jpg`;
    a.click();
  };

  // Manual "see full breakdown" — just opens the panel with last result
  const openMatchPanel = () => setShowMatchPanel(true);

  const staticRefs = [
    {id:0,color:"#F0C27F",label:"Fountain walk",src:null,poses:null},
    {id:1,color:"#C5D5C5",label:"Cap toss",src:null,poses:null},
    {id:2,color:"#C8BAD8",label:"Diploma detail",src:null,poses:null},
    {id:3,color:"#B8D4E8",label:"Family portrait",src:null,poses:null},
  ];
  // Merge in user-uploaded refs from Library (they have real src + guidance)
  const uploadedAsRefs = (uploadedRefs||[]).map((r,i)=>({
    ...r, id: 100+i,
  }));
  const refs = [...staticRefs, ...uploadedAsRefs];

  // Active ref guidance hints — from ref analysis or fallback
  const currentRef = refs[selRef];
  // Per-ref AI guidance: prefer current selected ref, fallback to activeRefGuidance
  const refGuidance = currentRef?.poses?.guidance || activeRefGuidance?.poses?.guidance || activeRefGuidance?.guidance;
  const visualGuide = currentRef?.poses?.visualGuide || activeRefGuidance?.poses?.visualGuide || activeRefGuidance?.visualGuide || null;
  const accentCol = visualGuide?.accentColor || C.yellow;
  const hints = refGuidance
    ? [
        refGuidance.mood ? ("✨ " + refGuidance.mood) : null,
        ...(refGuidance.poseSteps||refGuidance.action||[]).slice(0,3).map(function(a){ return "🧍 " + a; }),
        ...(refGuidance.composition||[]).slice(0,2).map(function(c){ return "📐 " + c; }),
      ].filter(Boolean)
    : [
        "Move the phone left — follow the guideline",
        "Step back a little — or switch to 1.5×",
        "Place subject in the lower third of the frame",
        "Turn toward the window light on your left",
      ];

  // ── UNIFIED RENDER (all phases in one return, refs always mounted) ──────────
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", position:"relative",
      background: phase==="capture" ? "#0F0F0E" : C.dark }}>

      {/* Always-present hidden canvases so refs never go missing */}
      <canvas ref={canvasRef} style={{ display:"none" }}/>

      {/* ══ SCANNING PHASE ══ */}
      {phase === "scanning" && (
        <div style={{ position:"absolute",inset:0,zIndex:10,background:C.dark,display:"flex",flexDirection:"column" }}>
          <StatusBar dark/>
          <div style={{ flex:1,position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,#1A2530,#0E1A14)" }}/>
            <div style={{ position:"absolute",left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C.yellow},transparent)`,top:`${scanPct}%`,boxShadow:`0 0 20px ${C.yellow}`,transition:"top 0.05s linear" }}/>
            {[{top:40,left:24},{top:40,right:24},{bottom:180,left:24},{bottom:180,right:24}].map((pos,i)=>(
              <div key={i} style={{ position:"absolute",width:22,height:22,...pos,borderTop:(i<2)?`2px solid ${C.yellow}`:"none",borderBottom:(i>=2)?`2px solid ${C.yellow}`:"none",borderLeft:(i===0||i===2)?`2px solid ${C.yellow}`:"none",borderRight:(i===1||i===3)?`2px solid ${C.yellow}`:"none",opacity:scanPct>15?1:0.3,transition:"opacity 0.3s" }}/>
            ))}
            {scanPct > 40 && (
              <div style={{ position:"absolute",bottom:"22%",left:"50%",transform:"translateX(-50%)",display:"flex",gap:16,opacity:Math.min((scanPct-40)/30,1) }}>
                <div style={{ width:44,height:108,background:`${C.yellow}20`,border:`1px solid ${C.yellow}50`,borderRadius:"22px 22px 8px 8px" }}/>
                <div style={{ width:38,height:96,background:`${C.yellow}14`,border:`1px solid ${C.yellow}35`,borderRadius:"19px 19px 8px 8px",marginTop:12 }}/>
              </div>
            )}
            <div style={{ position:"absolute",top:"44%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center" }}>
              <p style={{ fontSize:12,color:C.yellow,fontWeight:600,margin:"0 0 10px",letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit" }}>
                {scanPct<35?"Reading the space":scanPct<70?"Locating subjects":"Checking light"}
              </p>
              <div style={{ width:160,height:3,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${scanPct}%`,background:C.yellow,borderRadius:2,transition:"width 0.05s linear" }}/>
              </div>
            </div>
            <button onClick={onBack} style={{ position:"absolute",top:12,left:16,background:"rgba(0,0,0,0.4)",border:"none",cursor:"pointer",width:36,height:36,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Ic n="close" size={15} color={C.white}/>
            </button>
          </div>
        </div>
      )}

      {/* ══ LIGHT HINT PHASE ══ */}
      {phase === "lighthint" && (
        <div style={{ position:"absolute",inset:0,zIndex:10,background:C.dark,display:"flex",flexDirection:"column" }}>
          <StatusBar dark/>
          <div style={{ flex:1,position:"relative" }}>
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,#1A2530,#0E1A14)" }}/>
            <div style={{ position:"absolute",inset:0,pointerEvents:"none" }}>
              {[1,2].map(i=><div key={i} style={{position:"absolute",top:0,bottom:0,left:`${i*33.33}%`,width:1,background:"rgba(255,255,255,0.08)"}}/>)}
              {[1,2].map(i=><div key={i} style={{position:"absolute",left:0,right:0,top:`${i*33.33}%`,height:1,background:"rgba(255,255,255,0.08)"}}/>)}
            </div>
            <div style={{ position:"absolute",bottom:"18%",left:"50%",transform:"translateX(-50%)",display:"flex",gap:16 }}>
              <div style={{ width:44,height:108,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:"22px 22px 8px 8px" }}/>
              <div style={{ width:38,height:96,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"19px 19px 8px 8px",marginTop:12 }}/>
            </div>
            <div style={{ position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(10px)",borderRadius:20,padding:"6px 14px",display:"flex",alignItems:"center",gap:6,border:"1px solid rgba(255,255,255,0.1)",whiteSpace:"nowrap" }}>
              <div style={{ width:8,height:8,borderRadius:4,background:"#4ADE80" }}/>
              <span style={{ fontSize:12,color:C.white,fontFamily:"inherit" }}>Scene scan complete</span>
            </div>
            <div style={{ position:"absolute",bottom:60,left:20,right:20,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(16px)",borderRadius:20,padding:20,border:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                <div style={{ width:36,height:36,borderRadius:18,background:`${C.yellow}22`,border:`1.5px solid ${C.yellow}60`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Ic n="sun" size={18} color={C.yellow}/>
                </div>
                <div>
                  <p style={{ fontSize:11,color:C.yellow,fontWeight:700,margin:0,letterSpacing:0.8,textTransform:"uppercase" }}>Lighting Note</p>
                  <p style={{ fontSize:13,color:C.white,margin:"2px 0 0",fontFamily:"inherit" }}>Natural light detected from the right</p>
                </div>
              </div>
              <p style={{ fontSize:14,color:"rgba(255,255,255,0.85)",margin:"0 0 16px",lineHeight:1.6,fontFamily:"inherit" }}>
                Try having your subject face slightly right — side lighting tends to look more natural and adds depth.
              </p>
              <button onClick={()=>setPhase("capture")} style={{ width:"100%",padding:13,background:C.yellow,color:C.dark,border:"none",borderRadius:13,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                Got it, start shooting →
              </button>
            </div>
            <button onClick={onBack} style={{ position:"absolute",top:12,left:16,background:"rgba(0,0,0,0.4)",border:"none",cursor:"pointer",width:36,height:36,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Ic n="close" size={15} color={C.white}/>
            </button>
          </div>
        </div>
      )}

      {/* ══ CAPTURE PHASE ══ */}
      {phase === "capture" && (
        <div style={{ height:"100%",background:"#0F0F0E",display:"flex",flexDirection:"column",position:"relative" }}>
      <canvas ref={canvasRef} style={{ display:"none" }}/>
      <StatusBar dark/>

      {/* Viewfinder */}
      <div style={{ flex:1,position:"relative",overflow:"hidden" }}>
        {/* Live camera feed */}
        {!cameraError ? (
          <video ref={videoRef} autoPlay playsInline muted
            style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
              transform:facingMode==="user"?"scaleX(-1)":"none" }}/>
        ) : (
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,#2A3A4A,#1A2530)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12 }}>
            <Ic n="camera" size={32} color="rgba(255,255,255,0.2)"/>
            <p style={{ fontSize:13,color:"rgba(255,255,255,0.4)",margin:0,fontFamily:"inherit",textAlign:"center",padding:"0 32px" }}>{cameraError}</p>
            <button onClick={startCamera} style={{ padding:"8px 20px",background:C.yellow,border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Retry</button>
          </div>
        )}

        {/* Visual guide overlay */}
        <div style={{ position:"absolute",inset:0,pointerEvents:"none" }}>
          {[1,2].map(function(i){ return <div key={i} style={{position:"absolute",top:0,bottom:0,left:(i*33.33)+"%",width:1,background:guideVisible ? accentCol+"55" : "rgba(255,255,255,0.12)"}}/>; })}
          {[1,2].map(function(i){ return <div key={i+"h"} style={{position:"absolute",left:0,right:0,top:(i*33.33)+"%",height:1,background:guideVisible ? accentCol+"55" : "rgba(255,255,255,0.12)"}}/>; })}
          {guideVisible && currentRef && currentRef.src && (
            <img src={currentRef.src} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.15,mixBlendMode:"screen",pointerEvents:"none"}}/>
          )}
          {guideVisible && visualGuide && visualGuide.subjectZone && (
            <div style={{position:"absolute",
              left:(visualGuide.subjectZone.x*100)+"%",
              top:(visualGuide.subjectZone.y*100)+"%",
              width:(visualGuide.subjectZone.w*100)+"%",
              height:(visualGuide.subjectZone.h*100)+"%",
              border:"2px dashed "+accentCol,
              borderRadius:8,
              pointerEvents:"none"}}>
              <div style={{position:"absolute",top:-22,left:0,background:accentCol,borderRadius:"4px 4px 0 0",padding:"2px 8px",whiteSpace:"nowrap"}}>
                <span style={{fontSize:9,fontWeight:700,color:"#111",letterSpacing:0.4}}>PLACE SUBJECT HERE</span>
              </div>
            </div>
          )}
          {guideVisible && visualGuide && visualGuide.keyMarkers && visualGuide.keyMarkers.map(function(m,mi){
            return (
              <div key={mi} style={{position:"absolute",left:(m.x*100)+"%",top:(m.y*100)+"%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{width:20,height:20,borderRadius:10,border:"2px solid "+accentCol,background:accentCol+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:5,height:5,borderRadius:3,background:accentCol}}/>
                </div>
                <div style={{background:"rgba(0,0,0,0.72)",borderRadius:4,padding:"1px 6px",whiteSpace:"nowrap"}}>
                  <span style={{fontSize:8,fontWeight:700,color:accentCol,letterSpacing:0.3}}>{m.label}</span>
                </div>
                {mi < 2 && m.hint && (
                  <div style={{background:"rgba(0,0,0,0.55)",borderRadius:4,padding:"1px 5px",whiteSpace:"nowrap"}}>
                    <span style={{fontSize:7,color:"rgba(255,255,255,0.75)"}}>{m.hint}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Focus corners — color follows accentCol */}
        <div style={{ position:"absolute",top:"46%",left:"50%",transform:"translate(-50%,-50%)",width:108,height:108,pointerEvents:"none" }}>
          {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map(function(pos,ci){
            return <div key={ci} style={{position:"absolute",width:16,height:16,...pos,
              borderTop:ci<2 ? "2px solid "+accentCol : "none",
              borderBottom:ci>=2 ? "2px solid "+accentCol : "none",
              borderLeft:(ci===0||ci===2) ? "2px solid "+accentCol : "none",
              borderRight:(ci===1||ci===3) ? "2px solid "+accentCol : "none"}}/>;
          })}
        </div>

        {/* Top bar */}
        <div style={{ position:"absolute",top:4,left:0,right:0,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 16px" }}>
          <button onClick={()=>{ stopCamera(); onBack(); }} style={{ background:"rgba(0,0,0,0.45)",border:"none",cursor:"pointer",width:34,height:34,borderRadius:17,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic n="close" size={15} color={C.white}/>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{background:"rgba(0,0,0,0.5)",borderRadius:12,padding:"4px 10px"}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontFamily:"inherit"}}>{currentRef ? currentRef.label : "Shot 1 of 5"}</span>
            </div>
            <button onClick={function(){ setGuideVisible(function(v){ return !v; }); }}
              style={{background:guideVisible ? accentCol : "rgba(0,0,0,0.45)",border:"none",cursor:"pointer",borderRadius:10,padding:"4px 10px"}}>
              <span style={{fontSize:10,fontWeight:700,color:guideVisible?"#111":C.white,fontFamily:"inherit"}}>{guideVisible ? "Guide ON" : "Guide OFF"}</span>
            </button>
            <button onClick={function(){setShootModeSheet(true);}} style={{background:"rgba(0,0,0,0.45)",border:"none",cursor:"pointer",borderRadius:10,padding:"4px 10px"}}>
              <span style={{fontSize:10,fontWeight:700,color:C.white,fontFamily:"inherit"}}>⊞ Ref</span>
            </button>
          </div>
          {/* Flip camera button */}
          <button onClick={flipCamera} style={{ background:"rgba(0,0,0,0.45)",border:"none",cursor:"pointer",width:34,height:34,borderRadius:17,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic n="flip" size={16} color={C.white}/>
          </button>
        </div>

        {/* ── LIVE AI HINT PILL ── */}
        {!hintDismissed && (
          <div style={{ position:"absolute",top:52,left:16,right:16,zIndex:10 }}>
            {/* Main hint card */}
            <div style={{ background:"rgba(0,0,0,0.80)",backdropFilter:"blur(14px)",borderRadius:14,padding:"10px 14px",border:`1px solid ${liveHint&&autoEnabled?"rgba(245,200,66,0.3)":"rgba(255,255,255,0.08)"}`,display:"flex",gap:10,alignItems:"flex-start" }}>
              {/* Left: status dot or spinner */}
              <div style={{ width:20,height:20,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1 }}>
                {autoAnalysing ? (
                  <div style={{ width:14,height:14,borderRadius:7,border:`2px solid ${C.yellow}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite" }}/>
                ) : liveHint&&autoEnabled ? (
                  <div style={{ width:8,height:8,borderRadius:4,background:liveHint.score>=75?"#4ADE80":liveHint.score>=50?C.yellow:liveHint.score!=null?"#F87171":"rgba(255,255,255,0.3)" }}/>
                ) : (
                  <div style={{ width:8,height:8,borderRadius:4,background:"rgba(255,255,255,0.25)" }}/>
                )}
              </div>

              {/* Text content */}
              <div style={{ flex:1,minWidth:0 }}>
                {autoAnalysing && !liveHint && (
                  <p style={{ fontSize:13,color:"rgba(255,255,255,0.6)",margin:0,fontFamily:"inherit" }}>Analysing frame…</p>
                )}
                {(!autoEnabled || (!autoAnalysing && !liveHint)) && (
                  <p style={{ fontSize:13,color:C.white,margin:0,fontFamily:"inherit" }}>{hints[hintStep]}</p>
                )}
                {autoEnabled && liveHint && (
                  <>
                    {liveHint.score != null && (
                      <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                        <span style={{ fontSize:10,fontWeight:700,color:liveHint.score>=75?"#4ADE80":liveHint.score>=50?C.yellow:"#F87171",letterSpacing:0.5 }}>
                          {liveHint.label} · {liveHint.score}%
                        </span>
                        {autoAnalysing && <span style={{ fontSize:10,color:"rgba(255,255,255,0.35)" }}>updating…</span>}
                      </div>
                    )}
                    <p style={{ fontSize:13,color:C.white,margin:0,fontFamily:"inherit",lineHeight:1.4 }}>{liveHint.text}</p>
                    {liveHint.dimBreakdown?.length > 0 && (
                      <div style={{ display:"flex",gap:8,marginTop:6,flexWrap:"wrap" }}>
                        {liveHint.dimBreakdown.map(d=>(
                          <span key={d.key} style={{ fontSize:10,color:d.status==="good"?"#4ADE80":d.status==="partial"?C.yellow:"#F87171",fontWeight:600 }}>
                            {d.icon} {d.label}{d.score!=null?` ${d.score}%`:""}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right: controls */}
              <div style={{ display:"flex",gap:6,alignItems:"center",flexShrink:0 }}>
                {/* Static hints next button (when auto off) */}
                {!autoEnabled && hintStep < hints.length-1 && (
                  <button onClick={()=>setHintStep(s=>s+1)} style={{ background:"rgba(255,255,255,0.12)",border:"none",cursor:"pointer",borderRadius:8,padding:"4px 9px",color:"rgba(255,255,255,0.7)",fontSize:11,fontFamily:"inherit",whiteSpace:"nowrap" }}>Next</button>
                )}
                {/* See details button (when have result) */}
                {autoEnabled && liveHint && !autoAnalysing && (
                  <button onClick={openMatchPanel} style={{ background:"rgba(255,255,255,0.10)",border:"none",cursor:"pointer",borderRadius:8,padding:"4px 9px",color:"rgba(255,255,255,0.7)",fontSize:11,fontFamily:"inherit",whiteSpace:"nowrap" }}>Details</button>
                )}
                <button onClick={()=>setHintDismissed(true)} style={{ background:"none",border:"none",cursor:"pointer",padding:2 }}>
                  <Ic n="close" size={12} color="rgba(255,255,255,0.3)"/>
                </button>
              </div>
            </div>

            {/* CSS spin keyframe injected once */}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Reference thumbnail */}
        {refs[selRef] && (
          <div style={{ position:"absolute",top:hintDismissed?16:96,right:14,transition:"top 0.2s" }}>
            <div style={{ width:54,height:70,borderRadius:10,
              background: refs[selRef].src ? `url(${refs[selRef].src}) center/cover` : refs[selRef].color,
              border:"2px solid rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",cursor:"pointer",overflow:"hidden" }}
              onClick={()=>setExpandedRef(refs[selRef])}>
              {!refs[selRef].src && <Ic n="image" size={16} color="rgba(255,255,255,0.55)"/>}
            </div>
            <p style={{ fontSize:9,color:"rgba(255,255,255,0.35)",textAlign:"center",margin:"3px 0 0",fontFamily:"inherit" }}>Ref</p>
          </div>
        )}

        {/* Captured count badge */}
        {capturedPhotos.length > 0 && (
          <button onClick={()=>setShowGallery(true)} style={{ position:"absolute",bottom:96,right:14,background:"rgba(0,0,0,0.6)",border:"none",cursor:"pointer",borderRadius:12,padding:"6px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
            <div style={{ width:48,height:48,borderRadius:8,background:`url(${capturedPhotos[capturedPhotos.length-1]}) center/cover`,border:`2px solid ${C.yellow}` }}/>
            <span style={{ fontSize:10,color:C.yellow,fontFamily:"inherit",fontWeight:600 }}>{capturedPhotos.length}</span>
          </button>
        )}

        {/* Reference gallery strip */}
        {shootModeSheet && (
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"flex-end" }}
            onClick={function(e){if(e.target===e.currentTarget)setShootModeSheet(false);}}>
            <div style={{ width:"100%",background:"#1A1F24",borderRadius:"22px 22px 0 0",padding:"16px 0 44px" }}>
              <div style={{ width:36,height:4,background:"rgba(255,255,255,0.2)",borderRadius:2,margin:"0 auto 14px" }}/>
              <div style={{ display:"flex",borderBottom:"1px solid rgba(255,255,255,0.08)",marginBottom:14 }}>
                {[{id:"plan",label:"From a Plan"},{id:"ref",label:"From Library"}].map(function(t){
                  return <button key={t.id} onClick={function(){setSheetTab(t.id);}}
                    style={{ flex:1,padding:"10px 0",border:"none",cursor:"pointer",background:"transparent",fontFamily:"inherit",fontSize:13,fontWeight:sheetTab===t.id?700:400,color:sheetTab===t.id?C.yellow:"rgba(255,255,255,0.4)",borderBottom:sheetTab===t.id?"2px solid "+C.yellow:"2px solid transparent",marginBottom:-1 }}>{t.label}</button>;
                })}
              </div>
              <div style={{ padding:"0 16px",maxHeight:240,overflowY:"auto" }}>
                {sheetTab==="plan" && (
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {[{name:"Graduation Day",date:"Mar 22",color:C.white,shots:5},{name:"Cafe Shoot",date:"Feb 28",color:C.gray50,shots:3},{name:"Street Vibes",date:null,color:C.gray50,shots:2}].map(function(plan,i){
                      return (
                        <div key={i} onClick={function(){setShootModeSheet(false);}}
                          style={{ display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.06)",borderRadius:14,padding:"11px 14px",cursor:"pointer" }}>
                          <div style={{ width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.1)",flexShrink:0,border:"1px solid rgba(255,255,255,0.15)" }}/>
                          <div style={{ flex:1 }}>
                            <p style={{ fontSize:14,fontWeight:600,color:C.white,margin:"0 0 2px" }}>{plan.name}</p>
                            <p style={{ fontSize:11,color:"rgba(255,255,255,0.4)",margin:0 }}>{plan.date||"No date"} · {plan.shots} shots</p>
                          </div>
                          <Ic n="arrow" size={14} color="rgba(255,255,255,0.3)"/>
                        </div>
                      );
                    })}
                  </div>
                )}
                {sheetTab==="ref" && (
                  <div>
                    {(!uploadedRefs||uploadedRefs.length===0)&&<p style={{ fontSize:13,color:"rgba(255,255,255,0.35)",textAlign:"center",padding:"24px 0",margin:0 }}>No refs yet — add in the Ref tab</p>}
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
                      {(uploadedRefs||[]).map(function(r,i){
                        return <div key={i} onClick={function(){setActiveRefGuidance(r);setShootModeSheet(false);}}
                          style={{ aspectRatio:"1",borderRadius:12,overflow:"hidden",cursor:"pointer" }}>
                          {r.src?<img src={r.src} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""/>
                            :<div style={{ width:"100%",height:"100%",background:r.color||"#555",display:"flex",alignItems:"center",justifyContent:"center" }}><Ic n="image" size={18} color="rgba(255,255,255,0.5)"/></div>}
                        </div>;
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding:"12px 16px 0" }}>
                <button onClick={function(){setShootModeSheet(false);}} style={{ width:"100%",padding:"12px 0",borderRadius:12,background:"rgba(255,255,255,0.08)",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.5)",fontFamily:"inherit" }}>Just shoot — no reference</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ position:"absolute",bottom:0,left:0,right:0 }}>
          <div style={{ overflowX:"auto",display:"flex",gap:8,padding:"6px 16px 10px",scrollbarWidth:"none" }}>
            {refs.map((r,rIdx)=>(
              <div key={r.id}
                onClick={()=>{
                  setSelRef(rIdx);
                  if (r.poses?.guidance || r.src) setActiveRefGuidance(r);
                }}
                style={{ flexShrink:0,cursor:"pointer",
                  width:selRef===rIdx?62:46, height:selRef===rIdx?78:58,
                  borderRadius:10,
                  background: r.src ? `url(${r.src}) center/cover` : r.color,
                  border:`2px solid ${selRef===rIdx?C.yellow:"rgba(255,255,255,0.18)"}`,
                  transition:"all 0.18s",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  marginTop:selRef===rIdx?0:10, position:"relative", overflow:"hidden" }}>
                {!r.src && <Ic n="image" size={13} color="rgba(255,255,255,0.5)"/>}
                {/* Pose badge on uploaded refs */}
                {r.poses?.people?.length>0 && (
                  <div style={{ position:"absolute",bottom:2,left:0,right:0,background:"rgba(0,0,0,0.55)",padding:"1px 0",display:"flex",justifyContent:"center" }}>
                    <Ic n="pose" size={8} color={C.yellow}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Camera controls */}
      <div style={{ background:"#0F0F0E",padding:"16px 32px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
        <button onClick={()=>setShowLib(true)} style={{ width:52,height:52,borderRadius:14,background:"rgba(255,255,255,0.08)",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3 }}>
          <Ic n="image" size={18} color={C.white}/>
          <span style={{ fontSize:9,color:"rgba(255,255,255,0.4)",fontFamily:"inherit" }}>Refs</span>
        </button>

        {/* Shutter — calls takePhoto() */}
        <button onClick={takePhoto} style={{ width:72,height:72,borderRadius:36,background:"transparent",border:`3px solid ${C.white}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ width:58,height:58,borderRadius:30,background:C.white }}/>
        </button>

        <button onClick={()=>setShowPose(true)} style={{ width:52,height:52,borderRadius:14,background:"rgba(255,255,255,0.08)",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3 }}>
          <Ic n="pose" size={18} color={C.white}/>
          <span style={{ fontSize:9,color:"rgba(255,255,255,0.4)",fontFamily:"inherit" }}>Pose</span>
        </button>
      </div>

      {/* ── AUTO ANALYSE TOGGLE ── */}
      <div style={{ background:"#0F0F0E",paddingBottom:18,paddingTop:2,display:"flex",alignItems:"center",justifyContent:"center",gap:12 }}>
        <span style={{ fontSize:12,color:"rgba(255,255,255,0.4)",fontFamily:"inherit" }}>Auto-guide</span>
        {/* Toggle pill */}
        <div onClick={()=>{ setAutoEnabled(v=>!v); if(!autoEnabled){ setLiveHint(null); setHintDismissed(false); } }}
          style={{ width:48,height:26,borderRadius:13,background:autoEnabled?C.yellow:"rgba(255,255,255,0.12)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}>
          <div style={{ position:"absolute",top:3,left:autoEnabled?24:3,width:20,height:20,borderRadius:10,background:autoEnabled?C.dark:C.white,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
        </div>
        <span style={{ fontSize:12,fontFamily:"inherit",color:autoEnabled?C.yellow:"rgba(255,255,255,0.25)",fontWeight:autoEnabled?700:400,transition:"color 0.2s",minWidth:48 }}>
          {autoAnalysing?"…":"every 6s"}
        </span>
      </div>

      {/* Expanded ref overlay */}
      {expandedRef && (
        <div onClick={()=>setExpandedRef(null)} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ width:280,height:360,borderRadius:20,background:expandedRef.color,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic n="image" size={48} color="rgba(255,255,255,0.4)"/>
          </div>
          <p style={{ position:"absolute",bottom:110,left:"50%",transform:"translateX(-50%)",fontSize:13,color:"rgba(255,255,255,0.5)",fontFamily:"inherit",whiteSpace:"nowrap" }}>{expandedRef.label}</p>
        </div>
      )}

      {/* ── POSE MATCH RESULT PANEL (bottom sheet style) ── */}
      {showMatchPanel && (
        <div style={{ position:"absolute",inset:0,zIndex:150 }}>
          {/* Dim backdrop, tap to close */}
          <div onClick={()=>setShowMatchPanel(false)} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.55)" }}/>
          <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"#18181A",borderRadius:"24px 24px 0 0",padding:"16px 0 40px",maxHeight:"78%" }}>
            {/* Handle */}
            <div style={{ width:36,height:4,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto 16px" }}/>

            {checkingPose ? (
              /* Loading state */
              <div style={{ padding:"32px 24px",textAlign:"center" }}>
                <div style={{ width:48,height:48,borderRadius:24,background:`${C.yellow}22`,border:`2px solid ${C.yellow}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
                  <Ic n="scan" size={22} color={C.yellow}/>
                </div>
                <p style={{ fontSize:15,fontWeight:600,color:C.white,margin:"0 0 6px",fontFamily:"inherit" }}>Comparing with reference…</p>
                <p style={{ fontSize:13,color:"rgba(255,255,255,0.4)",margin:0,fontFamily:"inherit" }}>Claude is analysing pose, framing & mood</p>
              </div>
            ) : poseMatch ? (
              <div style={{ overflowY:"auto",padding:"0 20px 16px" }}>
                {/* Match score header */}
                <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:18 }}>
                  {/* Score ring */}
                  <div style={{ position:"relative",width:64,height:64,flexShrink:0 }}>
                    <svg width={64} height={64} style={{ transform:"rotate(-90deg)" }}>
                      <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5}/>
                      <circle cx={32} cy={32} r={26} fill="none"
                        stroke={poseMatch.matchScore>=75?"#4ADE80":poseMatch.matchScore>=50?C.yellow:"#F87171"}
                        strokeWidth={5} strokeLinecap="round"
                        strokeDasharray={`${2*Math.PI*26}`}
                        strokeDashoffset={`${2*Math.PI*26*(1-(poseMatch.matchScore||0)/100)}`}
                        style={{ transition:"stroke-dashoffset 0.6s" }}
                      />
                    </svg>
                    <span style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:C.white }}>{poseMatch.matchScore!=null?`${poseMatch.matchScore}%`:"—"}</span>
                  </div>
                  <div>
                    <p style={{ margin:"0 0 3px",fontSize:17,fontWeight:700,color:C.white,fontFamily:"inherit" }}>{poseMatch.matchLabel||"Feedback"}</p>
                    <p style={{ margin:0,fontSize:12,color:"rgba(255,255,255,0.5)",fontFamily:"inherit" }}>vs. {refs[selRef]?.label||"reference"}</p>
                  </div>
                </div>

                {/* Top priority — most impactful action */}
                {poseMatch.topPriority && (
                  <div style={{ background:`${C.yellow}18`,border:`1px solid ${C.yellow}40`,borderRadius:14,padding:"12px 14px",marginBottom:14,display:"flex",gap:10 }}>
                    <span style={{ fontSize:16,flexShrink:0 }}>⚡</span>
                    <div>
                      <p style={{ margin:"0 0 2px",fontSize:11,fontWeight:700,color:C.yellow,letterSpacing:0.6,textTransform:"uppercase" }}>Top priority</p>
                      <p style={{ margin:0,fontSize:14,color:C.white,lineHeight:1.5,fontFamily:"inherit" }}>{poseMatch.topPriority}</p>
                    </div>
                  </div>
                )}

                {/* 3 dimension rows */}
                {[
                  {key:"pose",icon:"🧍",label:"Pose"},
                  {key:"composition",icon:"📐",label:"Framing"},
                  {key:"mood",icon:"✨",label:"Mood"},
                ].map(dim => {
                  const d = poseMatch[dim.key]; if(!d) return null;
                  const col = d.status==="good"?"#4ADE80":d.status==="partial"?C.yellow:"#F87171";
                  return (
                    <div key={dim.key} style={{ background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"11px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start" }}>
                      <span style={{ fontSize:15,flexShrink:0,marginTop:1 }}>{dim.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                          <span style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:0.5,textTransform:"uppercase" }}>{dim.label}</span>
                          <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                            {d.score!=null && <span style={{ fontSize:11,fontWeight:600,color:col }}>{d.score}%</span>}
                            <div style={{ width:6,height:6,borderRadius:3,background:col }}/>
                          </div>
                        </div>
                        {d.instruction && <p style={{ margin:0,fontSize:13,color:"rgba(255,255,255,0.8)",lineHeight:1.4,fontFamily:"inherit" }}>{d.instruction}</p>}
                      </div>
                    </div>
                  );
                })}

                {/* Action buttons */}
                <div style={{ display:"flex",gap:10,marginTop:14 }}>
                  <button onClick={()=>setShowMatchPanel(false)} style={{ flex:1,padding:"12px 0",background:"rgba(255,255,255,0.08)",border:"none",borderRadius:14,fontSize:14,fontWeight:600,color:C.white,cursor:"pointer",fontFamily:"inherit" }}>
                    Keep shooting
                  </button>
                  <button onClick={()=>setShowMatchPanel(false)} style={{ flex:1,padding:"12px 0",background:C.yellow,border:"none",borderRadius:14,fontSize:14,fontWeight:700,color:C.dark,cursor:"pointer",fontFamily:"inherit" }}>
                    Check again
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding:"32px 24px",textAlign:"center" }}>
                <p style={{ fontSize:14,color:"rgba(255,255,255,0.5)",fontFamily:"inherit" }}>Could not analyse — try again</p>
                <button onClick={()=>setShowMatchPanel(false)} style={{ marginTop:16,padding:"10px 24px",background:C.yellow,border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Captured photos gallery overlay */}
      {showGallery && (
        <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.95)",zIndex:200,display:"flex",flexDirection:"column" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"60px 20px 16px" }}>
            <h3 style={{ margin:0,fontSize:17,fontWeight:700,color:C.white }}>Captured — {capturedPhotos.length} shot{capturedPhotos.length!==1?"s":""}</h3>
            <button onClick={()=>setShowGallery(false)} style={{ background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",width:36,height:36,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Ic n="close" size={16} color={C.white}/>
            </button>
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:"0 16px 32px" }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {capturedPhotos.map((p,i)=>(
                <div key={i} style={{ borderRadius:14,overflow:"hidden",position:"relative" }}>
                  <img src={p} alt="" style={{ width:"100%",aspectRatio:"4/3",objectFit:"cover",display:"block" }}/>
                  <button onClick={()=>savePhoto(p,i)} style={{ position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.6)",border:"none",cursor:"pointer",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Ic n="download" size={15} color={C.white}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:"0 16px 40px" }}>
            <button onClick={()=>{ stopCamera(); onGoTo("afterReflect"); }} style={{ width:"100%",padding:16,background:C.yellow,color:C.dark,border:"none",borderRadius:16,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
              Done — view full recap →
            </button>
          </div>
        </div>
      )}

      {/* Library Sheet */}
      {showLib && (
        <div style={{ position:"absolute",inset:0,zIndex:100 }}>
          <div onClick={()=>setShowLib(false)} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)" }}/>
          <div style={{ position:"absolute",bottom:0,left:0,right:0,background:C.white,borderRadius:"24px 24px 0 0",maxHeight:"80%",display:"flex",flexDirection:"column" }}>
            <div style={{ padding:"12px 20px 0",flexShrink:0 }}>
              <div style={{ width:36,height:4,background:C.gray200,borderRadius:2,margin:"0 auto 16px" }}/>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                <h3 style={{ margin:0,fontSize:17,fontWeight:700,color:C.dark }}>Reference Images</h3>
                <button onClick={()=>setShowLib(false)} style={{ background:"none",border:"none",cursor:"pointer" }}><Ic n="close" size={20} color={C.gray600}/></button>
              </div>
              <div style={{ display:"flex",background:C.gray100,borderRadius:12,padding:3,marginBottom:16 }}>
                {["All","Recent","My Plan","Templates"].map(t=>(
                  <button key={t} onClick={()=>setLibTab(t)} style={{ flex:1,padding:"7px 0",background:libTab===t?C.white:"transparent",border:"none",borderRadius:9,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:libTab===t?600:400,color:libTab===t?C.dark:C.gray400,boxShadow:libTab===t?"0 1px 4px rgba(0,0,0,0.08)":"none",whiteSpace:"nowrap" }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ overflowY:"auto",padding:"0 20px 32px" }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                {(libTab==="My Plan"?refs:[...refs,{id:10,color:"#B8E8C8",label:"Candid"},{id:11,color:"#E8C8B8",label:"Detail"}]).map(r=>(
                  <div key={r.id} onClick={()=>{setSelRef(r.id%4);setShowLib(false);}} style={{ aspectRatio:"3/4",borderRadius:10,background:r.color,cursor:"pointer",display:"flex",alignItems:"flex-end",border:selRef===r.id%4?`2.5px solid ${C.dark}`:"2.5px solid transparent" }}>
                    <div style={{ background:"rgba(0,0,0,0.35)",borderRadius:"0 0 8px 8px",padding:"4px 6px",width:"100%",boxSizing:"border-box" }}>
                      <p style={{ fontSize:9,color:C.white,margin:0,fontFamily:"inherit",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16,padding:14,background:C.gray50,borderRadius:14,border:`1px solid ${C.gray100}` }}>
                <p style={{ fontSize:12,fontWeight:600,color:C.dark,margin:"0 0 10px" }}>Or switch shooting context</p>
                {[
                  {tag:"Planned Event",title:"Graduation Day",meta:"Mar 22 · 5 shots",bg:C.dark,tc:C.white,mc:C.gray400},
                  {tag:"Mood Board",title:"Film & Natural Light",meta:"9 references",bg:C.gray100,tc:C.dark,mc:C.gray600},
                  {tag:"Casual",title:"Go with the flow",meta:"Light hints only",bg:C.white,tc:C.dark,mc:C.gray400},
                ].map((ctx,i)=>(
                  <div key={i} onClick={()=>setShowLib(false)} style={{ background:ctx.bg,borderRadius:12,padding:"10px 14px",marginBottom:8,cursor:"pointer",border:ctx.bg===C.white?`1px solid ${C.gray200}`:"none" }}>
                    <span style={{ fontSize:10,fontWeight:600,color:ctx.mc,letterSpacing:0.6,textTransform:"uppercase" }}>{ctx.tag}</span>
                    <p style={{ margin:"2px 0 0",fontSize:14,fontWeight:600,color:ctx.tc }}>{ctx.title}</p>
                    <p style={{ margin:"2px 0 0",fontSize:11,color:ctx.mc }}>{ctx.meta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pose Sheet */}
      {showPose && (
        <div style={{ position:"absolute",inset:0,zIndex:100 }}>
          <div onClick={()=>setShowPose(false)} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)" }}/>
          <div style={{ position:"absolute",bottom:0,left:0,right:0,background:C.white,borderRadius:"24px 24px 0 0",maxHeight:"75%" }}>
            <div style={{ padding:"12px 20px 0" }}>
              <div style={{ width:36,height:4,background:C.gray200,borderRadius:2,margin:"0 auto 16px" }}/>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                <h3 style={{ margin:0,fontSize:17,fontWeight:700,color:C.dark }}>Pose Suggestions</h3>
                <button onClick={()=>setShowPose(false)} style={{ background:"none",border:"none",cursor:"pointer" }}><Ic n="close" size={20} color={C.gray600}/></button>
              </div>
            </div>
            <div style={{ overflowY:"auto",padding:"0 20px 40px" }}>
              <p style={{ fontSize:12,color:C.gray400,margin:"0 0 12px" }}>Suggested for today's shoot</p>
              {[
                {label:"Fountain walk — side by side",sub:"From your plan",bg:"#F0C27F"},
                {label:"Cap toss — caught mid-air",sub:"From your plan",bg:"#C5D5C5"},
                {label:"Side profile — gaze into distance",sub:"From mood board",bg:"#C8BAD8"},
                {label:"Candid laugh — natural reaction",sub:"Recently used",bg:"#B8D4E8"},
              ].map((p,i)=>(
                <div key={i} onClick={()=>setShowPose(false)} style={{ display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.gray100}`,cursor:"pointer" }}>
                  <div style={{ width:48,height:60,borderRadius:10,background:p.bg,flexShrink:0 }}/>
                  <div><p style={{ fontSize:14,fontWeight:600,color:C.dark,margin:0 }}>{p.label}</p><p style={{ fontSize:11,color:C.gray400,margin:"3px 0 0" }}>{p.sub}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
      )}

    </div>
  );

};

// ═══════════════════════════════════════════════════════════════════════════════
// S5 — AFTER / REFLECT
// ═══════════════════════════════════════════════════════════════════════════════
