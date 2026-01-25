import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "@/store";
import * as THREE from "three";
import { useRef, useLayoutEffect } from "react";

// --- CONFIGURATION ---
const TARGETS: Record<string, { position: [number, number, number], target: [number, number, number] }> = {
    rack: {
        position: [-1.5, 3, 2], 
        target: [-1.5, 0.5, 0.5] 
    },
    turntable: {
        position: [2, 2, 1],
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

// --- COMPOSANT SPOT INDIVIDUEL ---
const IndividualSpot = ({ name, config }: { name: string, config: any }) => {
    const spotLightRef = useRef<THREE.SpotLight>(null);
    const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());
    const { scene } = useThree();

    // 1. Initialisation (Une seule fois)
    useLayoutEffect(() => {
        // Positionner la cible
        targetRef.current.position.set(...(config.target as [number, number, number]));
        scene.add(targetRef.current);
        
        // Positionner la lumière
        if (spotLightRef.current) {
            spotLightRef.current.target = targetRef.current;
            spotLightRef.current.position.set(...(config.position as [number, number, number]));
        }

        return () => { scene.remove(targetRef.current); };
    }, [scene, config]);

    // 2. Animation (60 FPS - Lecture directe du Store)
    useFrame((state, delta) => {
        if (!spotLightRef.current) return;

        // 👇 LA MAGIE EST ICI : On lit le store en direct sans re-render React
        const { hoveredItem, focus } = useStore.getState();
        
        let shouldBeOn = false;

        // Logique de priorité :
        if (hoveredItem) {
            // Si on survole un objet, c'est lui qui s'allume
            shouldBeOn = (hoveredItem === name);
        } else {
            // Sinon, si on est zoomé sur une section (et pas intro), on l'éclaire
            if (focus !== 'intro') {
                shouldBeOn = (focus === name);
            }
        }

        // Animation de l'intensité
        const targetIntensity = shouldBeOn ? 80 : 0; // J'ai monté un peu à 80 pour être sûr que ça se voit
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
            intensity={0}
            angle={0.6}
            penumbra={0.5}
            distance={10}
            color="#ffebd6"
            shadow-bias={-0.0001}
        />
    );
};

// --- COMPOSANT PRINCIPAL ---
export const HoverLight = () => {
    // Note : On n'appelle PLUS useStore ici pour éviter de tout recharger à chaque mouvement.
    // Chaque spot gère son état tout seul comme un grand.
    
    return (
        <>
            {Object.entries(TARGETS).map(([key, config]) => (
                <IndividualSpot 
                    key={key} 
                    name={key}
                    config={config} 
                />
            ))}
        </>
    );
};