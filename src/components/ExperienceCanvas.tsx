import { Environment, Float, Preload, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { MutableRefObject } from 'react';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Box3, type Group, MathUtils, Vector3 } from 'three';
import { assetPath } from '../constants';
import type { EveningStarVariant } from '../variants';

const environmentUrl = assetPath('hdr/aircraft_workshop_01_1k.hdr');

type ExperienceCanvasProps = {
  onReady: () => void;
  variant: EveningStarVariant;
};

type PointerRef = MutableRefObject<{ x: number; y: number }>;

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll <= 0 ? 0 : MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
}

function useNormalizedPointer() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  return pointer;
}

function BoardModel({ modelUrl, onReady, pointer }: { modelUrl: string; onReady: () => void; pointer: PointerRef }) {
  const motion = useRef<Group>(null);
  const normalized = useRef<Group>(null);
  const gltf = useGLTF(modelUrl);
  const { viewport } = useThree();

  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const bounds = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;

    return {
      center,
      scale: 3.25 / maxDimension
    };
  }, [scene]);

  useEffect(() => {
    scene.traverse((object) => {
      if ('castShadow' in object) {
        object.castShadow = true;
      }
      if ('receiveShadow' in object) {
        object.receiveShadow = true;
      }
    });
    onReady();
  }, [onReady, scene]);

  useFrame(({ clock }) => {
    if (!motion.current || !normalized.current) {
      return;
    }

    const progress = getScrollProgress();
    const isCompact = viewport.width < 5.6;
    const scrollEase = MathUtils.smoothstep(progress, 0.08, 0.52);
    const lateEase = MathUtils.smoothstep(progress, 0.58, 0.92);
    const drift = Math.sin(clock.elapsedTime * 0.65) * 0.035;

    const heroX = isCompact ? 0 : -1.58;
    const detailX = isCompact ? 0 : 0.92;
    const targetX = MathUtils.lerp(heroX, detailX, scrollEase);
    const targetY = isCompact ? MathUtils.lerp(-0.8, 0.5, scrollEase) : MathUtils.lerp(-0.12, 0.12, lateEase);
    const targetZ = MathUtils.lerp(0, -0.18, lateEase);
    const targetScale = MathUtils.lerp(isCompact ? 0.78 : 0.92, isCompact ? 0.6 : 0.76, lateEase);

    motion.current.position.lerp(new Vector3(targetX, targetY + drift, targetZ), 0.075);
    motion.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.08);

    const pointerX = pointer.current.x;
    const pointerY = pointer.current.y;
    const targetRotationX = MathUtils.lerp(0.58, 0.28, scrollEase) + pointerY * 0.12;
    const targetRotationY = MathUtils.lerp(-0.42, 1.12, scrollEase) + pointerX * 0.18;
    const targetRotationZ = MathUtils.lerp(-0.14, -0.3, scrollEase) + pointerX * 0.05;

    motion.current.rotation.x = MathUtils.lerp(motion.current.rotation.x, targetRotationX, 0.075);
    motion.current.rotation.y = MathUtils.lerp(motion.current.rotation.y, targetRotationY, 0.075);
    motion.current.rotation.z = MathUtils.lerp(motion.current.rotation.z, targetRotationZ, 0.075);
    normalized.current.rotation.y += 0.0015;
  });

  return (
    <group ref={motion}>
      <Float speed={1.1} rotationIntensity={0.04} floatIntensity={0.12}>
        <group ref={normalized} scale={bounds.scale}>
          <primitive object={scene} position={[-bounds.center.x, -bounds.center.y, -bounds.center.z]} />
        </group>
      </Float>
    </group>
  );
}

function CameraRig() {
  const { camera, viewport } = useThree();
  const cameraRef = useRef(camera);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useFrame(() => {
    const activeCamera = cameraRef.current;
    const isCompact = viewport.width < 5.6;
    const progress = getScrollProgress();
    const targetZ = MathUtils.lerp(isCompact ? 6.2 : 5.35, isCompact ? 6.9 : 5.9, progress);

    activeCamera.position.z = MathUtils.lerp(activeCamera.position.z, targetZ, 0.045);
    activeCamera.position.y = MathUtils.lerp(activeCamera.position.y, isCompact ? 0.25 : 0, 0.045);
    activeCamera.lookAt(0, 0, 0);
  });

  return null;
}

export function ExperienceCanvas({ onReady, variant }: ExperienceCanvasProps) {
  const pointer = useNormalizedPointer();
  const modelUrl = assetPath(variant.model);

  return (
    <div className="experience" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5.35], fov: 35, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        shadows
      >
        <fog attach="fog" args={[variant.fog, 9, 18]} />
        <ambientLight intensity={0.95} />
        <directionalLight castShadow intensity={2.5} position={[4, 5, 5]} />
        <directionalLight intensity={1.2} position={[-5, -2, 4]} color={variant.light} />
        <spotLight angle={0.5} intensity={22} penumbra={0.4} position={[0, 4, 5]} color="#ffffff" />
        <Suspense fallback={null}>
          <Environment files={environmentUrl} environmentIntensity={0.7} />
          <BoardModel key={variant.id} modelUrl={modelUrl} onReady={onReady} pointer={pointer} />
          <Preload all />
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
