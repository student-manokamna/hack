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

  const componentRef = useRef({});
  const { current: ref } = componentRef;

  useEffect(() => {

    ref.flag = false;
    ref.pending = false;

    ref.animations = [];
    ref.characters = [];

    ref.scene = new THREE.Scene();
    ref.scene.background = new THREE.Color(0xdddddd);

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
      return ;
    }
    requestAnimationFrame(ref.animate);
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

  let alphaButtons = [];
  for (let i = 0; i < 26; i++) {
    alphaButtons.push(
        <div className='col-md-3'>
            <button className='signs w-100' onClick={()=>{
              if(ref.animations.length === 0){
                alphabets[String.fromCharCode(i + 65)](ref);
              }
            }}>
                {String.fromCharCode(i + 65)}
            </button>
        </div>
    );
  }

  let wordButtons = [];
  for (let i = 0; i < words.wordList.length; i++) {
    wordButtons.push(
        <div className='col-md-4'>
            <button className='signs w-100' onClick={()=>{
              if(ref.animations.length === 0){
                words[words.wordList[i]](ref);
              }
            }}>
                {words.wordList[i]}
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
            <div style={{ position: 'absolute', top: 20, left: 20 }}>
               <span className="tech-badge">CODECRAFTERS LEARNING ENGINE</span>
            </div>
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
