'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Center } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  Box,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';

interface ModelViewerProps {
  modelUrl: string | null;
  originalImage?: string;
  onDownload?: () => void;
  isLoading?: boolean;
}

function OBJModel({ url }: { url: string }) {
  const obj = useLoader(OBJLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (obj) {
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      obj.scale.setScalar(scale);
      obj.position.sub(center.multiplyScalar(scale));

      // Apply material to all meshes
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x8888ff,
            metalness: 0.2,
            roughness: 0.6,
            side: THREE.DoubleSide,
          });
        }
      });
    }
  }, [obj]);

  // Auto-rotate
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={obj} />
    </group>
  );
}

function LoadingSpinner() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#8b5cf6" wireframe />
    </mesh>
  );
}

function Scene({ url, showGrid }: { url: string; showGrid: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} />

      <Suspense fallback={<LoadingSpinner />}>
        <Center>
          <OBJModel url={url} />
        </Center>
      </Suspense>

      {showGrid && (
        <Grid
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#4a5568"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#2d3748"
          fadeDistance={10}
          fadeStrength={1}
          position={[0, -1.5, 0]}
        />
      )}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
      />
    </>
  );
}

export default function ModelViewer({
  modelUrl,
  originalImage,
  onDownload,
  isLoading = false,
}: ModelViewerProps) {
  const [showGrid, setShowGrid] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reset error when URL changes
  useEffect(() => {
    setLoadError(null);
  }, [modelUrl]);

  return (
    <div className="space-y-4">
      {/* Side by Side View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original 2D Image */}
        {originalImage && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Original 2D</h4>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={originalImage}
                alt="Original 2D"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* 3D Model Viewer */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Generated 3D</h4>
          <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden border border-gray-200 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
                <p className="text-white text-sm mt-4">Processing model...</p>
              </div>
            ) : modelUrl && !loadError ? (
              <Canvas
                shadows
                camera={{ position: [0, 0, 4], fov: 50 }}
                gl={{ preserveDrawingBuffer: true }}
                onCreated={({ gl }) => {
                  gl.setClearColor('#1a1a2e');
                }}
              >
                <Scene url={modelUrl} showGrid={showGrid} />
              </Canvas>
            ) : loadError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Box className="h-16 w-16 text-red-400" />
                <p className="text-red-400 text-sm mt-4">Failed to load model</p>
                <p className="text-gray-500 text-xs mt-1">{loadError}</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Box className="h-16 w-16 text-gray-600" />
                <p className="text-gray-400 text-sm mt-4">No model to display</p>
                <p className="text-gray-500 text-xs mt-1">
                  Upload an image and convert to see the 3D model
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      {modelUrl && !isLoading && !loadError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Button
              variant={showGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className="text-xs"
            >
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </Button>
            <span className="text-xs text-gray-500 ml-2">
              Drag to rotate • Scroll to zoom
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                onClick={onDownload}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                Download OBJ
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
