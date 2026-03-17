import '../App.css';
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pose as KalidokitPose, Hand as KalidokitHand, Face as KalidokitFace } from 'kalidokit';
import * as words from '../Animations/words';
import { defaultPose } from '../Animations/defaultPose';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// ─── Background FX (Technical Grid + Glowing Orbs) ───────────────────────────
function BackgroundFX() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
      <div className="tech-grid" style={{ position:'absolute', inset:0, opacity:0.15 }} />
      <div className="glowing-orb" style={{ top:'10%', left:'15%', width:'300px', height:'300px', background:'var(--glow)' }} />
      <div className="glowing-orb" style={{ bottom:'15%', right:'10%', width:'400px', height:'400px', background:'var(--accent)', animationDelay:'-5s' }} />
      <div className="glowing-orb" style={{ top:'40%', right:'20%', width:'250px', height:'250px', background:'var(--green-glow)', animationDelay:'-10s' }} />
    </div>
  );
}

// ─── Visualizer Engine (Handles 2D Canvas Drawing with Auto-Scaling) ───────
function Visualizer({ animRef }) {
  const requestRef = useRef();
  
  const draw = useCallback(() => {
    const ref = animRef.current;
    if (ref.jsonFrames && ref.currentFrame < ref.jsonFrames.length) {
      const now = performance.now();
      const dur = (1000 / (ref.fps || 25)) * (0.1 / Math.max(ref.speed || 0.1, 0.01));
      
      if (now - (ref.lastFrameTime || 0) >= dur) {
        const fd = ref.jsonFrames[ref.currentFrame];
        const cnvBg = document.getElementById('sk_canvas');
        const cnvFg = document.getElementById('sk_canvas_fg');

        if (cnvFg && cnvBg) {
          // Sync sizes
          [cnvBg, cnvFg].forEach(c => {
            if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
              c.width = c.clientWidth;
              c.height = c.clientHeight;
            }
          });

          const ctxBg = cnvBg.getContext('2d');
          const ctxFg = cnvFg.getContext('2d');
          const W = cnvFg.width, H = cnvFg.height;

          ctxBg.clearRect(0, 0, W, H);
          ctxFg.clearRect(0, 0, W, H);

          const P = Array(33).fill(null);
          (fd.pose || []).forEach(lm => { if ((lm.visibility||1) > 0.1) P[lm.id] = lm; });

          // ── Auto-Scaling Logic (Stable Global Bounds) ──
          if (ref.globalBounds) {
            const { dataW, dataH, centerX, centerY } = ref.globalBounds;

            // Scale down to 75% for better full-body visibility and add slight downward offset
            const scale = Math.min(W / dataW, H / dataH) * 0.75;
            const yOffset = H * 0.05;
            
            // Transformation helper
            const pt = (lm) => {
              if (!lm) return null;
              return {
                x: W/2 + (lm.x - centerX) * scale,
                y: H/2 + (lm.y - centerY) * scale + yOffset
              };
            };

            const seg = (a, b, c='#635bff', w=14, context=ctxFg) => {
              const pa=pt(a), pb=pt(b); if(!pa||!pb) return;
              context.strokeStyle = c; context.lineWidth = w; context.lineCap = 'round';
              context.beginPath(); context.moveTo(pa.x,pa.y); context.lineTo(pb.x,pb.y); context.stroke();
            };
            const dot = (lm, r=9, c='#fff', context=ctxFg) => {
              const p=pt(lm); if(!p) return;
              context.fillStyle = c; context.beginPath(); context.arc(p.x,p.y,r,0,Math.PI*2); context.fill();
            };

            const drawFullSkeleton = (context, alpha=1.0) => {
              context.save();
              context.globalAlpha = alpha;
              
              // Body
              seg(P[11],P[12], '#818cf8', 18, context); // shoulders (thicker)
              seg(P[11],P[23], '#6366f1', 12, context);
              seg(P[12],P[24], '#6366f1', 12, context);
              seg(P[23],P[24], '#6366f1', 18, context); // hips
              seg(P[11],P[13], '#22d3a5', 16, context); seg(P[13],P[15], '#34d399', 14, context);
              seg(P[12],P[14], '#22d3a5', 16, context); seg(P[14],P[16], '#34d399', 14, context);
              seg(P[23],P[25], '#a78bfa', 13, context); seg(P[25],P[27], '#8b5cf6', 11, context);
              seg(P[24],P[26], '#a78bfa', 13, context); seg(P[26],P[28], '#8b5cf6', 11, context);

              [11,12,13,14,15,16,23,24,25,26,27,28].forEach(i => dot(P[i],7,'rgba(255,255,255,0.9)', context));
              dot(P[15],12,'#22d3a5', context); dot(P[16],12,'#22d3a5', context);

              // Head
              if (P[0]) {
                const hp = pt(P[0]);
                const hr = scale * 0.14; // Relative head size (Slightly larger)
                context.strokeStyle = '#fbbf24'; context.lineWidth = 14; context.fillStyle = 'rgba(251,191,36,0.35)';
                context.beginPath(); context.arc(hp.x, hp.y - hr*0.4, hr, 0, Math.PI*2);
                context.fill(); context.stroke();
              }

              // Hands
              const drawHand = (hand, col) => {
                if (!hand || hand.length < 5) return;
                const lms = Array(21).fill(null);
                hand.forEach(p => { if(p) lms[p.id??0] = p; });
                [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
                 [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
                 [0,17],[17,18],[18,19],[19,20]].forEach(([a,b]) => seg(lms[a],lms[b],col,6, context));
                lms.forEach(p => dot(p,5,'#fff', context));
              };
              drawHand(fd.left_hand,'#f64f8b');
              drawHand(fd.right_hand,'#60a5fa');
              context.restore();
            };

            // Draw to both canvases (background blurred via CSS)
            drawFullSkeleton(ctxBg, 0.8);
            drawFullSkeleton(ctxFg, 1.0);
          }
        }

        ref.currentFrame++;
        ref.lastFrameTime = now;
        const pb = document.getElementById('ap_bar');
        if (pb) pb.style.width = `${Math.round(ref.currentFrame/ref.jsonFrames.length*100)}%`;

        if (ref.currentFrame >= ref.jsonFrames.length) {
          ref.jsonFrames = null;
          if (ref.onJsonFinish) { const cb=ref.onJsonFinish; ref.onJsonFinish=null; cb(); }
        }
      }
    }
    // ── Classic hardcoded animations ──
    if (!ref.jsonFrames && ref.animations?.length > 0) {
      const anim = ref.animations[0];
      if (anim.length) {
        if (!ref.flag) {
          if (anim[0] === 'add-text') { ref.setTextCb?.(prev => prev + anim[1]); ref.animations.shift(); }
          else {
            for (let i=0; i<anim.length;) {
              const [bn,ac,ax,lim,sign] = anim[i];
              const bone = ref.avatar?.getObjectByName?.(bn);
              if (!bone) { i++; continue; }
              if (sign==='+' && bone[ac][ax] < lim) { bone[ac][ax] = Math.min(bone[ac][ax]+(ref.speed||0.1),lim); i++; }
              else if (sign==='-' && bone[ac][ax] > lim) { bone[ac][ax] = Math.max(bone[ac][ax]-(ref.speed||0.1),lim); i++; }
              else anim.splice(i,1);
            }
          }
        }
      } else {
        ref.flag = true;
        setTimeout(()=>{ ref.flag=false; }, ref.pause||800);
        ref.animations.shift();
      }
    }

    requestRef.current = requestAnimationFrame(draw);
  }, [animRef]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(requestRef.current);
  }, [draw]);

  return null;
}

// ─── Kalidokit-powered VRM renderer ─────────────────────────────────────────
function VRMScene({ animRef }) {
  const vrmRef = useRef(null);
  const clock  = useRef(new THREE.Clock());

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register(p => new VRMLoaderPlugin(p));
    loader.load('/AvatarSample_B.vrm', gltf => {
      const vrm = gltf.userData.vrm;
      vrm.scene.rotation.y = 0;
      vrmRef.current          = vrm;
      animRef.current.vrm     = vrm;
      animRef.current.avatar  = vrm;
      vrm.scene.traverse(o => { o.frustumCulled = false; });
    }, undefined, err => console.error('VRM:', err));
  }, [animRef]);

  useFrame(() => {
    if (vrmRef.current) vrmRef.current.update(clock.current.getDelta());
  });

  return vrmRef.current ? <primitive object={vrmRef.current.scene} /> : null;
}

// ─── Main Studio ─────────────────────────────────────────────────────────────
export default function Convert() {
  const [text,         setText]         = useState('');
  const [statusMsg,    setStatus ]      = useState('');
  const [isBusy,       setBusy  ]       = useState(false);
  const [tab,          setTab   ]       = useState('text');   // text | voice | video

  const animRef = useRef({
    flag:false, animations:[], jsonFrames:null, currentFrame:0,
    fps:25, lastFrameTime:0, speed:0.1, pause:800, vrm:null, avatar:null,
  });
  const textRef  = useRef(null);
  const vidRef   = useRef(null);
  const { transcript, listening } = useSpeechRecognition();

  useEffect(() => { animRef.current.setTextCb = setText; }, []);

  // ── playback helpers ─────────────────────────────────────────────────────
  const playJSON = useCallback(url => new Promise(async resolve => {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      const d = await r.json();
      const ref = animRef.current;
      defaultPose(ref);
      ref.currentFrame = 0; ref.jsonFrames = d.frames;
      ref.fps = d.metadata?.fps || 25;

      // ── Pre-calculate global bounds for stable auto-scaling ──
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      let hasPts = false;
      d.frames.forEach(f => {
        (f.pose || []).forEach(p => {
          if ((p.visibility || 1) > 0.1) {
            hasPts = true;
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
          }
        });
      });
      if (hasPts) {
        ref.globalBounds = {
          dataW: maxX - minX || 0.1,
          dataH: maxY - minY || 0.1,
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2
        };
      } else {
        ref.globalBounds = null;
      }

      ref.onJsonFinish = resolve;
      ref.lastFrameTime = performance.now();
      const pb = document.getElementById('ap_bar');
      if (pb) pb.style.width = '0%';
    } catch { resolve(); }
  }), []);

  const playSeq = useCallback(async seq => {
    setBusy(true); setText('');
    for (const s of seq) {
      setStatus(`Signing: ${s.word}`);
      setText(p => p + (s.type==='sign' ? ` [${s.word.toUpperCase()}]` : s.word.toUpperCase()));
      await playJSON(s.file);
      await new Promise(r => setTimeout(r, s.type==='sign' ? 300 : 80));
    }
    setStatus('Sequence complete ✓'); setBusy(false);
  }, [playJSON]);

  // ── AI text-to-sign ───────────────────────────────────────────────────────
  const handleTranslate = async () => {
    const inp = tab==='text' ? textRef.current?.value : transcript;
    if (!inp?.trim()) return;
    setBusy(true); setStatus('Sending to Gemini AI…');
    try {
      const r = await fetch('http://localhost:8000/text-to-sign', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text: inp }),
      });
      const d = await r.json();
      if (d.animation_sequence?.length) await playSeq(d.animation_sequence);
      else setStatus('No matching animations found.');
    } catch { setStatus('AI service offline — check backend.'); } finally { setBusy(false); }
  };

  // ── Video / reel upload ───────────────────────────────────────────────────
  const handleVideo = async e => {
    const file = e.target.files[0]; if(!file) return;
    setBusy(true); setStatus('Analysing reel (Whisper + Gemini Vision)…');
    const fd = new FormData(); fd.append('video', file);
    try {
      const r = await fetch('http://localhost:8000/video-ocr-to-sign', { method:'POST', body:fd });
      const d = await r.json();
      if (d.animation_sequence?.length) await playSeq(d.animation_sequence);
      else setStatus('No animations found for this reel.');
    } catch { setStatus('Video analysis failed.'); } finally { setBusy(false); if(vidRef.current) vidRef.current.value=''; }
  };

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', paddingTop:85, color:'var(--text)' }}>
      <div className="container-fluid px-lg-5">
        <div className="row g-4">

          {/* ──── Left Panel ──────────────────────────────────────────────── */}
          <div className="col-lg-4">
            <div className="glass p-4 d-flex flex-column fade-in" style={{ minHeight:'84vh' }}>

              <h3 className="gradient-text mb-4" style={{ fontWeight:700, letterSpacing:'-0.02em' }}>
                CodeCrafters Studio
              </h3>

              {/* Tab Bar */}
              <div className="tab-bar mb-4">
                {['text','voice','video'].map(t => (
                  <button key={t} className={`tab-item ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
                    {t==='text'?'📝':t==='voice'?'🎙️':'🎥'} {t}
                  </button>
                ))}
              </div>

              {/* ── Text Tab ────────────────────────────────────────────── */}
              {tab==='text' && (
                <div className="flex-grow-1 d-flex flex-column gap-3">
                  <textarea
                    ref={textRef}
                    className="input-dark flex-grow-1"
                    rows={6}
                    placeholder="Type English or Hindi text to translate into ISL…"
                  />
                  <button className="btn-primary-glow" onClick={handleTranslate} disabled={isBusy}>
                    {isBusy ? '⏳ Processing…' : 'Generate Sign Sequence ✨'}
                  </button>
                </div>
              )}

              {/* ── Voice Tab ───────────────────────────────────────────── */}
              {tab==='voice' && (
                <div className="text-center flex-grow-1 d-flex flex-column align-items-center">
                  <div
                    className={`mic-circle ${listening?'active':''}`}
                    onClick={() => listening ? SpeechRecognition.stopListening() : SpeechRecognition.startListening({continuous:true})}
                    style={{ cursor:'pointer' }}
                  >
                    🎙️
                  </div>
                  <div style={{ color:'var(--muted)', fontSize:'0.85rem', marginBottom:16 }}>
                    {listening ? 'Recording… click to stop' : 'Click mic to start'}
                  </div>
                  <div className="input-dark text-start w-100 flex-grow-1 mb-4" style={{ minHeight:140, overflowY:'auto', cursor:'default' }}>
                    <div style={{ color:'var(--muted)', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Live Transcript</div>
                    <div style={{ fontSize:'0.95rem' }}>{transcript || 'Waiting for speech input…'}</div>
                  </div>
                  <button className="btn-primary-glow" onClick={handleTranslate} disabled={isBusy||!transcript}>
                    Translate Voice ✨
                  </button>
                </div>
              )}

              {/* ── Video Tab ───────────────────────────────────────────── */}
              {tab==='video' && (
                <div className="flex-grow-1 d-flex flex-column gap-4">
                  <div className="drop-zone flex-grow-1 d-flex flex-column align-items-center justify-content-center" onClick={()=>vidRef.current?.click()}>
                    <div style={{ fontSize:'3rem', marginBottom:12 }}>🎬</div>
                    <h5 style={{ fontWeight:700 }}>Drop your reel here</h5>
                    <p style={{ color:'var(--muted)', fontSize:'0.88rem', margin:0 }}>MP4 / MOV · OCR + Audio extraction</p>
                  </div>
                  <input ref={vidRef} type="file" accept="video/*" className="d-none" onChange={handleVideo} />
                  <div style={{ color:'var(--muted)', fontSize:'0.8rem', textAlign:'center' }}>Powered by Gemini Pro Vision + Whisper</div>
                </div>
              )}

              {/* Status */}
              <div className="status-row mt-4">
                <div className={`status-dot ${isBusy?'busy':'ready'}`} />
                <span style={{ fontSize:'0.85rem', fontWeight:600 }}>{statusMsg||'Ready'}</span>
              </div>
            </div>
          </div>

          {/* ──── Right Panel – Visualizer ────────────────────────────────── */}
          <div className="col-lg-8">
            <div className="glass overflow-hidden fade-in-2 scanline-effect" style={{ minHeight:'84vh', position:'relative', background:'#04060f' }}>
              
              <BackgroundFX />

              {/* Header overlay */}
              <div style={{ position:'absolute', top:0, left:0, right:0, padding:'16px 20px', display:'flex', gap:10, alignItems:'center', zIndex:10, background:'linear-gradient(to bottom, rgba(4,6,15,0.9) 0%, transparent 100%)' }}>
                <span className="tech-badge">
                  <span style={{ width:7,height:7,borderRadius:'50%',background:'#22d3a5',display:'inline-block' }} />
                  Digital Twin Engine v4.0 (Hackathon Edition)
                </span>
                <span style={{ color:'var(--muted)', fontSize:'0.78rem' }}>Kalidokit · Canvas · Logic Engine</span>
              </div>

              {/* Background Skeleton Canvas (Soft Glow) */}
              <canvas id="sk_canvas" style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:1, filter:'blur(12px)', opacity:0.4 }} />

              {/* Foreground Skeleton Canvas (Primary View) */}
              <div style={{ position:'absolute', inset:0, zIndex:2 }}>
                <canvas id="sk_canvas_fg" style={{ width:'100%', height:'100%' }} />
              </div>

              {/* Visualizer Logic */}
              <div style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none' }}>
                <Visualizer animRef={animRef} />
              </div>

              {/* Progress bar */}
              <div style={{ position:'absolute', bottom:90, left:20, right:20, zIndex:11 }}>
                <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
                  <div id="ap_bar" style={{ height:'100%', width:'0%', background:'linear-gradient(90deg,#635bff,#22d3a5)', transition:'width 0.12s ease-out', boxShadow:'0 0 8px rgba(99,91,255,0.6)' }} />
                </div>
              </div>

              {/* Gloss Tape */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:11, padding:'16px 24px', background:'rgba(4,6,15,0.9)', backdropFilter:'blur(12px)', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize:'0.68rem', color:'var(--muted)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>ISL Gloss Stream</div>
                <div className={`gloss-tape ${text?'':'shimmer-text'}`}>
                  {text || '> AWAITING SEQUENCE DATA'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}