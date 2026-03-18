import '../App.css'
import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

import xbot from '../Models/xbot/xbot.glb';
import ybot from '../Models/ybot/ybot.glb';
import xbotPic from '../Models/xbot/xbot.png';
import ybotPic from '../Models/ybot/ybot.png';

import * as words from '../Animations/words';
import * as alphabets from '../Animations/alphabets';
import { defaultPose } from '../Animations/defaultPose';

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function LearnSign() {
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);
  const [inputText, setInputText] = useState("");
  const [currentSign, setCurrentSign] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState([]);

  const componentRef = useRef({});
  const { current: ref } = componentRef;

  useEffect(() => {

    ref.flag = false;
    ref.pending = false;

    ref.animations = [];
    ref.characters = [];

    ref.scene = new THREE.Scene();
    ref.scene.background = new THREE.Color(0xdddddd);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    hemiLight.position.set(0, 20, 0);
    ref.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 20, 10);
    ref.scene.add(dirLight);

    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 5, 5);
    ref.scene.add(spotLight);

    ref.camera = new THREE.PerspectiveCamera(
        30,
        window.innerWidth*0.57 / (window.innerHeight - 70),
        0.1,
        1000
    )

    ref.renderer = new THREE.WebGLRenderer({ antialias: true });
    ref.renderer.setSize(window.innerWidth * 0.57, (window.innerHeight - 70));
    document.getElementById("canvas").innerHTML = "";
    document.getElementById("canvas").appendChild(ref.renderer.domElement);

    ref.camera.position.z = 1.6;
    ref.camera.position.y = 1.4;

    let loader = new GLTFLoader();
    loader.load(
      bot,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if ( child.type === 'SkinnedMesh' ) {
            child.frustumCulled = false;
          }
    });
        ref.avatar = gltf.scene;
        ref.scene.add(ref.avatar);
        defaultPose(ref);
      },
      (xhr) => {
        console.log(xhr);
      }
    );

  }, [ref, bot]);

  ref.animate = () => {
    if(ref.animations.length === 0){
        ref.pending = false;
        setIsPlaying(false);
        setCurrentSign("");
      return ;
    }
    requestAnimationFrame(ref.animate);

    if (ref.animations[0] && !Array.isArray(ref.animations[0]) && ref.animations[0].type === 'setSign') {
        setCurrentSign(ref.animations[0].sign);
        ref.animations.shift();
        if(ref.animations.length === 0) {
            ref.pending = false;
            setIsPlaying(false);
            setCurrentSign("");
            return;
        }
    }

    if(ref.animations[0].length){
        if(!ref.flag) {
          for(let i=0;i<ref.animations[0].length;){
            let [boneName, action, axis, limit, sign] = ref.animations[0][i]
            if(sign === "+" && ref.avatar.getObjectByName(boneName)[action][axis] < limit){
                ref.avatar.getObjectByName(boneName)[action][axis] += speed;
                ref.avatar.getObjectByName(boneName)[action][axis] = Math.min(ref.avatar.getObjectByName(boneName)[action][axis], limit);
                i++;
            }
            else if(sign === "-" && ref.avatar.getObjectByName(boneName)[action][axis] > limit){
                ref.avatar.getObjectByName(boneName)[action][axis] -= speed;
                ref.avatar.getObjectByName(boneName)[action][axis] = Math.max(ref.avatar.getObjectByName(boneName)[action][axis], limit);
                i++;
            }
            else{
                ref.animations[0].splice(i, 1);
            }
          }
        }
    }
    else {
      ref.flag = true;
      setTimeout(() => {
        ref.flag = false
      }, pause);
      ref.animations.shift();
    }
    ref.renderer.render(ref.scene, ref.camera);
  }

  const addToHistory = (item) => {
    setHistory(prev => {
      const newHistory = [item, ...prev.filter(x => x !== item)].slice(0, 10);
      return newHistory;
    });
  };

  const playCustomWord = (wordOverride) => {
    const wordBase = typeof wordOverride === 'string' ? wordOverride : inputText;
    if(ref.animations.length === 0 && wordBase.trim() !== "") {
      const chars = wordBase.toUpperCase().replace(/[^A-Z]/g, '').split('');
      setIsPlaying(true);
      addToHistory(wordBase.toUpperCase());
      chars.forEach(c => {
        ref.animations.push({ type: 'setSign', sign: c });
        if(alphabets[c]) alphabets[c](ref);
      });
    }
  };

  const playAlphabet = (char) => {
    if(ref.animations.length === 0){
      setIsPlaying(true);
      addToHistory(char);
      ref.animations.push({ type: 'setSign', sign: char });
      alphabets[char](ref);
    }
  };

  const playWord = (word) => {
    if(ref.animations.length === 0){
      setIsPlaying(true);
      addToHistory(word);
      ref.animations.push({ type: 'setSign', sign: word });
      words[word](ref);
    }
  };

  let alphaButtons = [];
  for (let i = 0; i < 26; i++) {
    let char = String.fromCharCode(i + 65);
    alphaButtons.push(
        <div className='col-md-3' key={char}>
            <button className='signs w-100' onClick={() => playAlphabet(char)}>
                {char}
            </button>
        </div>
    );
  }

  let wordButtons = [];
  for (let i = 0; i < words.wordList.length; i++) {
    let word = words.wordList[i];
    wordButtons.push(
        <div className='col-md-4' key={word}>
            <button className='signs w-100' onClick={() => playWord(word)}>
                {word}
            </button>
        </div>
    );
  }

  return (
    <div className='container-fluid py-4' style={{ minHeight: '100vh', paddingTop: '85px !important' }}>
      <div className='row g-4' style={{ marginTop: '40px' }}>
        {/* Left Side: Controls */}
        <div className='col-md-3'>
          <div className="glass p-4 h-100 d-flex flex-column" style={{ maxHeight: '80vh' }}>
            <h2 className='gradient-text mb-4 flex-shrink-0' style={{ fontWeight: 800, fontSize: '1.5rem' }}>
              Library
            </h2>
            <div className="overflow-auto pe-2" style={{ flexGrow: 1 }}>
              {history.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.6 }}>Recent History</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {history.map((item, idx) => (
                      <span 
                        key={idx} 
                        className="badge" 
                        style={{ cursor: 'pointer', padding: '8px 12px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '12px', fontSize: '0.8rem', color: 'white' }}
                        onClick={() => {
                           if(item.length === 1) playAlphabet(item);
                           else if(words.wordList.includes(item)) playWord(item);
                           else playCustomWord(item);
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h6 className="text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.6 }}>Custom Word</h6>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="input-dark focus-glow" 
                    placeholder="Enter word..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && playCustomWord()}
                    style={{ 
                      padding: '10px 15px',
                      borderRadius: '12px',
                      flexGrow: 1
                    }}
                  />
                  <button className="btn btn-primary-glow" onClick={() => playCustomWord()} style={{ borderRadius: '12px', padding: '0 20px', width: 'auto' }}>
                    Play
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.6 }}>Alphabets</h6>
                <div className='row g-2'>
                  {alphaButtons}
                </div>
              </div>

              <div>
                <h6 className="text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.6 }}>Words</h6>
                <div className='row g-2'>
                  {wordButtons}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Viewer */}
        <div className='col-md-7'>
          <div className="glass p-0 overflow-hidden" style={{ position: 'relative', height: 'calc(100vh - 120px)' }}>
            <div id='canvas' style={{ width: '100%', height: '100%' }} />
            
            <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: '10px', alignItems: 'center' }}>
               <span className="tech-badge">CODECRAFTERS LEARNING ENGINE</span>
               <div className="status-row" style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.4)' }}>
                 <div className={`status-dot ${isPlaying ? 'busy' : 'ready'}`}></div>
                 <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', color: 'white' }}>
                   {isPlaying ? `SIGNING${currentSign.length === 1 ? `: ${currentSign}` : ''}` : 'READY'}
                 </span>
               </div>
            </div>

            {currentSign && isPlaying && currentSign.length === 1 && (
              <div style={{ 
                position: 'absolute', 
                bottom: 20, 
                right: 30, 
                fontSize: '8rem', 
                fontWeight: 800, 
                color: 'var(--primary)',
                lineHeight: 1,
                textShadow: '0 0 40px rgba(99, 102, 241, 0.6), 0 0 80px rgba(99, 102, 241, 0.3)',
                animation: 'pulseScale 1s infinite alternate'
              }}>
                {currentSign}
              </div>
            )}
            <style>
              {`
                @keyframes pulseScale {
                  from { transform: scale(1); opacity: 0.8; }
                  to { transform: scale(1.05); opacity: 1; }
                }
                .focus-glow:focus {
                  box-shadow: 0 0 15px rgba(99, 102, 241, 0.5) !important;
                }
              `}
            </style>
          </div>
        </div>

        {/* Right Side: Configuration */}
        <div className='col-md-2'>
          <div className="glass p-4 h-100" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <h5 className='mb-4' style={{ fontWeight: 700 }}>Settings</h5>

            <p className='label-style mb-2' style={{ opacity: 0.7 }}>Select Avatar</p>
            <div className="d-flex flex-column gap-3 mb-4">
              <div className={`bot-image-container ${bot === xbot ? 'active' : ''}`} onClick={() => setBot(xbot)} style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: bot === xbot ? '2px solid var(--primary)' : '2px solid transparent' }}>
                <img src={xbotPic} className='w-100' alt='XBOT' />
              </div>
              <div className={`bot-image-container ${bot === ybot ? 'active' : ''}`} onClick={() => setBot(ybot)} style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: bot === ybot ? '2px solid var(--primary)' : '2px solid transparent' }}>
                <img src={ybotPic} className='w-100' alt='YBOT' />
              </div>
            </div>

            <div className="mb-4">
              <p className='label-style mb-1'>Speed: {Math.round(speed * 100) / 100}</p>
              <input
                type="range"
                min={0.05}
                max={0.50}
                step={0.01}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className='w-100 custom-range'
              />
            </div>

            <div className="mb-4">
              <p className='label-style mb-1'>Pause: {pause}ms</p>
              <input
                type="range"
                min={0}
                max={2000}
                step={100}
                value={pause}
                onChange={(e) => setPause(parseInt(e.target.value))}
                className='w-100 custom-range'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LearnSign;
