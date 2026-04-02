// Claude API helpers

const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY || "";

export async function callClaude(messages, maxTokens=1200) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model:"claude-sonnet-4-5-20251001", max_tokens:maxTokens, messages }),
  });
  const data = await resp.json();
  const text = (data.content||[]).map(b=>b.text||"").join("");
  return text.replace(/```json|```/g,"").trim();
}

// Analyse a reference image → extract shooting guidance in 3 dimensions

export async function analyseRefImage(base64Data) {
  try {
    const prompt = `You are an expert photography director AND pose coach. Deeply analyse this reference image to extract everything a photographer needs to recreate it with a real subject.

Return ONLY valid JSON (no markdown, no backtick fences):
{
  "people": [
    {
      "keypoints": [
        {"name":"nose","x":0.5,"y":0.1,"confidence":0.9},
        {"name":"left_eye","x":0.48,"y":0.08,"confidence":0.85},
        {"name":"right_eye","x":0.52,"y":0.08,"confidence":0.85},
        {"name":"left_ear","x":0.45,"y":0.09,"confidence":0.7},
        {"name":"right_ear","x":0.55,"y":0.09,"confidence":0.7},
        {"name":"left_shoulder","x":0.42,"y":0.22,"confidence":0.9},
        {"name":"right_shoulder","x":0.58,"y":0.22,"confidence":0.9},
        {"name":"left_elbow","x":0.38,"y":0.38,"confidence":0.85},
        {"name":"right_elbow","x":0.62,"y":0.38,"confidence":0.85},
        {"name":"left_wrist","x":0.35,"y":0.52,"confidence":0.8},
        {"name":"right_wrist","x":0.65,"y":0.52,"confidence":0.8},
        {"name":"left_hip","x":0.44,"y":0.55,"confidence":0.88},
        {"name":"right_hip","x":0.56,"y":0.55,"confidence":0.88},
        {"name":"left_knee","x":0.43,"y":0.72,"confidence":0.82},
        {"name":"right_knee","x":0.57,"y":0.72,"confidence":0.82},
        {"name":"left_ankle","x":0.42,"y":0.88,"confidence":0.78},
        {"name":"right_ankle","x":0.58,"y":0.88,"confidence":0.78}
      ],
      "poseLabel": "e.g. standing 3/4 turn left, weight on right leg",
      "bodyAngles": {
        "headTilt": "straight|left|right + degrees estimate",
        "shoulderLine": "level|left-high|right-high + degrees",
        "hipLine": "level|left-high|right-high + degrees",
        "torsoTwist": "facing camera|45-left|45-right|profile-left|profile-right",
        "armLeft": "e.g. relaxed at side, elbow bent 90deg, hand on hip",
        "armRight": "e.g. raised above head, elbow straight",
        "legStance": "e.g. feet shoulder-width, weight on right, left knee slightly bent"
      }
    }
  ],
  "sceneNote": "1-sentence scene description",
  "guidance": {
    "mood": "1-sentence emotional/atmospheric quality — what feeling to recreate",
    "poseSteps": [
      "Step-by-step instruction for the MOST critical body position (body part + exact direction)",
      "Second most important pose element",
      "Third pose element"
    ],
    "action": [
      "Specific subject action instruction under 12 words",
      "Second action instruction",
      "Third action instruction"
    ],
    "composition": [
      "Camera angle/framing instruction under 12 words",
      "Second composition instruction",
      "Third composition instruction"
    ],
    "poseMatchCriteria": [
      {"part":"head","target":"describe exact head position to match","weight":0.15},
      {"part":"shoulders","target":"describe shoulder position/angle to match","weight":0.25},
      {"part":"arms","target":"describe arm positions to match","weight":0.2},
      {"part":"torso","target":"describe torso angle/twist to match","weight":0.2},
      {"part":"legs","target":"describe leg stance to match","weight":0.2}
    ]
  },
  "visualGuide": {
    "subjectZone": {"x":0.25,"y":0.1,"w":0.5,"h":0.8},
    "compositionType": "rule-of-thirds|centered|diagonal|leading-lines",
    "accentColor": "#hex matching mood",
    "keyMarkers": [
      {"label":"Head","x":0.5,"y":0.12,"hint":"exact position description"},
      {"label":"Shoulders","x":0.5,"y":0.25,"hint":"angle description"},
      {"label":"Hands","x":0.45,"y":0.52,"hint":"hand position"}
    ]
  }
}
x,y are 0-1 normalised. If no person visible, return people:[] and focus guidance on scene/composition only.
Be SPECIFIC and ACTIONABLE. Avoid vague words like "natural" — describe exact angles and positions.`;
    const text = await callClaude([{ role:"user", content:[
      { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:base64Data }},
      { type:"text", text:prompt },
    ]}], 2000);
    return JSON.parse(text);
  } catch(e) {
    console.error("Ref analysis failed:", e);
    return null;
  }
}

// Compare viewfinder frame vs reference image → match score + instructions

export async function checkPoseMatch(liveBase64, refGuidance, refBase64) {
  // refGuidance: the poses object from analyseRefImage (has poseMatchCriteria, bodyAngles etc)
  // refBase64: optional — if provided, send image for visual comparison too
  try {
    const criteria = refGuidance && refGuidance.guidance && refGuidance.guidance.poseMatchCriteria
      ? refGuidance.guidance.poseMatchCriteria.map(function(c){ return c.part + ": " + c.target; }).join("\n")
      : "general pose, framing, and mood";

    const poseContext = refGuidance && refGuidance.people && refGuidance.people[0]
      ? "Reference pose: " + refGuidance.people[0].poseLabel + ". " +
        (refGuidance.people[0].bodyAngles ? JSON.stringify(refGuidance.people[0].bodyAngles) : "")
      : "";

    const prompt = "You are a real-time pose coach. Analyse the LIVE camera frame and evaluate how well it matches the reference.\n\n" +
      "REFERENCE pose criteria:\n" + criteria + "\n\n" +
      (poseContext ? "REFERENCE body angles:\n" + poseContext + "\n\n" : "") +
      "Return ONLY valid JSON:\n" +
      "{\n" +
      "  \"matchScore\": 72,\n" +
      "  \"matchLabel\": \"Getting close\",\n" +
      "  \"pose\": {\n" +
      "    \"score\": 65,\n" +
      "    \"status\": \"partial\",\n" +
      "    \"instruction\": \"most critical single pose fix under 12 words\",\n" +
      "    \"details\": [\"specific body part fix 1\", \"specific body part fix 2\"]\n" +
      "  },\n" +
      "  \"composition\": {\n" +
      "    \"score\": 80,\n" +
      "    \"status\": \"good\",\n" +
      "    \"instruction\": \"most critical framing fix under 12 words\"\n" +
      "  },\n" +
      "  \"mood\": {\n" +
      "    \"score\": 70,\n" +
      "    \"status\": \"partial\",\n" +
      "    \"instruction\": \"most critical mood/expression fix under 12 words\"\n" +
      "  },\n" +
      "  \"topPriority\": \"The single most impactful change to make right now, under 15 words\"\n" +
      "}\n\n" +
      "matchScore 0-100. status: good(>=75), partial(40-74), off(<40). matchLabel: Great match|Getting close|Keep adjusting|Starting out. Be specific — name exact body parts and directions.";

    const content = [];
    if (refBase64) {
      content.push({ type:"text", text:"REFERENCE image (target):" });
      content.push({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:refBase64 }});
    }
    content.push({ type:"text", text:"LIVE camera frame:" });
    content.push({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:liveBase64 }});
    content.push({ type:"text", text:prompt });

    const text = await callClaude([{ role:"user", content }], 1000);
    return JSON.parse(text);
  } catch(e) {
    console.error("Pose match failed:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// S1 — PLAN HOME
// ═══════════════════════════════════════════════════════════════════════════════

