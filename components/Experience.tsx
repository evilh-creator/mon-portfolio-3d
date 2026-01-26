"use client";

import { useMemo, useLayoutEffect, useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { OrbitControls, useGLTF, useTexture, Float, Environment, Preload, PerformanceMonitor } from "@react-three/drei"; 
import { EffectComposer, Noise, Vignette, ChromaticAberration, Bloom, SMAA } from '@react-three/postprocessing';

// Components
import { Turntable } from "./Turntable";
import { Vinyl } from "./Vinyl";
import { ActiveVinyl } from "./ActiveVinyl";
import { GoldRecord } from "./GoldRecord";
import { Rack } from "./Rack"; 
import { Corkboard } from "./Corkboard";
import { HoverLight } from "./HoverLight";
import { Wall } from "./Wall";
import { LevitatingLogo } from "./LevitatingLogo";
import { MusicManager } from "./MusicManager";
import { Floor } from "./Floor";
import { CameraManager } from "./CameraManager";
import { useThree } from '@react-three/fiber';



// Hooks & Data
import { useStore, HoverItemType } from "@/store";
import { projects } from "@/data/projects";
import { useMobile } from "@/hooks/useMobile";

// --- OPTIMISATION GLOBALE ---
function useModelSettings(scene: THREE.Group) {
  useLayoutEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.frustumCulled = false;
        child.castShadow = false; // On désactive les ombres par modèle par défaut
        child.receiveShadow = false;
      }
    });
  }, [scene]);
}

// --- MODÈLES ---
function SofaModel(props: any) { const { scene } = useGLTF('/sofa.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function FoamModel(props: any) { const { scene } = useGLTF('/acousticfoam.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function TableModel(props: any) { const { scene } = useGLTF('/table.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function CarpetModel(props: any) { const { scene } = useGLTF('/carpet.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function SpeakerModel(props: any) { const { scene } = useGLTF('/speaker.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function NotebookModel(props: any) { const { scene } = useGLTF('/notebook.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }

function Cable({ start, mid, end, color = "#111", thickness = 0.01 }: { start: number[], mid: number[], end: number[], color?: string, thickness?: number }) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([new THREE.Vector3(...start), new THREE.Vector3(...mid), new THREE.Vector3(...end)]);
  }, [start, mid, end]);
  return (
    <mesh frustumCulled={false} castShadow={false} receiveShadow={false}>
      <tubeGeometry args={[curve, 10, thickness, 6, false]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}
function FixComposerResize() {
  const { gl, size } = useThree();
  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    gl.setSize(size.width, size.height);
  }, [size, gl]);
  return null;
}

export const Experience = (props: any) => {
  const { setFocus, focus, activeProject, setActiveProject, setHoveredItem } = useStore();
  const isMobile = useMobile();
  

  // --- ÉTAT DE PERFORMANCE ---
  // Par défaut, on tente la haute qualité (true).
  // Si le PC rame, PerformanceMonitor passera ça à false.
  const [highQuality, setHighQuality] = useState(true);

  // --- RESPONSIVE ---
  const [responsiveConfig, setResponsiveConfig] = useState({ scale: 1, position: [0, -1, 0] });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 500) setResponsiveConfig({ scale: 0.55, position: [0, -0.2, 0] });
      else if (width < 850) setResponsiveConfig({ scale: 0.7, position: [0, -0.5, 0] });
      else if (width < 1100) setResponsiveConfig({ scale: 0.85, position: [0, -0.8, 0] });
      else setResponsiveConfig({ scale: 1, position: [0, -1, 0] });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const textures = useTexture({
    poster: "/textures/poster.jpg",
    banner: "/textures/LaHaine.jpg",
    liveAid: "/textures/liveaidposter.jpg",
    small: "/textures/262754.jpg",
  });

  const handleToggle = (target: any, e: any) => {
    e.stopPropagation(); 
    setActiveProject(null);
    setHoveredItem(null); 
    if (focus === target) setFocus('intro');
    else setFocus(target);
  };

  const onOver = (item: HoverItemType, e: any) => { e.stopPropagation(); setHoveredItem(item); document.body.style.cursor = 'pointer'; };
  const onOut = (e: any) => { e.stopPropagation(); setHoveredItem(null); document.body.style.cursor = 'auto'; };
  
  // On définit si on active les effets lourds (Ombres + Bloom)
  // IL faut que : 1. Ce ne soit PAS un mobile ET 2. Que le PC tienne la route (highQuality)
  const enableHeavyEffects = !isMobile && highQuality;

  return (
    <>
      {/* MONITEUR DE PERFORMANCE : 
         Si les FPS chutent, on appelle onDecline -> setHighQuality(false)
         Cela va instantanément couper le Bloom et les Ombres pour sauver la fluidité.
      */}
      <PerformanceMonitor onDecline={() => setHighQuality(false)} />

      <CameraManager /> 
      <MusicManager />
      <HoverLight />
      
      <color attach="background" args={['#020202']} />
      <fogExp2 attach="fog" args={['#020202', 0.035]} /> 
      <ambientLight intensity={2} color="#4a3b59" />
      
      
      {/* Lumière interactive seulement si on a la puissance nécessaire */}
     

      <spotLight 
        position={[7, 5, 5]} intensity={400} color="#ff9545" 
        angle={0.6} penumbra={0.5} 
        // 👇 Les ombres ne s'activent que si le PC est puissant
        castShadow={enableHeavyEffects}
        shadow-mapSize-width={512} shadow-mapSize-height={512} shadow-bias={-0.0001}
      />

      <pointLight position={[2, 0.5, 0]} intensity={0.5} color="#ffc480" distance={3} decay={2} castShadow={false} />
      <pointLight position={[-3, 2, -1]} intensity={0.2} color="#6b6b90" distance={3} castShadow={false} />
      
      <Environment preset="city" environmentIntensity={0.1} />

      {/* 👇 POST-PROCESSING : Coupé automatiquement si ça lag */}
     


      <OrbitControls 
        makeDefault enabled={focus === 'intro'} enableZoom={false} enablePan={false} 
        minAzimuthAngle={-0.3} maxAzimuthAngle={0.3} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2 - 0.1} 
        rotateSpeed={0.5} dampingFactor={0.9} enableRotate={false}
      />

      <Suspense fallback={null}>
        <group position={responsiveConfig.position as any} scale={responsiveConfig.scale}>
            
            <CarpetModel position={[0, 0.01, -0.5]} scale={3} />
            <Wall position={[0, 0, -2.9]} rotation={[0, Math.PI / 2, 0]} />
            <Floor position={[-6.5, 0, 0]} scale={3} />
            <SofaModel position={[3.5, 0, -1.5]} rotation={[0, -0.5, 0]} scale={1.5} />

            <group position={[0, 0, -2.8]}> 
                <mesh position={[-0.8, 2.5, 0]} onClick={(e) => handleToggle('poster', e)} onPointerOver={(e) => onOver('poster', e)} onPointerOut={onOut} castShadow={false} receiveShadow={enableHeavyEffects}>
                    <planeGeometry args={[1.5, 2]} />
                    <meshStandardMaterial map={textures.poster} roughness={0.5} />
                </mesh>

                <group position={[-3, 2.5, 0]}>
                    <FoamModel position={[0, 0.3, 0]}   rotation={[Math.PI / 2, Math.PI, 0]} scale={1} />
                    <FoamModel position={[0, 0, 0]}     rotation={[Math.PI / 2, 0, 0]} scale={1} />
                    <FoamModel position={[0, -0.3, 0]}  rotation={[Math.PI / 2, -Math.PI / 2, 0]} scale={1} />
                    <FoamModel position={[0.3, 0.3, 0]}   rotation={[Math.PI / 2, -Math.PI / 2, 0]} scale={1} />
                    <FoamModel position={[0.3, 0, 0]}     rotation={[Math.PI / 2, Math.PI, 0]} scale={1} />
                    <FoamModel position={[0.3, -0.3, 0]}  rotation={[Math.PI / 2, 0, 0]} scale={1} />
                    <FoamModel position={[0.6, 0.3, 0]}   rotation={[Math.PI / 2, 0, 0]} scale={1} />
                    <FoamModel position={[0.6, 0, 0]}     rotation={[Math.PI / 2, Math.PI, 0]} scale={1} />
                    <FoamModel position={[0.6, -0.3, 0]}  rotation={[Math.PI / 2, -Math.PI / 2, 0]} scale={1} />
                </group>
                
                <mesh position={[1.2, 3.6, 0]} castShadow={false} receiveShadow={enableHeavyEffects}>
                    <planeGeometry args={[1.2, 0.7]} />
                    <meshStandardMaterial map={textures.banner} roughness={0.5} /> 
                </mesh>

                <group onClick={(e) => handleToggle('record', e)} onPointerOver={(e) => onOver('record', e)} onPointerOut={onOut}>
                    <GoldRecord position={[1.2, 2.5, 0]} scale={0.8} />
                </group>

                <mesh position={[0.7, 1.3, 0]} castShadow={false} receiveShadow={enableHeavyEffects}>
                    <planeGeometry args={[0.6, 0.8]} />
                    <meshStandardMaterial map={textures.liveAid} roughness={0.5} />
                </mesh>
                <mesh position={[1.7, 1.3, 0]} castShadow={false} receiveShadow={enableHeavyEffects}>
                    <planeGeometry args={[0.6, 0.8]} />
                    <meshStandardMaterial map={textures.small} roughness={0.5} />
                </mesh>
            </group>

            <TableModel position={[0, -0.2, -0.5]} scale={1.2} />
            <SpeakerModel position={[-1, 0.7, -0.6]} rotation={[0, 0.5, 0]} scale={3} />
            <SpeakerModel position={[1, 0.7, -0.6]} rotation={[0, -0.5, 0]} scale={3} />

            <Cable start={[-1.15, 0.9, -0.7]} mid={[-0.2, 0.71, -1]} end={[0.1, 0.75, -0.6]} />
            <Cable start={[1.15, 0.9, -0.7]} mid={[0, 0.71, -1]} end={[0.1, 0.75, -0.6]} />
            <Cable start={[0, 0.73, -0.5]} mid={[0, 0.68, -1.14]} end={[0, 0, -1]} color="#888888" thickness={0.005} />

            <group position={[0, 0.7, -0.4]} onClick={(e) => { e.stopPropagation(); handleToggle('turntable', e); }} onPointerOver={(e) => onOver('turntable', e)} onPointerOut={onOut}> 
                <Turntable scale={1} rotation={[0, -0.5, 0]} isPlaying={activeProject !== null} />
                {activeProject !== null && (<ActiveVinyl projectIndex={activeProject} />)}
            </group>

            <group position={[0.6, 0.7, -0.3]} rotation={[0, 0.2, 0]} onClick={(e) => handleToggle('experience', e)} onPointerOver={(e) => onOver('experience', e)} onPointerOut={onOut}>
                <NotebookModel scale={2} />
                <mesh position={[0, 0.05, 0]} visible={false}>
                    <boxGeometry args={[0.5, 0.2, 0.7]} /> 
                    <meshBasicMaterial color="red" wireframe />
                </mesh>
                <LevitatingLogo position={[-1.4, 0.2, 0]} rotation={[0, 0.5, 0]} scale={0.2}/>
            </group>

            <group position={[-2.4, 0, -1.5]} rotation={[0, Math.PI / 4, 0]} onClick={(e) => handleToggle('rack', e)} onPointerOver={(e) => onOver('rack', e)} onPointerOut={onOut}>
                <Rack scale={1.3} />
                <mesh position={[0, 1, 0]} visible={false}>
                    <boxGeometry args={[1, 2, 1]} />
                    <meshBasicMaterial color="red" wireframe />
                </mesh>
            </group>

            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                <group position={[0, 0.9, 0.4]}>
                {projects.map((project, index) => {
                    if (activeProject === index) return null;
                    return (
                        <Vinyl 
                            key={project.id} image={project.image} index={index}
                            scale={0.15} position={[(index - 1) * 0.5, 0, 0]} rotation-x={-0.2}
                            onPointerEnter={() => {}}
                            onClick={(e: any) => { e.stopPropagation(); setActiveProject(index); setFocus('turntable'); }}                
                        />
                    );
                })}
                </group>
            </Float>

            <group position={[3, 2.5, -2.95]} rotation={[0, 0, 0]} onClick={(e) => handleToggle('board', e)} onPointerOver={(e) => onOver('board', e)} onPointerOut={onOut}>
                <Corkboard scale={0.8} />
            </group>
            
        </group>
      </Suspense>
      <Preload all />
    </>
  );
};

useGLTF.preload("/models/turntable.glb");
useGLTF.preload("/sofa.glb");
useGLTF.preload("/acousticfoam.glb");
useGLTF.preload("/table.glb");
useGLTF.preload("/carpet.glb");
useGLTF.preload("/speaker.glb");
useGLTF.preload("/notebook.glb");
useGLTF.preload("/sol.glb");