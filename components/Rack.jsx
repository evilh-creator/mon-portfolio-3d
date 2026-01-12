import { useGLTF } from "@react-three/drei";

export function Rack(props) {
  // On charge tout
  const { scene } = useGLTF("/rack.glb");
  
  // On affiche tout le contenu de la scène
  return <primitive object={scene} {...props} />;
}