"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "@/store";
import * as THREE from "three";
import { useState, useLayoutEffect } from "react"; 
import { useMobile } from "@/hooks/useMobile"; // On garde le hook mobile

export const CameraManager = () => {
  const { camera, controls } = useThree();
  const { focus } = useStore();
  const isMobile = useMobile(); // Détection du mobile

  // --- 1. INITIALISATION (On part de tes valeurs) ---
  useLayoutEffect(() => {
    // Position initiale INTRO
    if (!isMobile) {
        camera.position.set(0, 2, 3); 
        camera.lookAt(0, 1, 0); 
    } else {
        // Init mobile un peu plus loin
        camera.position.set(0, 4, 11);
        camera.lookAt(0, -1, 0);
    }
  }, [camera, isMobile]);

  useFrame((state, delta) => {
    const lerpSpeed = 2 * delta;

    let targetPosition = new THREE.Vector3(); 
    let targetLookAt = new THREE.Vector3();   

    switch (focus) {
      case 'intro':
        if (isMobile) {
            targetPosition.set(0, 4, 11);
            targetLookAt.set(0, -1, 0);
        } else {
            // TES VALEURS EXACTES :
            targetPosition.set(0, 2, 3);
            targetLookAt.set(0, 1, 0); 
        }
        break;

      case 'poster':
        if (isMobile) {
            targetPosition.set(-0.8, 2.5, 4);
            targetLookAt.set(-0.8, 2.5, 0);
        } else {
            // TES VALEURS EXACTES :
            targetPosition.set(0, 2, 3);
            targetLookAt.set(-0.8, 2, 0);
        }
        break;

      case 'turntable':
        if (isMobile) {
            targetPosition.set(0, 3, 1);
            targetLookAt.set(0, 0.7, -0.4);
        } else {
            // TES VALEURS EXACTES :
            targetPosition.set(2, 5, 0);
            targetLookAt.set(0, 0, 0);
        }
        break;

      case 'record':
        if (isMobile) {
            targetPosition.set(1.2, 2.5, 3);
            targetLookAt.set(1.2, 2.5, 0);
        } else {
            // TES VALEURS EXACTES :
            targetPosition.set(1.2, 1.5, -0.5);
            targetLookAt.set(1.2, 1.5, -3);
        }
        break;

      case 'experience':
        if (isMobile) {
            targetPosition.set(0.6, 2.5, 2.5);
            targetLookAt.set(0.6, 0.7, -0.3);
        } else {
            // TES VALEURS EXACTES :
            targetPosition.set(0.6, 1.6, 0.6); 
            targetLookAt.set(0.5, 0, -0.9);
        }
        break;
        
      case 'rack':
        if (isMobile) {
            targetPosition.set(-1.5, 1, 3);
            targetLookAt.set(-2.4, 1, -1.5);
        } else {
            // TES VALEURS EXACTES :
            targetPosition.set(-1.5, 0.5, 0.5); 
            targetLookAt.set(-3, 0.2, -1.5);    
        }
        break;

      case 'board':
        if (isMobile) {
            targetPosition.set(3, 2.5, 3);
            targetLookAt.set(3, 2.5, -2.95);
        } else {
            // TES VALEURS EXACTES :
            targetPosition.set(3, 1.5, 1.5); 
            targetLookAt.set(3, 1.5, -3);   
        }
        break;
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