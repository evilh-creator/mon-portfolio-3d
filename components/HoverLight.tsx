import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "@/store";
import * as THREE from "three";
import { useRef, useState, useLayoutEffect } from "react";

// CONFIGURATION DES POSITIONS (Lumière + Cible)
const TARGETS: Record<string, { position: [number, number, number], target: [number, number, number] }> = {
    rack: {
        position: [-1.5, 3, 2], 
        target: [-1.5, 0.5, 0.5] 
    },
    turntable: {
        position: [2, 2, 1], // Un peu plus bas pour bien éclairer le plateau
        target: [0.7, 0.8, -0.5] 
    },
    poster: {
        position: [0, 3, 1], 
        target: [-0.8, 1.8, -2.9] 
    },
    board: {
        position: [3.5, 3, 3], 
        target: [3.5, 2.5, -2.95] 
    },
    experience: {
        position: [0.5, 3, 1], 
        target: [0.5, 0.8, -0.5] 
    },
    record: { 
        position: [1.2, 3, 1.5], 
        target: [1.2, 2.5, 0]    
    }
};

// --- COMPOSANT : UNE SEULE LUMIÈRE INDIVIDUELLE ---
// Elle gère sa propre cible et son propre fondu (fade)
const IndividualSpot = ({ config, isActive }: { config: any, isActive: boolean }) => {
    const spotLightRef = useRef<THREE.SpotLight>(null);
    const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());
    const { scene } = useThree();

    // 1. On ajoute la cible invisible dans la scène (obligatoire pour que spotLight.target fonctionne)
    useLayoutEffect(() => {
        // Positionner la cible
        targetRef.current.position.set(...(config.target as [number, number, number]));
        scene.add(targetRef.current);
        
        // Lier la lumière à la cible
        if (spotLightRef.current) {
            spotLightRef.current.target = targetRef.current;
            // On positionne la lumière
            spotLightRef.current.position.set(...(config.position as [number, number, number]));
        }

        return () => { scene.remove(targetRef.current); };
    }, [scene, config]);

    // 2. Animation d'intensité (Fade In / Fade Out)
    useFrame((state, delta) => {
        if (!spotLightRef.current) return;
        
        // Si actif, on vise 50 d'intensité (c'est fort car on est dans le noir). Sinon 0.
        const targetIntensity = isActive ? 50 : 0;
        
        // Vitesse du fondu (plus le chiffre est haut, plus c'est rapide)
        // 6 = assez rapide et réactif
        const speed = 6 * delta; 

        spotLightRef.current.intensity = THREE.MathUtils.lerp(
            spotLightRef.current.intensity, 
            targetIntensity, 
            speed
        );
    });

    return (
        <spotLight
            ref={spotLightRef}
            castShadow
            intensity={0} // Commence éteint
            angle={0.6}   // Cône un peu large
            penumbra={0.5} // Bords doux
            distance={10}
            color="#ffebd6" // Lumière un peu chaude
            shadow-bias={-0.0001}
        />
    );
};

// --- COMPOSANT PRINCIPAL : LE GESTIONNAIRE ---
export const HoverLight = () => {
    // On récupère l'état séparément (Performance)
    const hoveredItem = useStore((state) => state.hoveredItem);
    const focus = useStore((state) => state.focus);

    // DÉTERMINER QUI EST ACTIF
    let activeKey: string | null = null;

    if (hoveredItem) {
        // Priorité absolue au survol de la souris
        activeKey = hoveredItem;
    } else if (focus !== 'intro') {
        // Si pas de souris, on regarde le zoom caméra
        activeKey = focus;
    }

    return (
        <>
            {Object.entries(TARGETS).map(([key, config]) => (
                <IndividualSpot 
                    key={key} 
                    config={config} 
                    isActive={key === activeKey} 
                />
            ))}
        </>
    );
};