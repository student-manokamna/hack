import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import xbotPic from '../Models/xbot/xbot.png';

const FEATURES = [
  { icon: '🎙️', title: 'Whisper ASR',     desc: 'State-of-the-art local speech-to-text with 99% accuracy.', details: 'Powered by OpenAI Whisper model. Converts Hinglish speech to English text in near real-time after separating audio tracks using Demucs.' },
  { icon: '👁️', title: 'Context Fusion',   desc: 'Advanced OCR & Scene Analysis.', details: 'Combines text extracted via EasyOCR from on-screen elements, scene context analyzed by CLIP, and emotion bounds tracked by MediaPipe.' },
  { icon: '🧠', title: 'LLM Engine',  desc: 'GPT-4o powered sequence generation.', details: 'Aggregates multi-modal context to generate an ISL Gloss sequence, strictly constrained by a Dictionary Manifest of available sign motions.' },
  { icon: '🤖', title: 'Visualizer',     desc: 'Dynamic rendering of JSON motion sequences.', details: 'Using Canvas & Three.js to render motion sequences parsed from Mixamo/MakeHuman rigged actions. Includes audio-visual composition.' },
];

export default function Home() {
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 72 }}>

      {/* ── Feature Modal ────────────────────────────────────────────── */}
      {selectedFeature && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }} onClick={() => setSelectedFeature(null)}>
          <div className="glass p-5 fade-in" style={{ width: '100%', maxWidth: 500, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.5rem' }} onClick={() => setSelectedFeature(null)}>✕</button>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>{selectedFeature.icon}</div>
            <h3 style={{ fontWeight: 800 }}>{selectedFeature.title}</h3>
            <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 16 }}>{selectedFeature.desc}</p>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{selectedFeature.details}</p>
          </div>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="container d-flex flex-lg-row flex-column align-items-center gap-5 py-5" style={{ minHeight: '90vh' }}>

        {/* Left Copy */}
        <div style={{ flex: 1 }}>
          <div className="tech-badge fade-in mb-4">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3a5', display: 'inline-block' }} />
            Hackathon Edition&nbsp;·&nbsp;2026
          </div>

          <h1 className="fade-in-2" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.04em' }}>
            <span style={{ color: '#e8eaf6' }}>CODE</span><br />
            <span className="gradient-text">CRAFTERS</span><br />
            <span style={{ color: '#e8eaf6' }}>STUDIO.</span>
          </h1>

          <p className="fade-in-3 mt-4" style={{ fontSize: '1.15rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 480 }}>
            The ultimate AI accessibility engine. Seamlessly translate speech, text, and video reels into Indian Sign Language (ISL) using cutting-edge deep learning models.
          </p>

          <div className="d-flex gap-3 mt-5 fade-in-3">
            <Link to="/codecrafters/convert" className="btn-primary-glow" style={{ width: 'auto', padding: '16px 40px', fontSize: '1.05rem', borderRadius: 100 }}>
              Launch Studio 🚀
            </Link>
            <Link to="/codecrafters/learn-sign" className="btn-ghost" style={{ width: 'auto', padding: '16px 32px', fontSize: '1rem', borderRadius: 100 }}>
              Explore Signs
            </Link>
          </div>

          <div className="d-flex gap-5 mt-5 fade-in-3">
            {[{ n: '99%', l: 'Accuracy' }, { n: '<0.5s', l: 'Latency' }, { n: '500+', l: 'Signs' }].map(({ n, l }) => (
              <div key={l}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{n}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right – 3D card mock */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', animation: 'float 7s ease-in-out infinite' }}>
          <div className="glass" style={{ width: '100%', maxWidth: 460, padding: 8, borderRadius: 28, position: 'relative' }}>
            <div style={{ borderRadius: 22, background: '#090d1f', overflow: 'hidden', height: 400, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(99,91,255,0.2) 0%, transparent 70%)' }} />
              
              {/* Avatar Image */}
              <img src={xbotPic} alt="Digital Twin" style={{ width: '85%', objectFit: 'contain', zIndex: 2, filter: 'drop-shadow(0 0 20px rgba(34,211,165,0.4))' }} />

              {/* Scanning laser effect */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--green)', boxShadow: '0 0 15px 5px rgba(34,211,165,0.4)', animation: 'scanline 3s linear infinite', zIndex: 3 }} />

              <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', zIndex: 4 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 20, letterSpacing: '0.1em' }}>DIGITAL TWIN ENGINE v3.1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ────────────────────────────────────────────── */}
      <section className="container py-5">
        <div className="row g-3">
          {FEATURES.map((feature) => (
            <div className="col-md-6 col-lg-3" key={feature.title}>
              <div className="glass p-4 h-100 fade-in" style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(99,91,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
                onClick={() => setSelectedFeature(feature)}
              >
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{feature.icon}</div>
                <h5 style={{ fontWeight: 700 }}>{feature.title}</h5>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
                <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>View Logic &rarr;</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Vision Section ─────────────────────────────────────────── */}
      <section className="container py-5 mt-5">
        <div className="glass p-5 fade-in">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <span className="tech-badge mb-3">Our Vision</span>
              <h2 style={{ fontWeight: 800, fontSize: '2.5rem', marginBottom: 24 }}>Breaking Barriers with <span className="gradient-text">CodeCrafters</span></h2>
              <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.8 }}>
                We believe accessibility is a fundamental human right. Our mission is to bridge the communication gap between the hearing and the hearing-impaired communities globally. By leveraging generative AI and 3D rendering, we provide a seamless, real-time bridge for natural communication.
              </p>
            </div>
            <div className="col-lg-6 text-center">
              <div style={{ fontSize: '5rem', opacity: 0.5, animation: 'float 5s ease-in-out infinite' }}>🌍</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Technical Section ──────────────────────────────────────── */}
      <section className="container py-5 mb-5">
        <h2 className="text-center mb-5" style={{ fontWeight: 800 }}>System <span className="gradient-text">Architecture</span></h2>
        
        <div className="glass p-5 position-relative overflow-hidden mb-5">
           <div className="tech-grid" style={{ position: 'absolute', inset: 0, opacity: 0.1, zIndex: 0 }} />
           <div className="row position-relative" style={{ zIndex: 1 }}>
              <div className="col-md-4 mb-4">
                 <div style={{ padding: 24, border: '1px solid var(--border)', borderRadius: 20, background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>📥</div>
                    <h5 style={{ fontWeight: 700 }}>1. Data Ingestion</h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Video Reels are parsed. Audio tracks are separated using Demucs, on-screen text via EasyOCR, and visual context via CLIP and MediaPipe.</p>
                 </div>
              </div>
              <div className="col-md-4 mb-4">
                 <div style={{ padding: 24, border: '1px solid var(--border)', borderRadius: 20, background: 'rgba(0,0,0,0.3)' }}>
                     <div style={{ fontSize: '2rem', marginBottom: 10 }}>⚙️</div>
                     <h5 style={{ fontWeight: 700 }}>2. Context Fusion & LLM</h5>
                     <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Whisper AI converts speech. The fused context is passed to the GPT-4o LLM Engine to generate an ISL Gloss sequence mapped to the Dictionary Manifest.</p>
                 </div>
              </div>
              <div className="col-md-4 mb-4">
                 <div style={{ padding: 24, border: '1px solid var(--border)', borderRadius: 20, background: 'rgba(0,0,0,0.3)' }}>
                     <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎭</div>
                     <h5 style={{ fontWeight: 700 }}>3. Dynamic Rendering</h5>
                     <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>The sequence is fed into the Three.js visualizer which plays the pre-rigged Mixamo motion JSON files for precise real-time ISL demonstration.</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

    </div>
  );
}
