'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, useGLTF } from '@react-three/drei';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';

interface ModelViewerProps {
  modelUrl: string | null;
  originalImage?: string;
  onDownload?: () => void;
  isLoading?: boolean;
}

function Model({ url }: { url: string }) {
  const modelRef = useRef<THREE.Group>(null);
  const [modelObject, setModelObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    console.log('[ModelViewer] Loading model from URL:', url);

    // Detect file format from URL
    const isOBJ = url.toLowerCase().endsWith('.obj');
    console.log('[ModelViewer] Is OBJ file:', isOBJ);

    if (isOBJ) {
      // Load OBJ file
      const loader = new OBJLoader();
      console.log('[ModelViewer] Starting OBJ load...');

      loader.load(
        url,
        (obj) => {
          console.log('[ModelViewer] OBJ loaded successfully!', obj);

          // Center and scale the model
          const box = new THREE.Box3().setFromObject(obj);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;

          obj.position.sub(center);
          obj.scale.set(scale, scale, scale);

          // Add materials if needed
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (!child.material || Array.isArray(child.material)) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x808080,
                  roughness: 0.5,
                  metalness: 0.1,
                });
              }
            }
          });

          console.log('[ModelViewer] Setting model object');
          setModelObject(obj);
        },
        (progress) => {
          console.log('[ModelViewer] Loading progress:', (progress.loaded / progress.total) * 100 + '%');
        },
        (error) => {
          console.error('[ModelViewer] Error loading OBJ:', error);
        }
      );
    } else {
      // For GLTF/GLB, we'll load it differently
      // This is handled by the GLTFModel component below
      console.log('[ModelViewer] Not an OBJ file, skipping');
    }
  }, [url]);

  // Auto-rotate slowly
  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.2;
    }
  });

  if (!modelObject) {
    return null;
  }

  return (
    <primitive
      ref={modelRef}
      object={modelObject}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

function CameraController({ zoom }: { zoom: number }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5 / zoom, 0.1);
  });

  return null;
}

function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  );
}

export default function ModelViewer({
  modelUrl,
  originalImage,
  onDownload,
  isLoading = false,
}: ModelViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setAutoRotate(true);
  };

  // Don't render Canvas on server
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Generated 3D</h4>
            <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden border border-gray-200 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-white text-sm mt-4">Loading viewer...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-white text-sm mt-4">Processing model...</p>
              </div>
            ) : modelUrl ? (
              <Canvas
                shadows
                camera={{ position: [0, 0, 5], fov: 50 }}
                gl={{ preserveDrawingBuffer: true }}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <ambientLight intensity={0.5} />
                  <spotLight
                    position={[10, 10, 10]}
                    angle={0.15}
                    penumbra={1}
                    intensity={1}
                    castShadow
                  />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} />

                  <Model url={modelUrl} />

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
                      position={[0, -1, 0]}
                    />
                  )}

                  <OrbitControls
                    autoRotate={autoRotate}
                    autoRotateSpeed={2}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={2}
                    maxDistance={10}
                  />

                  <CameraController zoom={zoom} />
                  {/* Environment component removed - was causing HDR loading errors */}
                </Suspense>
              </Canvas>
            ) : (
              <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <Suspense fallback={null}>
                  <ambientLight intensity={0.3} />
                  <pointLight position={[10, 10, 10]} intensity={0.5} />
                  <mesh rotation={[0.5, 0.5, 0]}>
                    <boxGeometry args={[1.5, 1.5, 1.5]} />
                    <meshStandardMaterial
                      color="#4a5568"
                      wireframe
                      transparent
                      opacity={0.6}
                    />
                  </mesh>
                  <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} />
                </Suspense>
              </Canvas>
            )}
            {/* Empty state overlay */}
            {!modelUrl && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-gray-300 text-sm font-medium bg-gray-900/70 px-4 py-2 rounded-lg">
                  Upload an image to generate 3D model
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      {modelUrl && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="h-9 w-9 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="h-9 w-9 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              className="h-9 w-9 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <Button
              variant={autoRotate ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRotate(!autoRotate)}
              className="text-xs"
            >
              Auto Rotate
            </Button>
            <Button
              variant={showGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className="text-xs"
            >
              Show Grid
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Fullscreen logic
                const element = document.querySelector('.model-viewer-canvas');
                if (element) {
                  element.requestFullscreen?.();
                }
              }}
              className="text-xs"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Fullscreen
            </Button>
            {onDownload && (
              <Button
                onClick={onDownload}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      {modelUrl && !isLoading && (
        <div className="text-center text-xs text-gray-400">
          <p>
            Left click + drag to rotate • Right click + drag to pan • Scroll to
            zoom
          </p>
        </div>
      )}
    </div>
  );
}
