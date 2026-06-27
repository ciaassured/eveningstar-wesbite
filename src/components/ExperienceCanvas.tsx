import { Environment, Preload, useEnvironment, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { MutableRefObject } from 'react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Box3, type Group, MathUtils, Vector3, VSMShadowMap } from 'three';
import { assetPath } from '../constants';
import {
  MODEL_MOTION,
  MODEL_PATH,
  MODEL_PATH_COMPACT_WIDTH,
  type ModelPathStage,
  type ModelPathVector
} from '../modelPath';
import type { EveningStarVariant } from '../variants';

const environmentUrl = assetPath('hdr/aircraft_workshop_01_1k.hdr');
type ModelPathName = keyof typeof MODEL_PATH;

type ExperienceCanvasProps = {
  onReady: () => void;
  variant: EveningStarVariant;
};

type PointerRef = MutableRefObject<{ x: number; y: number; active: boolean }>;

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll <= 0 ? 0 : MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
}

function getModelPathName(width: number): ModelPathName {
  return width <= MODEL_PATH_COMPACT_WIDTH ? 'compact' : 'desktop';
}

function getModelPathSegment(path: readonly ModelPathStage[], progress: number) {
  const firstStage = path[0];

  if (progress <= firstStage.progress) {
    return { from: firstStage, to: firstStage, amount: 0 };
  }

  for (let index = 1; index < path.length; index += 1) {
    const nextStage = path[index];

    if (progress <= nextStage.progress) {
      const previousStage = path[index - 1];
      const stageDistance = nextStage.progress - previousStage.progress || 1;
      const linearAmount = MathUtils.clamp((progress - previousStage.progress) / stageDistance, 0, 1);

      return {
        from: previousStage,
        to: nextStage,
        amount: MathUtils.smoothstep(linearAmount, 0, 1)
      };
    }
  }

  const lastStage = path[path.length - 1];
  return { from: lastStage, to: lastStage, amount: 0 };
}

function interpolateNumber(from: number, to: number, amount: number) {
  return MathUtils.lerp(from, to, amount);
}

function setInterpolatedVector(target: Vector3, from: ModelPathVector, to: ModelPathVector, amount: number) {
  target.set(
    interpolateNumber(from[0], to[0], amount),
    interpolateNumber(from[1], to[1], amount),
    interpolateNumber(from[2], to[2], amount)
  );
}

function isModelPathDebugEnabled() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugPath');
}

function useNormalizedPointer() {
  const pointer = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
      pointer.current.y = MathUtils.clamp(-(event.clientY / window.innerHeight) * 2 + 1, -1, 1);
      pointer.current.active = true;
    };
    const resetPointer = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
      pointer.current.active = false;
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        resetPointer();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerout', onPointerOut);
    window.addEventListener('blur', resetPointer);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', resetPointer);
    };
  }, []);

  return pointer;
}

function BoardModel({ modelUrl, onReady, pointer }: { modelUrl: string; onReady: () => void; pointer: PointerRef }) {
  const motion = useRef<Group>(null);
  const gltf = useGLTF(modelUrl);
  const { size } = useThree();
  const targetPosition = useRef(new Vector3());
  const smoothedPointer = useRef({ x: 0, y: 0 });

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

  useFrame(({ clock }, delta) => {
    if (!motion.current) {
      return;
    }

    const progress = getScrollProgress();
    const pathName = getModelPathName(size.width);
    const { from, to, amount } = getModelPathSegment(MODEL_PATH[pathName], progress);
    const pointerSmoothing = pointer.current.active
      ? MODEL_MOTION.pointer.smoothing
      : MODEL_MOTION.pointer.returnSmoothing;
    const pointerDamping = 1 - Math.exp(-pointerSmoothing * delta);

    smoothedPointer.current.x = MathUtils.lerp(smoothedPointer.current.x, pointer.current.x, pointerDamping);
    smoothedPointer.current.y = MathUtils.lerp(smoothedPointer.current.y, pointer.current.y, pointerDamping);

    const pointerInfluence = interpolateNumber(from.pointerInfluence, to.pointerInfluence, amount);
    const idleInfluence = interpolateNumber(from.idleInfluence, to.idleInfluence, amount);
    const pointerX = smoothedPointer.current.x * pointerInfluence;
    const pointerY = smoothedPointer.current.y * pointerInfluence;
    const idleTime = clock.elapsedTime * MODEL_MOTION.idle.speed;
    const idleBob =
      (Math.sin(idleTime) * MODEL_MOTION.idle.bobAmount +
        Math.sin(idleTime * 1.73 + 1.8) * MODEL_MOTION.idle.bobJitterAmount +
        Math.sin(idleTime * 2.41 + 0.2) * MODEL_MOTION.idle.bobJitterAmount * 0.5) *
      idleInfluence;
    const idleSide = Math.sin(idleTime * 0.53 + 2.1) * MODEL_MOTION.idle.sideAmount * idleInfluence;
    const idleDepth = Math.sin(idleTime * 0.61 + 0.7) * MODEL_MOTION.idle.depthAmount * idleInfluence;
    const idlePitch = Math.sin(idleTime * 0.67 + 2.7) * MODEL_MOTION.idle.pitchAmount * idleInfluence;
    const idleYaw = Math.sin(idleTime * 0.72 + 0.4) * MODEL_MOTION.idle.yawAmount * idleInfluence;
    const idleRoll =
      (Math.sin(idleTime * 0.9 + 1.2) * MODEL_MOTION.idle.rollAmount +
        Math.sin(idleTime * 1.37 + 0.5) * MODEL_MOTION.idle.rollAmount * 0.35) *
      idleInfluence;

    setInterpolatedVector(targetPosition.current, from.position, to.position, amount);
    targetPosition.current.x += pointerX * MODEL_MOTION.pointer.maxPosition[0] + idleSide;
    targetPosition.current.y += pointerY * MODEL_MOTION.pointer.maxPosition[1] + idleBob;
    targetPosition.current.z += pointerX * MODEL_MOTION.pointer.maxPosition[2] + idleDepth;

    motion.current.position.copy(targetPosition.current);
    motion.current.scale.setScalar(interpolateNumber(from.scale, to.scale, amount));
    motion.current.rotation.set(
      interpolateNumber(from.rotation[0], to.rotation[0], amount) +
        pointerY * MODEL_MOTION.pointer.maxRotation[0] +
        idlePitch,
      interpolateNumber(from.rotation[1], to.rotation[1], amount) +
        pointerX * MODEL_MOTION.pointer.maxRotation[1] +
        idleYaw,
      interpolateNumber(from.rotation[2], to.rotation[2], amount) +
        pointerX * MODEL_MOTION.pointer.maxRotation[2] +
        idleRoll
    );
  });

  return (
    <group ref={motion}>
      <group scale={bounds.scale}>
        <primitive object={scene} position={[-bounds.center.x, -bounds.center.y, -bounds.center.z]} />
      </group>
    </group>
  );
}

function CameraRig() {
  const { camera, size } = useThree();
  const cameraRef = useRef(camera);
  const targetPosition = useRef(new Vector3());

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useFrame(() => {
    const activeCamera = cameraRef.current;
    const progress = getScrollProgress();
    const pathName = getModelPathName(size.width);
    const { from, to, amount } = getModelPathSegment(MODEL_PATH[pathName], progress);

    setInterpolatedVector(targetPosition.current, from.cameraPosition, to.cameraPosition, amount);
    activeCamera.position.copy(targetPosition.current);
    activeCamera.lookAt(0, 0, 0);
  });

  return null;
}

function ModelPathDebugOverlay() {
  const [enabled] = useState(isModelPathDebugEnabled);
  const [debugState, setDebugState] = useState({
    progress: '0.000',
    pathName: 'desktop' as ModelPathName,
    from: 'hero',
    to: 'hero',
    amount: '0.00'
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frame = 0;
    let rafId = 0;

    const update = () => {
      frame += 1;

      if (frame % 6 === 0) {
        const progress = getScrollProgress();
        const pathName = getModelPathName(window.innerWidth);
        const segment = getModelPathSegment(MODEL_PATH[pathName], progress);

        setDebugState({
          progress: progress.toFixed(3),
          pathName,
          from: segment.from.id,
          to: segment.to.id,
          amount: segment.amount.toFixed(2)
        });
      }

      rafId = window.requestAnimationFrame(update);
    };

    rafId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(rafId);
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <aside className="model-path-debug">
      <strong>Model path</strong>
      <span>progress {debugState.progress}</span>
      <span>layout {debugState.pathName}</span>
      <span>
        stage {debugState.from} -&gt; {debugState.to} / {debugState.amount}
      </span>
      <span>edit src/modelPath.ts</span>
    </aside>
  );
}

function EnvironmentLighting() {
  const environment = useEnvironment({ files: environmentUrl });

  if (environment.flipY) {
    // Firefox warns when HDR DataTextures upload with legacy y-flip pixel-store state.
    environment.flipY = false;
    environment.needsUpdate = true;
  }

  return <Environment environmentIntensity={0.7} map={environment} />;
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
        shadows={{ type: VSMShadowMap }}
      >
        <fog attach="fog" args={[variant.fog, 9, 18]} />
        <ambientLight intensity={0.95} />
        <directionalLight castShadow intensity={2.5} position={[4, 5, 5]} />
        <directionalLight intensity={1.2} position={[-5, -2, 4]} color={variant.light} />
        <spotLight angle={0.5} intensity={22} penumbra={0.4} position={[0, 4, 5]} color="#ffffff" />
        <Suspense fallback={null}>
          <EnvironmentLighting />
          <BoardModel key={variant.id} modelUrl={modelUrl} onReady={onReady} pointer={pointer} />
          <Preload all />
        </Suspense>
        <CameraRig />
      </Canvas>
      <ModelPathDebugOverlay />
    </div>
  );
}
