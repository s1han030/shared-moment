import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';
import { StatusBar } from '../components/StatusBar.jsx';
import { FloatingNav } from '../components/FloatingNav.jsx';
import { Ic } from '../components/Ic.jsx';

export const PlanHome = ({ onNav, onGoTo }) => {
  const [filter, setFilter] = useState("All");
  const [calView, setCalView] = useState(false);
  const [calMode, setCalMode] = useState("week");
  const [selectedDay, setSelectedDay] = useState(null);
  const [dragPlan, setDragPlan] = useState(null);
  const [daySchedule, setDaySchedule] = useState({});
  const [weekDaySchedule, setWeekDaySchedule] = useState({});
  const [showTimeAxis, setShowTimeAxis] = useState(null);

  const plans = [
    { id:0, name:"Graduation Day", date:"Mar 22", day:22, loc:"Central Park", shots:5, ppl:2, style:["Golden hour","Candid"], scheduled:true, color:C.white,
      refs:[{color:"#F0C27F"},{color:"#C5D5C5"},{color:"#C8BAD8"}] },
    { id:1, name:"Cafe Shoot", date:"Feb 28", day:28, loc:"Maman NYC", shots:3, ppl:1, style:["Moody","Close-up"], scheduled:true, color:C.gray50,
      refs:[{color:"#E8B8A0"},{color:"#D8C8B0"}] },
    { id:2, name:"Family Picnic", date:"Apr 5", day:5, loc:"Riverside", shots:4, ppl:3, style:["Bright","Warm"], scheduled:true, color:C.white,
      refs:[{color:"#B8E8C8"},{color:"#C5D5C5"},{color:"#D8E8C8"}] },
    { id:3, name:"Street Vibes", date:null, day:null, loc:null, shots:2, ppl:1, style:["Urban","BW"], scheduled:false, color:C.gray50,
      refs:[{color:"#B0B0C0"}] },
    { id:4, name:"Golden Portrait", date:null, day:null, loc:null, shots:3, ppl:1, style:["Soft light"], scheduled:false, color:C.white,
      refs:[{color:"#F0C27F"},{color:"#E8C8A8"}] },
  ];
  const filtered = filter==="All" ? plans : filter==="Scheduled" ? plans.filter(function(p){return p.scheduled;}) : plans.filter(function(p){return !p.scheduled;});

  const weekDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weekDates = [29,30,31,1,2,3,4];
  const hours = [8,9,10,11,12,13,14,15,16,17,18];
  const scheduledDays = {22:plans[0], 28:plans[1]};
  const unscheduled = plans.filter(function(p){return !p.scheduled;});

  function handleDayDrop(date) {
    if (!dragPlan) return;
    setWeekDaySchedule(function(prev){ var n=Object.assign({},prev); n[date]=dragPlan.id; return n; });
    setShowTimeAxis(date);
    setDragPlan(null);
  }
  function handleTimeDrop(day, hour) {
    if (!dragPlan) return;
    setDaySchedule(function(prev){
      var n=Object.assign({},prev);
      if (!n[day]) n[day]=[];
      n[day]=n[day].filter(function(e){return e.planId!==dragPlan.id;});
      n[day].push({planId:dragPlan.id, hour:hour});
      return n;
    });
    setShowTimeAxis(null);
    setDragPlan(null);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", position:"relative", background:C.white }}>
      <StatusBar />
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 120px" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:18 }}>
          <div>
            <p style={{ fontSize:12, color:C.gray400, margin:"0 0 3px" }}>Tuesday, Mar 31</p>
            <h1 style={{ fontSize:26, fontWeight:700, margin:0, color:C.dark }}>Your Plans</h1>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={function(){ setCalView(function(v){return !v;}); }}
              style={{ width:34, height:34, borderRadius:17, background:calView?C.dark:C.gray100, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={calView?C.white:C.gray600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            <button onClick={function(){ onGoTo("createEvent"); }}
              style={{ width:34, height:34, borderRadius:17, background:C.yellow, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Ic n="plus" size={16} color={C.dark}/>
            </button>
          </div>
        </div>

        {/* CALENDAR */}
        {calView && (
          <div style={{ background:C.gray50, borderRadius:20, padding:16, marginBottom:20, border:"1px solid "+C.gray100 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:14, fontWeight:700, color:C.dark }}>March 2026</span>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ display:"flex", background:"rgba(0,0,0,0.07)", borderRadius:10, padding:2 }}>
                  {["week","day"].map(function(m){
                    const labels={"week":"Recent","day":"Today"};
                    return <button key={m} onClick={function(){setCalMode(m); setShowTimeAxis(null);}}
                      style={{ padding:"3px 11px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:10, fontWeight:calMode===m?700:400, background:calMode===m?C.white:"transparent", color:calMode===m?C.dark:C.gray400 }}>{labels[m]}</button>;
                  })}
                </div>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:15, color:C.gray400 }}>{"<"}</button>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:15, color:C.gray400 }}>{">"}</button>
              </div>
            </div>

            {calMode==="week" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:8 }}>
                  {weekDays.map(function(d,i){
                    const date=weekDates[i];
                    const plan=scheduledDays[date];
                    const droppedId=weekDaySchedule[date];
                    const dropped=droppedId!=null ? plans.find(function(p){return p.id===droppedId;}) : null;
                    const shown=plan||dropped;
                    const isToday=date===31;
                    return (
                      <div key={d}
                        onDragOver={function(e){e.preventDefault();}}
                        onDrop={function(){handleDayDrop(date);}}
                        onClick={function(){if(shown) setShowTimeAxis(showTimeAxis===date?null:date);}}
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"5px 0",
                          borderRadius:10, background:showTimeAxis===date?"rgba(0,0,0,0.05)":"transparent",
                          border:dragPlan?"1.5px dashed rgba(0,0,0,0.2)":"1.5px solid transparent", cursor:shown?"pointer":"default" }}>
                        <span style={{ fontSize:9, color:C.gray400, fontWeight:600 }}>{d}</span>
                        {shown
                          ? <div style={{ width:30, height:30, borderRadius:15, background:shown.color, border:"2px solid rgba(255,255,255,0.8)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.12)" }}>
                              <span style={{ fontSize:9, fontWeight:700, color:C.dark }}>{date}</span>
                            </div>
                          : <div style={{ width:26, height:26, borderRadius:13, background:isToday?"rgba(0,0,0,0.07)":"rgba(0,0,0,0.03)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:10, color:isToday?C.dark:C.gray400 }}>{date}</span>
                            </div>
                        }
                      </div>
                    );
                  })}
                </div>

                {showTimeAxis!==null && (
                  <div style={{ background:C.white, borderRadius:14, border:"1px solid "+C.gray100, marginBottom:8, overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderBottom:"1px solid "+C.gray100, background:C.gray50 }}>
                      <div style={{ width:6, height:6, borderRadius:3, background:C.yellow }}/>
                      <span style={{ fontSize:11, fontWeight:700, color:C.dark }}>Mar {showTimeAxis}</span>
                      <span style={{ fontSize:10, color:C.gray400, marginLeft:"auto" }}>drag plan to schedule</span>
                    </div>
                    <div style={{ maxHeight:160, overflowY:"auto" }}>
                      {hours.map(function(h){
                        const entry=(daySchedule[showTimeAxis]||[]).find(function(e){return e.hour===h;});
                        const ep=entry?plans.find(function(p){return p.id===entry.planId;}):null;
                        const label=h>12?(h-12)+":00 PM":h+":00 AM";
                        return (
                          <div key={h}
                            onDragOver={function(e){e.preventDefault();}}
                            onDrop={function(){handleTimeDrop(showTimeAxis,h);}}
                            style={{ display:"flex", alignItems:"stretch", minHeight:36, borderBottom:"1px solid "+C.gray100 }}>
                            {/* Time label column */}
                            <div style={{ width:60, flexShrink:0, padding:"8px 10px", display:"flex", alignItems:"flex-start", borderRight:"1px solid "+C.gray100 }}>
                              <span style={{ fontSize:9, color:C.gray400, fontWeight:500, whiteSpace:"nowrap" }}>{label}</span>
                            </div>
                            {/* Event column */}
                            <div style={{ flex:1, padding:"4px 10px", display:"flex", alignItems:"center",
                              background:ep?ep.color+"33":"transparent" }}>
                              {ep
                                ? <div draggable
                                    onDragStart={function(){setDragPlan(ep);
                                      setDaySchedule(function(prev){
                                        var n=Object.assign({},prev);
                                        if(n[showTimeAxis]) n[showTimeAxis]=n[showTimeAxis].filter(function(e){return e.hour!==h;});
                                        return n;
                                      });
                                    }}
                                    style={{ background:ep.color||C.gray100, borderRadius:8, padding:"5px 10px", width:"100%", borderLeft:"3px solid rgba(0,0,0,0.15)", cursor:"grab" }}>
                                    <p style={{ fontSize:11, fontWeight:700, color:C.dark, margin:"0 0 1px" }}>{ep.name}</p>
                                    <p style={{ fontSize:9, color:"rgba(0,0,0,0.5)", margin:0 }}>{label}</p>
                                  </div>
                                : <div style={{ width:"100%", height:24, borderRadius:6, border:"1.5px dashed rgba(0,0,0,0.1)", display:"flex", alignItems:"center", paddingLeft:8 }}>
                                    <span style={{ fontSize:9, color:"rgba(0,0,0,0.18)" }}>Drop here</span>
                                  </div>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ borderTop:"1px solid "+C.gray200, paddingTop:8 }}>
                  <p style={{ fontSize:9, fontWeight:700, color:C.gray400, margin:"0 0 6px", letterSpacing:0.5, textTransform:"uppercase" }}>Unscheduled — drag to a day above</p>
                  <div style={{ display:"flex", gap:7, overflowX:"auto" }}>
                    {unscheduled.map(function(p){
                      return (
                        <div key={p.id} draggable onDragStart={function(){setDragPlan(p);}} onDragEnd={function(){setDragPlan(null);}}
                          style={{ flexShrink:0, background:p.color, borderRadius:10, padding:"6px 10px", cursor:"grab", opacity:dragPlan&&dragPlan.id===p.id?0.35:1, transition:"opacity 0.15s" }}>
                          <p style={{ fontSize:10, fontWeight:600, color:C.dark, margin:"0 0 1px" }}>{p.name}</p>
                          <p style={{ fontSize:9, color:"rgba(0,0,0,0.4)", margin:0 }}>{p.style[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {calMode==="day" && (
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:C.gray600, margin:"0 0 8px" }}>Tuesday, Mar 31</p>
                <div style={{ borderRadius:14, border:"1px solid "+C.gray100, overflow:"hidden", maxHeight:220, overflowY:"auto", background:C.white }}>
                  <div style={{ display:"grid", gridTemplateColumns:"60px 1fr", borderBottom:"1px solid "+C.gray100, background:C.gray50 }}>
                    <div style={{ padding:"7px 10px", fontSize:9, fontWeight:600, color:C.gray400, borderRight:"1px solid "+C.gray100 }}>Time</div>
                    <div style={{ padding:"7px 10px", fontSize:9, fontWeight:600, color:C.gray400 }}>Tuesday, Mar 31</div>
                  </div>
                  {hours.map(function(h){
                    const entry=(daySchedule[31]||[]).find(function(e){return e.hour===h;});
                    const ep=entry?plans.find(function(p){return p.id===entry.planId;}):null;
                    const label=h>12?(h-12)+":00 PM":h+":00 AM";
                    return (
                      <div key={h}
                        onDragOver={function(e){e.preventDefault();}}
                        onDrop={function(){handleTimeDrop(31,h);}}
                        style={{ display:"grid", gridTemplateColumns:"60px 1fr", minHeight:42, borderBottom:"1px solid "+C.gray100 }}>
                        <div style={{ padding:"10px 10px 0", borderRight:"1px solid "+C.gray100, background:C.gray50 }}>
                          <span style={{ fontSize:9, color:C.gray400, whiteSpace:"nowrap", fontWeight:500 }}>{label}</span>
                        </div>
                        <div style={{ padding:"4px 8px", display:"flex", alignItems:"center", background:ep?ep.color+"22":"transparent" }}>
                          {ep
                            ? <div draggable
                                onDragStart={function(){setDragPlan(ep);
                                  setDaySchedule(function(prev){
                                    var n=Object.assign({},prev);
                                    if(n[31]) n[31]=n[31].filter(function(e){return e.hour!==h;});
                                    return n;
                                  });
                                }}
                                style={{ background:ep.color||C.gray100, borderRadius:10, padding:"6px 12px", width:"100%", borderLeft:"3px solid rgba(0,0,0,0.18)", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", cursor:"grab" }}>
                                <p style={{ fontSize:12, fontWeight:700, color:C.dark, margin:"0 0 1px" }}>{ep.name}</p>
                                <p style={{ fontSize:9, color:"rgba(0,0,0,0.45)", margin:0 }}>{ep.style&&ep.style[0]}</p>
                              </div>
                            : <div style={{ width:"100%", height:28, borderRadius:8, border:"1.5px dashed rgba(0,0,0,0.1)", display:"flex", alignItems:"center", paddingLeft:10 }}>
                                <span style={{ fontSize:9, color:"rgba(0,0,0,0.18)" }}>Drop plan here</span>
                              </div>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop:"1px solid "+C.gray200, paddingTop:8, marginTop:10 }}>
                  <p style={{ fontSize:9, fontWeight:700, color:C.gray400, margin:"0 0 6px", letterSpacing:0.5, textTransform:"uppercase" }}>Drag a plan to schedule</p>
                  <div style={{ display:"flex", gap:7, overflowX:"auto" }}>
                    {plans.map(function(p){
                      return (
                        <div key={p.id} draggable onDragStart={function(){setDragPlan(p);}} onDragEnd={function(){setDragPlan(null);}}
                          style={{ flexShrink:0, background:p.color, borderRadius:10, padding:"6px 10px", cursor:"grab", opacity:dragPlan&&dragPlan.id===p.id?0.35:1 }}>
                          <p style={{ fontSize:10, fontWeight:600, color:C.dark, margin:"0 0 1px" }}>{p.name}</p>
                          <p style={{ fontSize:9, color:"rgba(0,0,0,0.4)", margin:0 }}>{p.date||"No date"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:20, paddingBottom:2 }}>
          {["All","Scheduled","Unscheduled"].map(function(f){
            return <button key={f} onClick={function(){setFilter(f);}}
              style={{ flexShrink:0, padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:filter===f?700:400, background:filter===f?C.dark:C.gray100, color:filter===f?C.white:C.gray600 }}>{f}</button>;
          })}
        </div>

        {/* Plan cards */}
        {filtered.map(function(plan, cardIdx){
          const isHero=cardIdx===0;
          return (
            <div key={plan.id} onClick={function(){ onGoTo("eventDetail"); }}
              style={{ background:plan.color, borderRadius:isHero?22:18, padding:isHero?20:16, marginBottom:12, cursor:"pointer", position:"relative", overflow:"hidden", border:"1px solid "+C.gray100, boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
              {isHero && <div style={{ position:"absolute", top:-24, right:-24, width:110, height:110, background:"rgba(255,255,255,0.18)", borderRadius:"50%" }}/>}

              {/* Ref strip */}
              {plan.refs && plan.refs.length>0 && (
                <div style={{ display:"flex", gap:5, marginBottom:10 }}>
                  {plan.refs.map(function(ref,ri){
                    return (
                      <div key={ri} style={{ flexShrink:0, width:isHero?50:40, height:isHero?64:52, borderRadius:isHero?11:9,
                        background:ref.src?"transparent":ref.color, border:"2px solid rgba(255,255,255,0.65)",
                        overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:"0 2px 6px rgba(0,0,0,0.1)" }}>
                        {ref.src
                          ? <img src={ref.src} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/>
                          : <Ic n="image" size={12} color="rgba(255,255,255,0.55)"/>
                        }
                      </div>
                    );
                  })}
                  {plan.shots>plan.refs.length && (
                    <div style={{ flexShrink:0, width:isHero?50:40, height:isHero?64:52, borderRadius:isHero?11:9,
                      background:"rgba(0,0,0,0.08)", border:"2px solid rgba(255,255,255,0.4)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:10, fontWeight:700, color:"rgba(0,0,0,0.4)" }}>+{plan.shots-plan.refs.length}</span>
                    </div>
                  )}
                </div>
              )}

              {isHero && <p style={{ fontSize:10, fontWeight:700, color:"rgba(0,0,0,0.45)", margin:"0 0 4px", letterSpacing:1, textTransform:"uppercase" }}>Next Up · {plan.date}</p>}
              {!isHero && (plan.date
                ? <p style={{ fontSize:11, color:"rgba(0,0,0,0.45)", margin:"0 0 3px" }}>{plan.date}{plan.loc?" · "+plan.loc:""}</p>
                : <span style={{ fontSize:9, fontWeight:700, background:"rgba(0,0,0,0.08)", borderRadius:6, padding:"2px 7px", color:"rgba(0,0,0,0.4)", letterSpacing:0.4, textTransform:"uppercase", display:"inline-block", marginBottom:4 }}>No date yet</span>
              )}
              <h2 style={{ fontSize:isHero?22:16, fontWeight:700, margin:"0 0 6px", color:C.dark }}>{plan.name}</h2>
              {isHero && plan.loc && (
                <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:8 }}>
                  <Ic n="location" size={12} color="rgba(0,0,0,0.45)"/>
                  <span style={{ fontSize:12, color:"rgba(0,0,0,0.55)" }}>{plan.loc}</span>
                </div>
              )}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:isHero?12:8 }}>
                {plan.style.map(function(t){
                  return <span key={t} style={{ fontSize:10, fontWeight:600, background:"rgba(0,0,0,0.08)", borderRadius:10, padding:"2px 9px", color:"rgba(0,0,0,0.55)" }}>{t}</span>;
                })}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ display:"flex" }}>
                  {Array.from({length:Math.min(plan.ppl,3)}, function(_,i){
                    return <div key={i} style={{ width:20, height:20, borderRadius:10, background:"rgba(0,0,0,0.18)", border:"1.5px solid rgba(255,255,255,0.7)", marginLeft:i?-6:0 }}/>;
                  })}
                </div>
                <span style={{ fontSize:11, color:"rgba(0,0,0,0.45)" }}>{plan.ppl} {plan.ppl===1?"person":"people"}</span>
                <span style={{ fontSize:11, color:"rgba(0,0,0,0.35)", marginLeft:"auto" }}>{plan.shots} shots</span>
              </div>
            </div>
          );
        })}
      </div>
      <FloatingNav active="plan" onNav={onNav}/>
    </div>
  );
};
