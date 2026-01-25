"use client";

import { Turntable } from "./Turntable";
import { Vinyl } from "./Vinyl";
import { ActiveVinyl } from "./ActiveVinyl";
import { GoldRecord } from "./GoldRecord";
import { projects } from "@/data/projects";
import { OrbitControls, useGLTF, useTexture, Float, Environment, Preload } from "@react-three/drei"; 
import { CameraManager } from "./CameraManager";
import { useStore, HoverItemType } from "@/store";
import { useMemo, useLayoutEffect, Suspense } from 'react';
import * as THREE from 'three';
import { Rack } from "./Rack"; 
import { GroupProps } from "@react-three/fiber";
import { Corkboard } from "./Corkboard";
import { HoverLight } from "./HoverLight";
import { EffectComposer, Noise, Vignette, ChromaticAberration, Bloom } from '@react-three/postprocessing';
import { Wall } from "./Wall";
import { LevitatingLogo } from "./LevitatingLogo";
import { MusicManager } from "./MusicManager";
import { Floor } from "./Floor";

// --- CONFIGURATION GLOBALE DES MODÈLES ---
function useModelSettings(scene: THREE.Group) {
  useLayoutEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.frustumCulled = false;
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  }, [scene]);
}

// --- MODÈLES (Wrappers) ---
function SofaModel(props: GroupProps) { const { scene } = useGLTF('/sofa.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function FoamModel(props: GroupProps) { const { scene } = useGLTF('/acousticfoam.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function TableModel(props: GroupProps) { const { scene } = useGLTF('/table.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function CarpetModel(props: GroupProps) { const { scene } = useGLTF('/carpet.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function SpeakerModel(props: GroupProps) { const { scene } = useGLTF('/speaker.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }
function NotebookModel(props: GroupProps) { const { scene } = useGLTF('/notebook.glb'); const clone = useMemo(() => scene.clone(), [scene]); useModelSettings(clone); return <primitive object={clone} {...props} />; }

// --- NOUVEAU WRAPPER POUR LE SOL (Gère les ombres) ---
function FloorModel(props: GroupProps) {
  const { scene } = useGLTF('/sol.glb');
  const clone = useMemo(() => scene.clone(), [scene]);

  useLayoutEffect(() => {
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.receiveShadow = true; // Le sol reçoit les ombres
        child.castShadow = false;
      }
    });
  }, [clone]);

  return <primitive object={clone} {...props} />;
}

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

export const Experience = () => {
  const { setFocus, focus, activeProject, setActiveProject, setHoveredItem } = useStore();
  const floor = useGLTF('/sol.glb');

  // 1. CHARGEMENT DES TEXTURES
  const textures = useTexture({
    poster: "/textures/poster.jpg",
    banner: "/textures/LaHaine.jpg",
    liveAid: "/textures/liveaidposter.jpg",
    small: "/textures/262754.jpg",
  });

  const handleToggle = (target: 'intro' | 'poster' | 'turntable' | 'record' | 'experience' | 'rack'| 'board', e: any) => {
    e.stopPropagation(); 
    setActiveProject(null);
    setHoveredItem(null); 
    if (focus === target) setFocus('intro');
    else setFocus(target);
  };

  const onOver = (item: HoverItemType, e: any) => { e.stopPropagation(); setHoveredItem(item); document.body.style.cursor = 'pointer'; };
  const onOut = (e: any) => { e.stopPropagation(); setHoveredItem(null); document.body.style.cursor = 'auto'; };
  
  return (
    <>
      <CameraManager /> 

    <MusicManager />
    
      
      {/* AMBIANCE DARK */}
      <color attach="background" args={['#020202']} />
      <fogExp2 attach="fog" args={['#020202', 0.035]} /> 
      <ambientLight intensity={0.02} color="#4a3b59" />
      
      <HoverLight />

      <spotLight 
        position={[7, 5, 5]} intensity={200} color="#ff9545" 
        angle={0.6} penumbra={0.5} castShadow={true}
        shadow-mapSize-width={512} shadow-mapSize-height={512} shadow-bias={-0.0001}
      />

      <pointLight position={[2, 0.5, 0]} intensity={0.5} color="#ffc480" distance={3} decay={2} castShadow={false} />
      <pointLight position={[-3, 2, -1]} intensity={0.2} color="#6b6b90" distance={3} castShadow={false} />
      
      <Environment preset="city" environmentIntensity={0.1} />

      <EffectComposer multisampling={0}>
        <Noise opacity={0.15} /> 
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} radialModulation={false} modulationOffset={0} />
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={0.5} radius={0.4} />
      </EffectComposer>

      <OrbitControls makeDefault enabled={focus === 'intro'} enableZoom={false} enablePan={false} minAzimuthAngle={-0.3} maxAzimuthAngle={0.3} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2 - 0.1} rotateSpeed={0.5} dampingFactor={0.9} enableRotate={false}/>

      <Suspense fallback={null}>
      <group position={[0, -1, 0]}>
        
        {/* LE SOL (Modèle chargé) */}
        
        
        <CarpetModel position={[0, 0.01, -0.5]} scale={3} />
        
        {/* MUR GLB */}
        <Wall position={[0, 0, -2.9]} rotation={[0, Math.PI / 2, 0]} />
        <Floor position={[-6.5, 0, 0]} scale={3} />


        <SofaModel position={[3.5, 0, -1.5]} rotation={[0, -0.5, 0]} scale={1.5} />

        {/* --- GROUPE DECO MURALE AVEC TEXTURES --- */}
        <group position={[0, 0, -2.8]}> 
            
            {/* POSTER "MOI" (Gauche) */}
             <mesh position={[-0.8, 2.5, 0]} onClick={(e) => handleToggle('poster', e)} onPointerOver={(e) => onOver('poster', e)} onPointerOut={onOut} castShadow={false} receiveShadow={true}>
                <planeGeometry args={[1.5, 2]} />
                <meshStandardMaterial map={textures.poster} roughness={0.5} />
            </mesh>

            {/* MOUSSES ACOUSTIQUES */}
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
            
            {/* BANNIÈRE HAUTE (La Haine) */}
            <mesh position={[1.2, 3.6, 0]} castShadow={false} receiveShadow={true}>
                 <planeGeometry args={[1.2, 0.7]} />
                 <meshStandardMaterial map={textures.banner} roughness={0.5} /> 
            </mesh>

            <group onClick={(e) => handleToggle('record', e)} onPointerOver={(e) => onOver('record', e)} onPointerOut={onOut}>
                <GoldRecord position={[1.2, 2.5, 0]} scale={0.8} />
            </group>

            {/* PETIT POSTER 1 (Live Aid) */}
            <mesh position={[0.7, 1.3, 0]} castShadow={false} receiveShadow={true}>
                <planeGeometry args={[0.6, 0.8]} />
                <meshStandardMaterial map={textures.liveAid} roughness={0.5} />
            </mesh>
            
            {/* PETIT POSTER 2 (262754) */}
            <mesh position={[1.7, 1.3, 0]} castShadow={false} receiveShadow={true}>
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

       <group 
            position={[0, 0.7, -0.4]} 
            
            // L'événement est ICI, sur le groupe parent
            onClick={(e) => {
                e.stopPropagation(); 
                
                // --- LA SÉCURITÉ ABSOLUE ---
                // Si on est DÉJÀ en mode turntable, on interdit STRICTEMENT
                // de relancer l'action. Le clic est tué ici.
                

                // Sinon, on active le mode
                handleToggle('turntable', e);
            }}
            
            onPointerOver={(e) => onOver('turntable', e)}
            onPointerOut={onOut}
        > 
            {/* On retire les onClick de la Turntable pour éviter les conflits */}
            <Turntable 
                scale={1} 
                rotation={[0, -0.5, 0]} 
                isPlaying={activeProject !== null}
                // PLUS DE ONCLICK ICI
            />
            
            {/* Le Vinyle est protégé par le groupe parent */}
            {activeProject !== null && (<ActiveVinyl projectIndex={activeProject} />)}
        </group>

        <group position={[0.6, 0.7, -0.3]} rotation={[0, 0.2, 0]} onClick={(e) => handleToggle('experience', e)} onPointerOver={(e) => onOver('experience', e)} onPointerOut={onOut}>
            <NotebookModel scale={2} />
            <mesh position={[0, 0.05, 0]} visible={false}>
                <boxGeometry args={[0.5, 0.2, 0.7]} /> 
                <meshBasicMaterial color="red" wireframe />
            </mesh>
            <LevitatingLogo position={[-1.4, 0.2, 0]} rotation={[0, 0.5, 0]} scale={0.2}/>
                     // Ajuste la taille si le sol est tout petit
      
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
                    onClick={(e) => { e.stopPropagation(); setActiveProject(index); setFocus('turntable'); }}
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
useGLTF.preload("/sol.glb"); // Ajout du sol au preload