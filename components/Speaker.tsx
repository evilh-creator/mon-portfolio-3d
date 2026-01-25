"use client";



export const Speaker = (props: any) => {
  return (
    <group {...props}>
      {/* LA BOÎTE (Caisson) */}
      <mesh>
        <boxGeometry args={[0.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#222" roughness={0.2} />
      </mesh>

      {/* LE WOOFER (Gros rond en bas) */}
      <mesh position={[0, -0.1, 0.151]}>
        <circleGeometry args={[0.12, 32]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Le cône du woofer (relief) */}
      <mesh position={[0, -0.1, 0.16]} rotation-x={-Math.PI / 2}>
        <coneGeometry args={[0.08, 0.05, 32]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      {/* LE TWEETER (Petit rond en haut) */}
      <mesh position={[0, 0.15, 0.151]}>
        <circleGeometry args={[0.05, 32]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};