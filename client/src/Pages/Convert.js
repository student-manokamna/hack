import '../App.css';
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

// React Three Fiber - declarative Three.js in React
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMHumanBoneName } from '@pixiv/three-vrm';

// Kalidokit for ISL Gloss → bone rotation math
import { Pose as KalidokitPose, Hand as KalidokitHand } from 'kalidokit';

// Original Sign Kit hardcoded animations
import * as words from '../Animations/words';
import { defaultPose } from '../Animations/defaultPose';

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// ── Background FX (Technical Grid + Glowing Orbs) ───────────────────────────
function BackgroundFX() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="tech-grid" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
      <div className="glowing-orb" style={{ top: '10%', left: '15%', width: '300px', height: '300px', background: 'var(--glow)' }} />
      <div className="glowing-orb" style={{ bottom: '15%', right: '10%', width: '400px', height: '400px', background: 'var(--accent)', animationDelay: '-5s' }} />
      <div className="glowing-orb" style={{ top: '40%', right: '20%', width: '250px', height: '250px', background: 'var(--green-glow)', animationDelay: '-10s' }} />
    </div>
  );
}

// ── VRM Avatar Scene Component (Logic + Rendering + 2D Canvas) ───────────────
function VRMAvatarScene({ animRef }) {
  const vrmRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register(p => new VRMLoaderPlugin(p));
    loader.load('/AvatarSample_B.vrm', gltf => {
      const vrm = gltf.userData.vrm;
      vrm.scene.rotation.y = 0;
      vrmRef.current = vrm;
      animRef.current.vrm = vrm;
      animRef.current.avatar = vrm;
      vrm.scene.traverse(o => { o.frustumCulled = false; });
    }, undefined, err => console.error('VRM:', err));
  }, [animRef]);

  const rigRotation = (vrm, boneName, rotation, dampener = 1, lerpAmt = 0.3) => {
    if (!vrm || !rotation) return;
    const boneNode = vrm.humanoid.getNormalizedBoneNode(boneName);
    if (!boneNode) return;
    const euler = new THREE.Euler(rotation.x * dampener, rotation.y * dampener, rotation.z * dampener, 'XYZ');
    const quat = new THREE.Quaternion().setFromEuler(euler);
    boneNode.quaternion.slerp(quat, lerpAmt);
  };

  useFrame(() => {
    const ref = animRef.current;
    const vrm = vrmRef.current;
    if (!vrm) return;

    if (ref.jsonFrames && ref.currentFrame < ref.jsonFrames.length) {
      const now = performance.now();
      const dur = (1000 / (ref.fps || 25)) * (0.1 / Math.max(ref.speed || 0.1, 0.01));

      if (now - (ref.lastFrameTime || 0) >= dur) {
        const fd = ref.jsonFrames[ref.currentFrame];

        // Grab the canvases from the new layout
        const cnvBg = document.getElementById('sk_canvas');
        const cnvFg = document.getElementById('sk_canvas_fg');

        // ── 2D Canvas Skeleton Drawing (File 1 Perfect Stick Diagram) ──
        if (cnvFg && cnvBg) {
          [cnvBg, cnvFg].forEach(c => {
            if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
              c.width = c.clientWidth; c.height = c.clientHeight;
            }
          });

          const ctxBg = cnvBg.getContext('2d');
          const ctx = cnvFg.getContext('2d'); // Use context of foreground canvas
          const W = cnvFg.width, H = cnvFg.height;

          ctxBg.clearRect(0, 0, W, H); // Clear bg layer
          ctx.clearRect(0, 0, W, H);   // Clear fg layer

          const P = Array(33).fill(null);
          (fd.pose || []).forEach((lm) => {
            if ((lm.visibility || 1) > 0.15) P[lm.id] = { x: lm.x, y: lm.y };
          });

          // Helper: convert normalized [0-1] pose coords → canvas px
          const px = (lm) => lm ? { x: lm.x * W, y: lm.y * H } : null;

          // ── Draw a thick glowing bone line ──
          const bone = (a, b, color = '#4ade80', width = 8) => {
            const pa = px(a), pb = px(b);
            if (!pa || !pb) return;
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
            ctx.restore();
          };

          // ── Draw a joint dot ──
          const joint = (lm, r = 7, fill = '#fff', glow = '#6ee7b7') => {
            const p = px(lm);
            if (!p) return;
            ctx.save();
            ctx.shadowBlur = 14;
            ctx.shadowColor = glow;
            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          };

          // Body: torso
          bone(P[11], P[12], '#60a5fa', 10); // Shoulders
          bone(P[23], P[24], '#60a5fa', 10); // Hips
          bone(P[11], P[23], '#60a5fa', 8);  // Left torso
          bone(P[12], P[24], '#60a5fa', 8);  // Right torso

          // Arms
          bone(P[11], P[13], '#4ade80', 9);  // L upper arm
          bone(P[13], P[15], '#4ade80', 7);  // L lower arm
          bone(P[12], P[14], '#4ade80', 9);  // R upper arm
          bone(P[14], P[16], '#4ade80', 7);  // R lower arm

          // Neck
          const midShoulder = (P[11] && P[12]) ? { x: (P[11].x + P[12].x) / 2, y: (P[11].y + P[12].y) / 2 } : null;
          if (midShoulder && P[0]) bone(midShoulder, P[0], '#f9a8d4', 6);

          // Legs
          bone(P[23], P[25], '#a78bfa', 9);  // L upper leg
          bone(P[25], P[27], '#a78bfa', 7);  // L lower leg
          bone(P[24], P[26], '#a78bfa', 9);  // R upper leg
          bone(P[26], P[28], '#a78bfa', 7);  // R lower leg

          // Joint dots
          [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(i => joint(P[i], 7, '#fff', '#6ee7b7'));
          joint(P[15], 9, '#4ade80', '#4ade80'); // L wrist accent
          joint(P[16], 9, '#4ade80', '#4ade80'); // R wrist accent

          // ── Head circle ──
          if (P[0]) {
            const hp = px(P[0]);
            const shoulderW = (P[11] && P[12]) ? Math.abs(P[12].x - P[11].x) * W : 60;
            const headR = Math.max(shoulderW * 0.35, 28);

            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#fbbf24';
            ctx.fillStyle = '#fde68a';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(hp.x, hp.y - headR * 0.5, headR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const hy = hp.y - headR * 0.5;
            // Eyes
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#1e293b';
            ctx.beginPath(); ctx.arc(hp.x - headR * 0.3, hy - headR * 0.15, headR * 0.1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hp.x + headR * 0.3, hy - headR * 0.15, headR * 0.1, 0, Math.PI * 2); ctx.fill();
            // Smile
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(hp.x, hy + headR * 0.05, headR * 0.3, 0.2, Math.PI - 0.2);
            ctx.stroke();
            ctx.restore();
          }

          // ── Finger bones ──
          const FINGER_COLORS = ['#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc'];
          const FINGER_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20]
          ];
          const FCOLOR_IDX = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];

          const drawHand = (hand) => {
            if (!hand || hand.length < 5) return;
            const lms = Array(21).fill(null);
            hand.forEach(p => { if (p && p.id != null) lms[p.id] = p; });
            FINGER_CONNECTIONS.forEach(([a, b], ci) => {
              const pa = lms[a] ? px(lms[a]) : null;
              const pb = lms[b] ? px(lms[b]) : null;
              if (!pa || !pb) return;
              const clr = FINGER_COLORS[FCOLOR_IDX[ci]];
              ctx.save();
              ctx.shadowBlur = 8; ctx.shadowColor = clr;
              ctx.strokeStyle = clr; ctx.lineWidth = 4; ctx.lineCap = 'round';
              ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
              ctx.restore();
            });
            lms.forEach(p => {
              if (!p) return;
              const pp = px(p);
              ctx.fillStyle = '#fff';
              ctx.beginPath(); ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2); ctx.fill();
            });
          };
          drawHand(fd.left_hand);
          drawHand(fd.right_hand);
        }

        // ── KALIDOKIT SOLVE ──
        const p3d = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 }), p2d = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 });
        (fd.pose3d || fd.pose || []).forEach((lm, i) => { const id = lm.id ?? i; if (id < 33) p3d[id] = { x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility || 1 }; });
        (fd.pose || []).forEach((lm, i) => { const id = lm.id ?? i; if (id < 33) p2d[id] = { x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility || 1 }; });

        try {
          const poseRig = KalidokitPose.solve(p3d, p2d, { runtime: 'mediapipe' });
          if (poseRig) {
            ['Chest', 'Spine', 'Neck', 'Head', 'LeftUpperArm', 'LeftLowerArm', 'RightUpperArm', 'RightLowerArm'].forEach(b => {
              rigRotation(vrm, VRMHumanBoneName[b], poseRig[b], b.includes('Spine') ? 0.5 : 1);
            });
          }
        } catch { }

        const solveH = (hData, s) => {
          if (!hData || hData.length < 5) return;
          const lms = Array(21).fill({ x: 0, y: 0, z: 0 }); hData.forEach((lm, i) => { const id = lm.id ?? i; if (id < 21) lms[id] = { x: lm.x, y: lm.y, z: lm.z }; });
          try {
            const rig = KalidokitHand.solve(lms, s);
            if (rig) {
              rigRotation(vrm, VRMHumanBoneName[`${s}Hand`], rig[`${s}Wrist`], 1.0, 0.5);
              ['Thumb', 'Index', 'Middle', 'Ring', 'Little'].forEach(f => {
                ['Proximal', 'Intermediate', 'Distal'].forEach(seg => {
                  const bName = VRMHumanBoneName[`${s}${f}${seg}`];
                  if (bName) rigRotation(vrm, bName, rig[f === 'Little' ? `${s}Pinky${seg}` : `${s}${f}${seg}`], 1.0, 0.5);
                });
              });
            }
          } catch { }
        };
        solveH(fd.right_hand, 'Right'); solveH(fd.left_hand, 'Left');

        ref.currentFrame++; ref.lastFrameTime = now;
        const pb = document.getElementById('ap_bar');
        if (pb) pb.style.width = `${Math.round(ref.currentFrame / ref.jsonFrames.length * 100)}%`;

        if (ref.currentFrame >= ref.jsonFrames.length) {
          ref.jsonFrames = null;
          if (ref.onJsonFinish) { const cb = ref.onJsonFinish; ref.onJsonFinish = null; cb(); }
        }
      }
    }

    // ── Classic Hardcoded ──
    if (!ref.jsonFrames && ref.animations?.length > 0) {
      const anim = ref.animations[0];
      if (anim.length) {
        if (!ref.flag) {
          if (anim[0] === 'add-text') { ref.setTextCb?.(prev => prev + anim[1]); ref.animations.shift(); }
          else {
            for (let i = 0; i < anim.length;) {
              const [bn, ac, ax, lim, sign] = anim[i];
              const bone = vrm.scene.getObjectByName(bn);
              if (!bone) { i++; continue; }
              if (sign === '+' && bone[ac][ax] < lim) { bone[ac][ax] = Math.min(bone[ac][ax] + (ref.speed || 0.1), lim); i++; }
              else if (sign === '-' && bone[ac][ax] > lim) { bone[ac][ax] = Math.max(bone[ac][ax] - (ref.speed || 0.1), lim); i++; }
              else anim.splice(i, 1);
            }
          }
        }
      } else {
        ref.flag = true; setTimeout(() => { ref.flag = false; }, ref.pause || 800); ref.animations.shift();
      }
    }
    vrm.update(clockRef.current.getDelta());
  });

  return vrmRef.current ? <primitive object={vrmRef.current.scene} /> : null;
}

// ─── Main Studio ─────────────────────────────────────────────────────────────
export default function Convert() {
  const [text, setText] = useState('');
  const [statusMsg, setStatus] = useState('');
  const [isBusy, setBusy] = useState(false);
  const [tab, setTab] = useState('text');
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);

  const animRef = useRef({
    flag: false, animations: [], jsonFrames: null, currentFrame: 0,
    fps: 25, lastFrameTime: 0, speed: 0.1, pause: 800, vrm: null, avatar: null,
  });

  const textRef = useRef(null);
  const vidRef = useRef(null);
  const audioRef = useRef(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => { animRef.current.setTextCb = setText; }, []);
  useEffect(() => { animRef.current.speed = speed; }, [speed]);
  useEffect(() => { animRef.current.pause = pause; }, [pause]);

  const playJSON = useCallback(url => new Promise(async resolve => {
    try {
      const r = await fetch(url); if (!r.ok) throw new Error();
      let d = await r.json();
      if (d.animation_url) { const sr = await fetch(d.animation_url); if (sr.ok) d = await sr.json(); }
      const ref = animRef.current;
      defaultPose(ref);
      ref.currentFrame = 0; ref.jsonFrames = d.frames;
      ref.fps = d.metadata?.fps || 25;

      ref.onJsonFinish = resolve; ref.lastFrameTime = performance.now();
      const pb = document.getElementById('ap_bar'); if (pb) pb.style.width = '0%';
    } catch { resolve(); }
  }), []);

  const playSeq = useCallback(async seq => {
    setBusy(true); setText('');
    for (const s of seq) {
      setStatus(`Signing: ${s.word}`);
      setText(p => p + (s.type === 'sign' ? ` [${s.word.toUpperCase()}]` : s.word.toUpperCase()));
      await playJSON(s.file);
      await new Promise(r => setTimeout(r, s.type === 'sign' ? 300 : 80));
    }
    setStatus('Sequence complete ✓'); setBusy(false);
  }, [playJSON]);

  const handleTranslate = async () => {
    const inp = tab === 'text' ? textRef.current?.value : transcript;
    if (!inp?.trim()) return;
    setBusy(true); setStatus('AI Translation in progress…');
    try {
      const r = await fetch('http://localhost:8000/text-to-sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: inp }),
      });
      const d = await r.json();
      if (d.animation_sequence?.length) await playSeq(d.animation_sequence);
      else {
        // Fallback to hardcoded/fingerspelling logic if backend lacks sequence
        const wordsArr = inp.toUpperCase().split(/\s+/);
        for (const w of wordsArr) {
          if (words[w]) { setText(p => p + `[${w}] `); words[w](animRef.current); await new Promise(r => setTimeout(r, pause)); }
        }
        setStatus('Finished (Classic Fallback)');
      }
    } catch { setStatus('System offline — using fallback.'); } finally { setBusy(false); }
  };

  const handleVideo = async e => {
    const file = e.target.files[0]; if (!file) return;
    setBusy(true); setStatus('Analysing Reel (Vision + OCR)…');
    const fd = new FormData(); fd.append('video', file);
    try {
      const r = await fetch('http://localhost:8000/video-ocr-to-sign', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.animation_sequence?.length) await playSeq(d.animation_sequence);
      else setStatus('No data found in reel.');
    } catch { setStatus('Analysis failed.'); } finally { setBusy(false); if (vidRef.current) vidRef.current.value = ''; }
  };

  const handleAudio = async e => {
    const file = e.target.files[0]; if (!file) return;
    setBusy(true); setStatus('Transcribing Audio…');
    const fd = new FormData(); fd.append('audio', file);
    try {
      const r = await fetch('http://localhost:8000/transcribe-and-sign', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.animation_sequence?.length) await playSeq(d.animation_sequence);
    } catch { setStatus('Audio failed.'); } finally { setBusy(false); if (audioRef.current) audioRef.current.value = ''; }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 85, color: 'var(--text)' }}>
      <div className="container-fluid px-lg-5">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="glass p-4 d-flex flex-column fade-in" style={{ minHeight: '84vh' }}>
              <h3 className="gradient-text mb-4" style={{ fontWeight: 700 }}>ISL Studio</h3>
              <div className="tab-bar mb-4">
                {['text', 'voice', 'video'].map(t => (
                  <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
                ))}
              </div>

              {tab === 'text' && (
                <div className="flex-grow-1 d-flex flex-column gap-3">
                  <textarea ref={textRef} className="input-dark flex-grow-1" rows={6} placeholder="Type English or Hindi text…" />
                  <button className="btn-primary-glow" onClick={handleTranslate} disabled={isBusy}>{isBusy ? 'Processing…' : 'Generate ISL ✨'}</button>
                </div>
              )}

              {tab === 'voice' && (
                <div className="text-center flex-grow-1 d-flex flex-column align-items-center">
                  <div className={`mic-circle ${listening ? 'active' : ''}`} onClick={() => listening ? SpeechRecognition.stopListening() : SpeechRecognition.startListening({ continuous: true })}>🎙️</div>
                  <div className="input-dark text-start w-100 flex-grow-1 mb-4" style={{ minHeight: 140, overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Transcript</div>
                    <div>{transcript || 'Waiting…'}</div>
                  </div>
                  <button className="btn-primary-glow" onClick={handleTranslate} disabled={isBusy || !transcript}>Translate Voice ✨</button>
                </div>
              )}

              {tab === 'video' && (
                <div className="flex-grow-1 d-flex flex-column gap-4">
                  <div className="drop-zone flex-grow-1 d-flex flex-column align-items-center justify-content-center" onClick={() => vidRef.current?.click()}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎬</div>
                    <h5>Drop Reel Here</h5>
                    <p style={{ opacity: 0.6 }}>MP4 / MOV · OCR + Audio</p>
                  </div>
                  <input ref={vidRef} type="file" accept="video/*" className="d-none" onChange={handleVideo} />
                  <input ref={audioRef} type="file" accept="audio/*" className="d-none" onChange={handleAudio} />
                  <button className="btn-ghost" onClick={() => audioRef.current?.click()}>Or Upload Audio Only 🎙️</button>
                </div>
              )}

              <div className="mt-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Speed: {speed.toFixed(2)}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pause: {pause}ms</span>
                </div>
                <input type="range" min="0.05" max="0.5" step="0.01" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="form-range mb-2" />
                <input type="range" min="0" max="2000" step="100" value={pause} onChange={e => setPause(parseInt(e.target.value))} className="form-range" />
              </div>

              <div className="status-row mt-4">
                <div className={`status-dot ${isBusy ? 'busy' : 'ready'}`} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{statusMsg || 'System Standing By'}</span>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="glass overflow-hidden fade-in-2 scanline-effect" style={{ minHeight: '84vh', position: 'relative', background: '#04060f' }}>
              <BackgroundFX />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', gap: 10, alignItems: 'center', zIndex: 10, background: 'linear-gradient(to bottom, rgba(4,6,15,0.9) 0%, transparent 100%)' }}>
                <span className="tech-badge">Digital Twin Engine v4.0</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Kalidokit · VRM · Canvas · Vision AI</span>
              </div>

              {/* Duplicate canvases for the blur layer - now works perfectly with the new stick drawing */}
              <canvas id="sk_canvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, filter: 'blur(12px)', opacity: 0.4 }} />
              <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                <canvas id="sk_canvas_fg" style={{ width: '100%', height: '100%' }} />
              </div>

              <div style={{ position: 'absolute', bottom: 90, left: 20, right: 20, zIndex: 11 }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                  <div id="ap_bar" style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg,#635bff,#22d3a5)', transition: 'width 0.12s ease-out', boxShadow: '0 0 8px rgba(99,91,255,0.6)' }} />
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 11, padding: '16px 24px', background: 'rgba(4,6,15,0.9)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>ISL Gloss Stream</div>
                <div className={`gloss-tape ${text ? '' : 'shimmer-text'}`}>{text || '> AWAITING SEQUENCE DATA'}</div>
              </div>

              <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.001, pointerEvents: 'none' }}>
                <Canvas camera={{ position: [0, 0.9, 2.8], fov: 45 }}>
                  <ambientLight intensity={1} />
                  <Suspense fallback={null}><VRMAvatarScene animRef={animRef} /></Suspense>
                </Canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}