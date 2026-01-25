import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "@/store";
import * as THREE from "three";
import { useState, useLayoutEffect } from "react"; 

export const CameraManager = () => {
  const { camera, controls } = useThree();
  const { focus } = useStore();

  const [vecPosition] = useState(new THREE.Vector3());
  const [vecTarget] = useState(new THREE.Vector3());

  // --- 1. INITIALISATION PROCHE ---
  useLayoutEffect(() => {
    camera.position.set(0, 2, 3); 
    camera.lookAt(0, 1, 0); 
  }, [camera]);

  useFrame((state, delta) => {
    const lerpSpeed = 2 * delta;

    let targetPosition = new THREE.Vector3(); 
    let targetLookAt = new THREE.Vector3();   

    switch (focus) {
      case 'intro':
        targetPosition.set(0, 2, 3);
        targetLookAt.set(0, 1, 0); 
        break;

      case 'poster':
        targetPosition.set(0, 2, 3);
        targetLookAt.set(-0.8, 2, 0);
        break;

      case 'turntable':
        targetPosition.set(2, 5, 0);
        targetLookAt.set(0, 0, 0);
        break;

      case 'record':
        targetPosition.set(1.2, 1.5, -0.5);
        targetLookAt.set(1.2, 1.5, -3);
        break;

      case 'experience':
        targetPosition.set(0.6, 1.6, 0.6); 
        targetLookAt.set(0.5, 0, -0.9);
        break;
        
      case 'rack':
        targetPosition.set(-1.5, 0.5, 0.5); 
        targetLookAt.set(-3, 0.2, -1.5);    
        break;

      case 'board':
        // Le tableau est en Z = -2.95
        // On se met en Z = 0.5 pour avoir assez de recul et voir les 6 items
        targetPosition.set(3, 1.5, 1.5); 
        targetLookAt.set(3, 1.5, -3);   
        break;
        case 'logo':
   
        
    }

    // --- APPLICATION DES MOUVEMENTS ---
    camera.position.lerp(targetPosition, lerpSpeed);

    if (controls) {
        // @ts-ignore 
        controls.target.lerp(targetLookAt, lerpSpeed);
        // @ts-ignore
        controls.update(); 
    } else {
        camera.lookAt(targetLookAt);
    }
  });

  return null;
};