"use client";

import { Turntable } from "./Turntable";
import { Vinyl } from "./Vinyl";
import { ActiveVinyl } from "./ActiveVinyl";
import { Speaker } from "./Speaker";
import { GoldRecord } from "./GoldRecord";
import { projects } from "@/data/projects";
import { OrbitControls, useGLTF, useTexture, Environment, Float, ContactShadows } from "@react-three/drei";
import { CameraManager } from "./CameraManager";
import { useStore } from "@/store";
import { RepeatWrapping } from "three"; 
import { GroupProps } from "@react-three/fiber";
import { useMemo } from 'react';
import * as THREE from 'three';

// --- NOUVEAUX COMPOSANTS ASSETS (GLB) ---

function SofaModel(props: GroupProps) {
  const { scene } = useGLTF('/sofa.glb');
  const clone = scene.clone(); 
  return <primitive object={clone} {...props} />;
}

function FoamModel(props: GroupProps) {
  const { scene } = useGLTF('/acousticfoam.glb');
  const clone = scene.clone();
  return <primitive object={clone} {...props} />;
}

function TableModel(props: GroupProps) {
  const { scene } = useGLTF('/table.glb');
  const clone = scene.clone();
  return <primitive object={clone} {...props} />;
}
function CarpetModel(props: GroupProps) {
  const { scene } = useGLTF('/carpet.glb');
  const clone = scene.clone();
  return <primitive object={clone} {...props} />;
}
function SpeakerModel(props: GroupProps) {
  const { scene } = useGLTF('/speaker.glb');
  const clone = scene.clone();
  return <primitive object={clone} {...props} />;
}
// --- COMPOSANT CABLE (MIS À JOUR) ---
function Cable({ start, mid, end, color = "#111", thickness = 0.01 }: { start: number[], mid: number[], end: number[], color?: string, thickness?: number }) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    ]);
  }, [start, mid, end]);

  return (
    <mesh>
      {/* thickness contrôle l'épaisseur */}
      <tubeGeometry args={[curve, 20, thickness, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}

function NotebookModel(props: GroupProps) {
  const { scene } = useGLTF('/notebook.glb');
  // On clone pour éviter les soucis si on en met plusieurs
  const clone = scene.clone();
  // On applique les props (position, rotation, onClick...) à l'objet 3D
  return <primitive object={clone} {...props} />;
}
export const Experience = () => {
  // Textures des murs et posters
  const textures = useTexture({
    poster: "/textures/poster.jpg",
    cadre1: "/textures/262754.jpg",
    cadre2: "/textures/liveaidposter.jpg",
    banner: "/textures/LaHaine.jpg",
    wall: "/textures/wall.jpg", 
  });

  // Répétition de la texture murale
  textures.wall.wrapS = textures.wall.wrapT = RepeatWrapping;
  textures.wall.repeat.set(4, 2); 

  const { setFocus, focus, activeProject, setActiveProject } = useStore();
  

  return (
    <>
      <CameraManager /> 
      
      <ambientLight intensity={0.8} />
      <Environment preset="city" environmentIntensity={1} />
      <spotLight position={[0, 3, 2]} angle={0.5} penumbra={1} intensity={20} color={"#ffecd1"} castShadow />
      
      <OrbitControls makeDefault enableZoom={false} maxPolarAngle={Math.PI / 2 - 0.1} />

      {/* --- GROUPE PRINCIPAL --- */}
      <group position={[0, -1, 0]}>
        
        {/* SOL */}
        <mesh 
            rotation-x={-Math.PI / 2} position-y={0} receiveShadow
            onClick={() => { setFocus('intro'); setActiveProject(null); }}
            onPointerOver={() => document.body.style.cursor = 'auto'}
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.1} />
        </mesh>
        
        {/* --- TAPIS (GLB) --- */}
        {/* J'ai enlevé la rotation X de -90° car un modèle 3D est généralement déjà plat */}
        <CarpetModel 
            position={[0, 0.01, -0.5]} 
            scale={3} 
            rotation={[0, 0, 0]} 
        />
        
        {/* MUR DU FOND */}
        <mesh position={[0, 5, -3]}>
          <planeGeometry args={[20, 10]} />
          <meshStandardMaterial 
            map={textures.wall} 
            color="#666"
            roughness={0.8} 
          />
        </mesh>

        {/* --- NOUVEAU : LE CANAPÉ (GLB) --- */}
        {/* Remplace l'ancien code Sofa. Ajuste scale/position selon ton export Blender */}
        <SofaModel 
            position={[3.5, 0, -1.5]} 
            rotation={[0, -0.5, 0]} 
            scale={1.5} 
        />


        {/* --- DÉCORATION MURALE --- */}
        <group position={[0, 0, -2.95]}> 
            {/* POSTER (Moi) */}
            <mesh 
                position={[-0.8, 2.5, 0]} 
                onClick={(e) => { 
                    e.stopPropagation(); setActiveProject(null);
                    setFocus(focus === 'poster' ? 'intro' : 'poster'); 
                }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <planeGeometry args={[1.5, 2]} />
                <meshBasicMaterial map={textures.poster} /> 
            </mesh>

          {/* --- 6 MOUSSES ACOUSTIQUES (COLLÉES) --- */}
            {/* Grille serrée (Ecart réduit à 0.5) */}
            <group position={[-3, 2.5, 0]}>
                
                {/* Colonne Gauche */}
                <FoamModel position={[0, 0.3, 0]}   rotation={[Math.PI / 2, Math.PI, 0]} scale={1} />
                <FoamModel position={[0, 0, 0]}     rotation={[Math.PI / 2, 0, 0]} scale={1} />
                <FoamModel position={[0, -0.3, 0]}  rotation={[Math.PI / 2, -Math.PI / 2, 0]} scale={1} />

                {/* Colonne Droite (Collée à 0.5 sur l'axe X) */}
                <FoamModel position={[0.3, 0.3, 0]}   rotation={[Math.PI / 2, -Math.PI / 2, 0]} scale={1} />
                <FoamModel position={[0.3, 0, 0]}     rotation={[Math.PI / 2, Math.PI, 0]} scale={1} />
                <FoamModel position={[0.3, -0.3, 0]}  rotation={[Math.PI / 2, 0, 0]} scale={1} />

                <FoamModel position={[0.6, 0.3, 0]}   rotation={[Math.PI / 2, 0, 0]} scale={1} />
                <FoamModel position={[0.6, 0, 0]}     rotation={[Math.PI / 2, Math.PI, 0]} scale={1} />
                <FoamModel position={[0.6, -0.3, 0]}  rotation={[Math.PI / 2, -Math.PI / 2, 0]} scale={1} />

            </group>
            

            {/* Cadre Horizontal (Haut) */}
            <mesh position={[1.2, 3.6, 0]}>
                 <planeGeometry args={[1.2, 0.7]} />
                 <meshBasicMaterial map={textures.banner} /> 
            </mesh>

            {/* DISQUE D'OR (Bouton Skills) */}
            <group 
                onClick={(e) => { 
                    e.stopPropagation(); setActiveProject(null);
                    setFocus(focus === 'record' ? 'intro' : 'record'); 
                }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <GoldRecord position={[1.2, 2.5, 0]} scale={0.8} />
            </group>

            {/* Cadres Photos */}
            <mesh position={[0.7, 1.3, 0]}>
                <planeGeometry args={[0.6, 0.8]} />
                <meshBasicMaterial map={textures.cadre1} />
            </mesh>
            <mesh position={[1.7, 1.3, 0]}>
                <planeGeometry args={[0.6, 0.8]} />
                <meshBasicMaterial map={textures.cadre2} />
            </mesh>
        </group>

        {/* --- NOUVEAU : TABLE (GLB) --- */}
        {/* Remplace les <boxGeometry> "MEUBLES & SETUP" */}
        <TableModel 
            position={[0, -0.2, -0.5]} 
            scale={1.2} 
        />
        
      {/* --- ENCEINTES (GLB) --- */}
        {/* Posées sur la table. Ajuste le Y (0.85) si elles rentrent dans le meuble */}
        
        {/* Enceinte Gauche */}
        <SpeakerModel 
            position={[-1, 0.7, -0.6]} 
            rotation={[0, 0.5, 0]} // Tournée vers le centre
            scale={3} 
        />

        {/* Enceinte Droite */}
        <SpeakerModel 
            position={[1, 0.7, -0.6]} 
            rotation={[0, -0.5, 0]} // Tournée vers le centre
            scale={3} 
        />
        {/* --- CABLES AUDIO --- */}
        
        {/* Câble Gauche */}
        <Cable 
            start={[-1.15, 0.9, -0.7]}  // Derrière l'enceinte gauche
            mid={[-0.2, 0.71, -1]}  // Touche presque la table
            end={[0.1, 0.75, -0.6]}   // Va vers la platine (Input L)
        />

        {/* Câble Droit */}
        <Cable 
            start={[1.15, 0.9, -0.7]}   // Derrière l'enceinte droite
            mid={[0, 0.71, -1]}   // Touche presque la table
            end={[0.1, 0.75, -0.6]}    // Va vers la platine (Input R)
        />
        {/* --- CABLE D'ALIMENTATION (GRIS & FIN) --- */}
        <Cable 
            start={[0, 0.73, -0.5]}    // Sortie arrière de la platine
            mid={[0, 0.68, -1.14]}     // Tombe derrière le bord de la table
            end={[0, 0, -1]}        // Finit au sol (caché derrière le meuble)
            color="#888888"           // Gris
            thickness={0.005}         // Deux fois plus fin que les autres
        />


        {/* --- PLATINE VINYLE --- */}
        {/* Posée sur la table. Ajuste le position-y (0.85) pour qu'elle touche le plateau */}
        <group position={[0, 0.7, -0.4]}> 
            
            <Turntable 
                scale={1} 
                rotation={[0, -0.5, 0]}
                isPlaying={activeProject !== null}
                onClick={(e: any) => { 
                    e.stopPropagation(); 
                    setFocus(focus === 'turntable' ? 'intro' : 'turntable'); 
                }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            />

            {/* Le vinyle actif qui tourne */}
            {activeProject !== null && (<ActiveVinyl projectIndex={activeProject} />)}
        </group>

{/* --- CARNET GLB (EXPÉRIENCES) --- */}
<NotebookModel 
    position={[0.8, 0.7, -0.2]} 
    rotation={[0, 0.2, 0]}
    scale={2} 
    onClick={(e: any) => { 
        e.stopPropagation(); 
        setFocus('experience'); // C'est ça qui active le CameraManager
        setActiveProject(null); 
    }}
    onPointerOver={() => document.body.style.cursor = 'pointer'}
    onPointerOut={() => document.body.style.cursor = 'auto'}
/>
        {/* --- VINYLES FLOTTANTS (MENU) --- */}
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
            <group position={[0, 0.9, 0.4]}>
            {projects.map((project, index) => {
                if (activeProject === index) return null;
                return (
                <Vinyl 
                    key={project.id} image={project.image} index={index}
                    scale={0.15} position={[(index - 1) * 0.5, 0, 0]} rotation-x={-0.2}
                    onPointerEnter={() => {}}
                    onClick={(e) => {
                        e.stopPropagation(); setActiveProject(index); setFocus('turntable');
                    }}
                />
                );
            })}
            </group>
        </Float>
        
        <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={2.5} far={1} />
      </group>
    </>
  );
};

// Pré-chargement des assets pour éviter le pop-in
useGLTF.preload("/models/turntable.glb");
useGLTF.preload("/sofa.glb");
useGLTF.preload("/acousticfoam.glb");
useGLTF.preload("/table.glb");
useGLTF.preload("/carpet.glb");
useGLTF.preload("/speaker.glb");
useGLTF.preload("/notebook.glb");