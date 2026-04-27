'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface ShowcaseModelProps {
  url: string;
  speed?: number;
}

function fitObject(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 1.6 / maxDim : 1;
  root.position.sub(center.multiplyScalar(scale));
  root.scale.multiplyScalar(scale);
}

function Spinner({ url, speed = 0.4 }: { url: string; speed?: number }) {
  const gltf = useLoader(GLTFLoader, url);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });

  // Clone scene + fit on first render so original isn't mutated by React strict mode.
  const scene = gltf.scene.clone(true);
  fitObject(scene);

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export default function ShowcaseModel({ url, speed = 0.4 }: ShowcaseModelProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 3], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      className="cursor-default"
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 2, -4]} intensity={0.4} color="#88aaff" />

      <Suspense fallback={null}>
        <Float speed={1} rotationIntensity={0} floatIntensity={0.4}>
          <Spinner url={url} speed={speed} />
        </Float>
        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.55}
          scale={6}
          blur={2.4}
          far={3}
        />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
