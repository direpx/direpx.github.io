"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type PointerTarget = {
  x: number;
  y: number;
  inside: boolean;
  canWalk: boolean;
};

const MODEL_URL = "/models/crystal-cub-lowpoly.glb";
const BASE_MODEL_SCALE = 0.74;
const BASE_MODEL_YAW = Math.PI * 0.5;
const FOLLOW_START_DISTANCE = 0.58;
const FOLLOW_STOP_DISTANCE = 0.36;
const HEAD_YAW_LIMIT = 0.38;
const WALK_SPEED = 0.78;
const WALK_STRIDE_SPEED = 12.4;
const BODY_TURN_SPEED = 4.2;
const MOVE_FACING_TOLERANCE = 0.13;

export function CrystalCubScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerTarget>({
    x: 0,
    y: 0,
    inside: false,
    canWalk: false,
  });
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(29, 1, 0.01, 50);
    camera.position.set(1.84, 3.2, 2.62);
    camera.lookAt(0, -0.01, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const outlineEffect = new OutlineEffect(renderer, {
      defaultThickness: 0.0065,
      defaultColor: [0, 0, 0],
      defaultAlpha: 1,
      defaultKeepAlive: true,
    });
    outlineEffect.autoClear = true;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x8f8aa4, 2.25);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 3.7);
    key.position.set(-2.2, 3.6, 4.5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xb7b1ff, 2.2);
    rim.position.set(3.4, 1.4, -2.5);
    scene.add(rim);

    const modelPivot = new THREE.Group();
    scene.add(modelPivot);
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const pointerHit = new THREE.Vector3();
    const movementHit = new THREE.Vector3();
    const desiredPosition = new THREE.Vector3();
    const walkPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.36);

    let modelRoot: THREE.Object3D | null = null;
    let headBone: THREE.Bone | null = null;
    let tailBone: THREE.Bone | null = null;
    let frontLeftLeg: THREE.Bone | null = null;
    let frontRightLeg: THREE.Bone | null = null;
    let backLeftLeg: THREE.Bone | null = null;
    let backRightLeg: THREE.Bone | null = null;
    let leftEye: THREE.Object3D | null = null;
    let rightEye: THREE.Object3D | null = null;
    let leftEyeOpenScaleY = 1;
    let rightEyeOpenScaleY = 1;
    let nextBlinkAt = performance.now() / 1000 + 2.2;
    let blinkStartedAt = -10;
    let frame = 0;
    let currentHeadX = 0;
    let currentHeadY = 0;
    let currentYaw = BASE_MODEL_YAW;
    let walkBlend = 0;
    let followIntent = false;
    let previousFrameTime = performance.now() / 1000;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        modelRoot = gltf.scene;
        headBone = gltf.scene.getObjectByName("Head") as THREE.Bone | null;
        tailBone = gltf.scene.getObjectByName("Tail") as THREE.Bone | null;
        frontLeftLeg = gltf.scene.getObjectByName("FrontLeg_L") as THREE.Bone | null;
        frontRightLeg = gltf.scene.getObjectByName("FrontLeg_R") as THREE.Bone | null;
        backLeftLeg = gltf.scene.getObjectByName("BackLeg_L") as THREE.Bone | null;
        backRightLeg = gltf.scene.getObjectByName("BackLeg_R") as THREE.Bone | null;
        leftEye = gltf.scene.getObjectByName("Eye_L") ?? null;
        rightEye = gltf.scene.getObjectByName("Eye_R") ?? null;
        leftEyeOpenScaleY = leftEye?.scale.y ?? 1;
        rightEyeOpenScaleY = rightEye?.scale.y ?? 1;

        gltf.scene.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.frustumCulled = false;
          const hasVertexColors = Boolean(child.geometry.getAttribute("color"));
          if (hasVertexColors) {
            const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
            sourceMaterials.forEach((material) => material.dispose());
            child.material = new THREE.MeshBasicMaterial({
              vertexColors: true,
              side: THREE.DoubleSide,
              toneMapped: false,
            });
            return;
          }
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((sourceMaterial) => {
            if (!(sourceMaterial instanceof THREE.MeshStandardMaterial)) return;
            sourceMaterial.flatShading = true;
            sourceMaterial.side = THREE.DoubleSide;
            sourceMaterial.needsUpdate = true;
          });
        });

        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const center = bounds.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(center);
        gltf.scene.updateMatrixWorld(true);
        const centeredBounds = new THREE.Box3().setFromObject(gltf.scene);
        walkPlane.constant = -centeredBounds.min.y * BASE_MODEL_SCALE;
        modelPivot.add(gltf.scene);
        modelPivot.scale.setScalar(BASE_MODEL_SCALE);
        modelPivot.rotation.y = BASE_MODEL_YAW;
        setProgress(100);
        setReady(true);
      },
      (event) => {
        if (event.total > 0) setProgress(Math.round((event.loaded / event.total) * 100));
      },
      () => setFailed(true),
    );

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(Math.max(width, 1), Math.max(height, 1), false);
      camera.aspect = Math.max(width, 1) / Math.max(height, 1);
      const compact = camera.aspect < 0.82;
      camera.position.set(compact ? 2.12 : 1.84, compact ? 3.7 : 3.2, compact ? 3.03 : 2.62);
      camera.lookAt(0, -0.01, 0);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const trackPointer = (event: PointerEvent) => {
      const stageRect = mount.getBoundingClientRect();
      if (stageRect.width <= 0 || stageRect.height <= 0) return;
      const localX = event.clientX - stageRect.left;
      const localY = event.clientY - stageRect.top;
      pointerRef.current.x = (localX / stageRect.width) * 2 - 1;
      pointerRef.current.y = (localY / stageRect.height) * 2 - 1;
      pointerRef.current.inside = true;
      pointerRef.current.canWalk =
        localX >= 0 && localX <= stageRect.width && localY >= 0 && localY <= stageRect.height;
      mount.style.setProperty("--pointer-x", `${localX}px`);
      mount.style.setProperty("--pointer-y", `${localY}px`);
    };

    const releasePointer = () => {
      pointerRef.current.inside = false;
      pointerRef.current.canWalk = false;
      followIntent = false;
    };
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("blur", releasePointer);
    document.documentElement.addEventListener("pointerleave", releasePointer);

    const animate = () => {
      const time = performance.now() / 1000;
      const deltaTime = Math.min(Math.max(time - previousFrameTime, 0), 0.05);
      previousFrameTime = time;
      const pointer = pointerRef.current;
      let walking = false;
      let turningInPlace = false;
      let yawError = 0;
      let gazeYaw = currentYaw;

      desiredPosition.copy(modelPivot.position);
      if (pointer.inside) {
        pointerNdc.set(
          THREE.MathUtils.clamp(pointer.x, -2.5, 2.5),
          THREE.MathUtils.clamp(-pointer.y, -1.35, 0.82),
        );
        raycaster.setFromCamera(pointerNdc, camera);

        if (raycaster.ray.intersectPlane(walkPlane, pointerHit)) {
          const gazeDeltaX = pointerHit.x - modelPivot.position.x;
          const gazeDeltaZ = pointerHit.z - modelPivot.position.z;
          const gazeDistance = Math.hypot(gazeDeltaX, gazeDeltaZ);

          if (gazeDistance > 0.01) {
            const gazeDirectionX = gazeDeltaX / gazeDistance;
            const gazeDirectionZ = gazeDeltaZ / gazeDistance;

            if (pointer.canWalk) {
              if (!followIntent && gazeDistance > FOLLOW_START_DISTANCE) followIntent = true;
              if (followIntent && gazeDistance < FOLLOW_STOP_DISTANCE) followIntent = false;
            } else {
              followIntent = false;
            }

            gazeYaw = Math.atan2(gazeDirectionX, gazeDirectionZ);
            yawError = Math.atan2(Math.sin(gazeYaw - currentYaw), Math.cos(gazeYaw - currentYaw));

            if (pointer.canWalk && followIntent) {
              const compactFrame = camera.aspect < 0.82;
              const safeNdcX = compactFrame ? 0.54 : 0.68;
              // Keep the silhouette inside the frame, but let its feet reach the
              // frame's visual bottom instead of stopping around its upper third.
              const safeNdcBottom = compactFrame ? -0.5 : -0.54;
              const safeNdcTop = compactFrame ? 0.4 : 0.46;
              pointerNdc.set(
                THREE.MathUtils.clamp(pointer.x, -safeNdcX, safeNdcX),
                THREE.MathUtils.clamp(-pointer.y, safeNdcBottom, safeNdcTop),
              );
              raycaster.setFromCamera(pointerNdc, camera);

              if (raycaster.ray.intersectPlane(walkPlane, movementHit)) {
                desiredPosition.set(
                  movementHit.x - gazeDirectionX * FOLLOW_STOP_DISTANCE,
                  0,
                  movementHit.z - gazeDirectionZ * FOLLOW_STOP_DISTANCE,
                );
              }
            }
          }
        }
      } else {
        followIntent = false;
      }

      const moveDeltaX = desiredPosition.x - modelPivot.position.x;
      const moveDeltaZ = desiredPosition.z - modelPivot.position.z;
      const moveDistance = Math.hypot(moveDeltaX, moveDeltaZ);

      if (pointer.canWalk && followIntent && moveDistance > 0.012) {
        if (Math.abs(yawError) > MOVE_FACING_TOLERANCE) {
          turningInPlace = true;
          const maxTurn = (reducedMotion.matches ? 0.56 : BODY_TURN_SPEED) * deltaTime;
          currentYaw += THREE.MathUtils.clamp(yawError, -maxTurn, maxTurn);
          yawError = Math.atan2(Math.sin(gazeYaw - currentYaw), Math.cos(gazeYaw - currentYaw));
        } else {
          walking = true;
          const step = Math.min(moveDistance, (reducedMotion.matches ? 0.26 : WALK_SPEED) * deltaTime);
          modelPivot.position.x += (moveDeltaX / moveDistance) * step;
          modelPivot.position.z += (moveDeltaZ / moveDistance) * step;
        }
      }

      const headEase = 1 - Math.exp(-deltaTime * (reducedMotion.matches ? 6 : 8.5));
      currentHeadY += (THREE.MathUtils.clamp(yawError * 0.8, -HEAD_YAW_LIMIT, HEAD_YAW_LIMIT) - currentHeadY) * headEase;
      currentHeadX += ((pointer.inside ? THREE.MathUtils.clamp(pointer.y * 0.065, -0.16, 0.16) : 0) - currentHeadX) * headEase;

      if (headBone) {
        headBone.rotation.y = currentHeadY;
        headBone.rotation.x = currentHeadX;
        headBone.rotation.z = -currentHeadY * 0.09;
      }
      if (tailBone) {
        const wagSpeed = walkBlend > 0.05 ? 5.4 : 2.25;
        const idleWag = reducedMotion.matches ? 0 : Math.sin(time * wagSpeed) * (0.065 + walkBlend * 0.035);
        tailBone.rotation.y = idleWag;
        tailBone.rotation.x = reducedMotion.matches ? 0 : Math.sin(time * 1.6 + 0.8) * 0.025;
      }

      const walkTarget = !reducedMotion.matches ? (walking ? 1 : turningInPlace ? 0.55 : 0) : 0;
      walkBlend += (walkTarget - walkBlend) * (walkTarget > walkBlend ? 0.2 : 0.11);

      if (!reducedMotion.matches && time >= nextBlinkAt && time - blinkStartedAt > 0.22) {
        blinkStartedAt = time;
        nextBlinkAt = time + 3.1 + Math.random() * 2.4;
      }
      const blinkAge = time - blinkStartedAt;
      const blinkAmount = blinkAge >= 0 && blinkAge < 0.19
        ? Math.sin((blinkAge / 0.19) * Math.PI) ** 1.65
        : 0;
      const eyeHeight = 1 - blinkAmount * 0.94;
      if (leftEye) leftEye.scale.y = leftEyeOpenScaleY * eyeHeight;
      if (rightEye) rightEye.scale.y = rightEyeOpenScaleY * eyeHeight;

      const stride = Math.sin(time * WALK_STRIDE_SPEED) * 0.27 * walkBlend;
      if (frontLeftLeg) frontLeftLeg.rotation.x = stride;
      if (frontRightLeg) frontRightLeg.rotation.x = -stride;
      if (backLeftLeg) backLeftLeg.rotation.x = -stride;
      if (backRightLeg) backRightLeg.rotation.x = stride;
      modelPivot.rotation.y = currentYaw;
      modelPivot.rotation.x = 0;
      modelPivot.rotation.z = 0;
      modelPivot.position.y = 0;
      modelPivot.scale.setScalar(BASE_MODEL_SCALE);

      outlineEffect.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("blur", releasePointer);
      document.documentElement.removeEventListener("pointerleave", releasePointer);
      renderer.dispose();
      if (modelRoot) {
        modelRoot.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.geometry.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material.dispose());
        });
      }
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`model-stage ${ready ? "is-ready" : ""}`}
      role="img"
      aria-label="마우스 커서를 따라 걸어가고 눈을 깜빡이는 흰색 도마뱀 3D 모델"
    >
      <div className="pointer-aura" aria-hidden="true" />
      {!ready && !failed && (
        <div className="loading-state" aria-live="polite">
          <span>MODEL LOADING</span>
          <div className="loading-track">
            <i style={{ width: `${Math.max(progress, 8)}%` }} />
          </div>
        </div>
      )}
      {failed && <p className="error-state">모델을 불러오지 못했습니다.</p>}
    </div>
  );
}
