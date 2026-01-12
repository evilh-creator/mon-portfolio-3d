"use client";

import { Turntable } from "./Turntable";
import { Vinyl } from "./Vinyl";
import { ActiveVinyl } from "./ActiveVinyl";
import { GoldRecord } from "./GoldRecord";
import { projects } from "@/data/projects";
import { OrbitControls, useGLTF, useTexture, Float, ContactShadows, Environment } from "@react-three/drei";import { CameraManager } from "./CameraManager";
import { useStore } from "@/store";
import { RepeatWrapping } from "three"; 
import { GroupProps } from "@react-three/fiber";
import { useMemo } from 'react';
import * as THREE from 'three';
import { Rack } from "./Rack"; // Adapte le chemin si nécessaire

// --- COMPOSANTS ASSETS (GLB) ---

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

function NotebookModel(props: GroupProps) {
  const { scene } = useGLTF('/notebook.glb');
  const clone = scene.clone();
  return <primitive object={clone} {...props} />;
}

// --- COMPOSANT CABLE ---
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
      <tubeGeometry args={[curve, 20, thickness, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
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
  // --- AJOUT : Fonction pour gérer le clic "Aller-Retour" ---
  const handleToggle = (target: 'intro' | 'poster' | 'turntable' | 'record' | 'experience', e: any) => {
    e.stopPropagation(); 
    setActiveProject(null); // On ferme les projets éventuels
    
    // Si on est déjà sur l'élément, on revient à l'intro. Sinon, on zoom dessus.
    if (focus === target) {
        setFocus('intro');
    } else {
        setFocus(target);
    }
  };
  
  return (
    <>
      <CameraManager /> 
      
      {/* ======================================================== */}
      {/* --- AMBIANCE "GOLDEN HOUR" (FENÊTRE À DROITE) --- */}
      {/* ======================================================== */}

      {/* 1. Fond : Un crépuscule sombre (Violet très foncé) */}
      <color attach="background" args={['#150a1a']} />
      <fogExp2 attach="fog" args={['#150a1a', 0.12]} /> 

      {/* 2. Lumière Ambiante (Les ombres) */}
      {/* On utilise du violet pour contraster avec l'orange du soleil */}
      <ambientLight intensity={0.5} color="#4a3b59" />

      {/* 3. LE SOLEIL (Venant de la fenêtre fictive à DROITE) */}
      <spotLight
          position={[7, 2, 2]}       // Très à droite, assez bas (coucher de soleil), légèrement devant
          target-position={[0, 0, 0]} // Vise le centre de la table
          intensity={800}              // Très puissant car c'est le soleil direct
          color="#ff9545"             // Orange chaud / Doré
          angle={0.4}                 // Angle fermé pour imiter la lumière passant par une fenêtre
          penumbra={0.3}              // Bords de lumière légèrement doux
          castShadow                  // Projette les ombres
          shadow-bias={-0.0005}       // Évite les bugs d'ombre
          shadow-mapSize-width={2048} // Ombres nettes et jolies
          shadow-mapSize-height={2048}
      />

      {/* 4. Reflet chaud sur le sol (Simulation du rebond de lumière) */}
      {/* Lumière douce qui vient du sol pour simuler le soleil qui tape par terre */}
      <pointLight 
          position={[2, 0.5, 0]} 
          intensity={5} 
          color="#ffc480" 
          distance={4} 
          decay={2} 
      />

      {/* 5. Fill Light (Débouchage à gauche) */}
      {/* Une lumière très douce et froide à gauche pour que le côté ombre ne soit pas noir total */}
      <pointLight 
          position={[-3, 2, -1]} 
          intensity={2} 
          color="#6b6b90" // Bleu grisatre
          distance={5} 
      />

      {/* Environnement pour de jolis reflets sur le vinyle (Mode Sunset) */}
      <Environment preset="sunset" environmentIntensity={0.5} />

      {/* ======================================================== */}

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

        {/* --- CANAPÉ --- */}
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
                onClick={(e) => handleToggle('poster', e)} // <--- MODIFIÉ
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <planeGeometry args={[1.5, 2]} />
                <meshBasicMaterial map={textures.poster} /> 
            </mesh>

          {/* --- 6 MOUSSES ACOUSTIQUES --- */}
            <group position={[-3, 2.5, 0]}>
                {/* Colonne Gauche */}
                <FoamModel position={[0, 0.3, 0]}   rotation={[Math.PI / 2, Math.PI, 0]} scale={1} />
                <FoamModel position={[0, 0, 0]}     rotation={[Math.PI / 2, 0, 0]} scale={1} />
                <FoamModel position={[0, -0.3, 0]}  rotation={[Math.PI / 2, -Math.PI / 2, 0]} scale={1} />

                {/* Colonne Droite */}
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
                onClick={(e) => handleToggle('record', e)} // <--- MODIFIÉ
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

        {/* --- TABLE --- */}
        <TableModel 
            position={[0, -0.2, -0.5]} 
            scale={1.2} 
            receiveShadow // <--- AJOUTE ÇA
        />
        
        {/* --- ENCEINTES --- */}
        <SpeakerModel 
            position={[-1, 0.7, -0.6]} 
            rotation={[0, 0.5, 0]} 
            scale={3} 
            castShadow    // <--- AJOUTE ÇA
        />
        <SpeakerModel 
            position={[1, 0.7, -0.6]} 
            rotation={[0, -0.5, 0]} 
            scale={3} 
            castShadow    // <--- AJOUTE ÇA
        />

        {/* --- CABLES AUDIO --- */}
        <Cable 
            start={[-1.15, 0.9, -0.7]}  
            mid={[-0.2, 0.71, -1]} 
            end={[0.1, 0.75, -0.6]}   
        />
        <Cable 
            start={[1.15, 0.9, -0.7]}   
            mid={[0, 0.71, -1]}   
            end={[0.1, 0.75, -0.6]}    
        />
        {/* --- CABLE ALIM --- */}
        <Cable 
            start={[0, 0.73, -0.5]}    
            mid={[0, 0.68, -1.14]}     
            end={[0, 0, -1]}        
            color="#888888"           
            thickness={0.005}         
        />

        {/* --- PLATINE VINYLE --- */}
       <group position={[0, 0.7, -0.4]}> 
            <Turntable 
                scale={1} 
                rotation={[0, -0.5, 0]}
                isPlaying={activeProject !== null}
                onClick={(e: any) => handleToggle('turntable', e)} // <--- MODIFIÉ
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            />
            {activeProject !== null && (<ActiveVinyl projectIndex={activeProject} />)}
        </group>

        {/* --- OMBRES DE CONTACT TABLE (Pour ancrer les objets) --- */}
        <ContactShadows 
            position={[0, 0.71, -0.5]} // Juste un poil au-dessus de la table (Y=0.7)
            opacity={0.6}              // Assez visible
            scale={5}                  // Taille de la zone d'ombre
            blur={2}                   // Flou pour faire naturel
            far={0.5}                  // Distance max de projection (pour ne pas toucher le sol)
            resolution={512}           // Qualité
            color="#1d1124"            // Violet très sombre (cohérent avec l'ambiance)
        />

        {/* --- CARNET GLB (EXPÉRIENCES) --- */}
       {/* --- GROUPE CARNET (VISUEL + HITBOX) --- */}
        {/* On place le groupe entier à la position voulue */}
        <group position={[0.6, 0.7, -0.3]} rotation={[0, 0.2, 0]}>
            
            {/* 1. Le modèle visuel (Juste pour faire joli, on enlève le onClick ici) */}
            <NotebookModel scale={2} />

            {/* 2. LA HITBOX INVISIBLE (C'est elle qu'on clique !) */}
            {/* Une boîte transparente légèrement plus grande que le carnet */}
            <mesh 
                position={[0, 0.05, 0]} // Un peu surélevée pour être sûr de la toucher
                onClick={(e: any) => handleToggle('experience', e)}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
                visible={false} // <--- REND LA BOÎTE INVISIBLE
            >
                {/* Taille de la zone de clic : Largeur, Hauteur, Profondeur */}
                <boxGeometry args={[0.5, 0.2, 0.7]} /> 
                <meshBasicMaterial color="red" wireframe />
            </mesh>

        </group>

        <group>
    {/* Tes autres objets existants (Table, etc.) */}
    {/* <Table position={[0, 0, 0]} /> */}


    {/* LE NOUVEAU PORTANT (RACK) */}
    <Rack 
        // POSITION : C'est ici qu'il faut régler !
        // [X (gauche/droite), Y (hauteur), Z (avant/arrière)]
        // Essai : à gauche (-3), au sol (0), un peu en arrière (-1.5)
        position={[0, 0, 0]} 
        
        // SCALE : Si le modèle est trop gros ou trop petit
        scale={10} 
        
        // ROTATION : [X, Y, Z] en radians. 
        // Math.PI / 2 = tourner de 90 degrés sur l'axe Y (vertical)
        rotation={[0, Math.PI / 4, 0]} 
    />

</group>

        {/* --- VINYLES FLOTTANTS --- */}
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

// Pré-chargement des assets
useGLTF.preload("/models/turntable.glb");
useGLTF.preload("/sofa.glb");
useGLTF.preload("/acousticfoam.glb");
useGLTF.preload("/table.glb");
useGLTF.preload("/carpet.glb");
useGLTF.preload("/speaker.glb");
useGLTF.preload("/notebook.glb");