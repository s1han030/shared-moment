import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../lib/constants.js';

export const PoseSkeleton = ({ keypoints, width, height, color="#F5C842" }) => {
  if (!keypoints || keypoints.length === 0) return null;
  // COCO-style connections
  const connections = [
    [0,1],[0,2],[1,3],[2,4],       // head
    [5,6],[5,7],[7,9],[6,8],[8,10], // arms
    [5,11],[6,12],[11,12],           // torso
    [11,13],[13,15],[12,14],[14,16], // legs
  ];
  const kp = keypoints;
  return (
    <svg width={width} height={height} style={{ position:"absolute", top:0, left:0, pointerEvents:"none" }}>
      {connections.map(([a,b],i) => {
        if (!kp[a] || !kp[b] || kp[a].confidence < 0.3 || kp[b].confidence < 0.3) return null;
        return (
          <line key={i}
            x1={kp[a].x * width} y1={kp[a].y * height}
            x2={kp[b].x * width} y2={kp[b].y * height}
            stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.9"
          />
        );
      })}
      {kp.map((pt, i) => pt && pt.confidence >= 0.3 ? (
        <circle key={i} cx={pt.x*width} cy={pt.y*height} r="4"
          fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
      ) : null)}
    </svg>
  );
};

// ─── Claude API helpers ───────────────────────────────────────────────────────
