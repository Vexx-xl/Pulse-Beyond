import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export interface StationControls {
  reset: () => void;
  zoom: (factor: number) => void;
  rotate: (radians: number) => void;
  dispose: () => void;
}

/** On-demand renderer. No animation loop, remote textures, analytics or telemetry. */
export async function mountStation(
  host: HTMLElement,
  signal: AbortSignal,
  onContextLost: () => void,
): Promise<StationControls> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-label", "Rotatable NASA reference model of the International Space Station exterior");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 150);
  const orbit = new OrbitControls(camera, canvas);
  orbit.enablePan = false;
  orbit.enableDamping = false;
  orbit.minDistance = 7;
  orbit.maxDistance = 40;
  const decoder = new DRACOLoader();
  decoder.setDecoderPath({
    js: `${import.meta.env.BASE_URL}nasa/draco/draco_wasm_wrapper.js`,
    wasm: `${import.meta.env.BASE_URL}nasa/draco/draco_decoder.wasm`,
  });
  decoder.setWorkerLimit(1);
  const loader = new GLTFLoader().setDRACOLoader(decoder);
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(7, 10, 8);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x56688a, 3), light);
  const fill = new THREE.DirectionalLight(0xadefff, 1.8);
  fill.position.set(-7, 0, -6);
  scene.add(fill);
  let disposed = false;
  const render = () => { if (!disposed) renderer.render(scene, camera); };
  const resize = () => {
    if (disposed) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  };
  const reset = () => {
    const distance = 15 * Math.max(1, 1 / camera.aspect);
    camera.position.set(0.75, 0.9, 1.2).normalize().multiplyScalar(distance);
    orbit.target.set(0, 0, 0);
    orbit.update();
    render();
  };
  const observer = new ResizeObserver(resize);
  const disposeObject = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.dispose();
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      }
    });
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    orbit.dispose();
    decoder.dispose();
    disposeObject(scene);
    canvas.removeEventListener("webglcontextlost", contextLost);
    signal.removeEventListener("abort", dispose);
    renderer.dispose();
    canvas.remove();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  signal.addEventListener("abort", dispose, { once: true });
  orbit.addEventListener("change", render);
  observer.observe(host);
  resize();
  reset();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}nasa/iss-a.glb`, { signal });
    if (!response.ok) throw new Error("Station reference unavailable");
    const bytes = await response.arrayBuffer();
    const gltf = await loader.parseAsync(bytes, `${import.meta.env.BASE_URL}nasa/`);
    if (signal.aborted || disposed) {
      disposeObject(gltf.scene);
      throw new DOMException("Station viewer closed", "AbortError");
    }
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 8 / Math.max(size.x, size.y, size.z);
    gltf.scene.position.sub(center);
    const group = new THREE.Group();
    group.add(gltf.scene);
    group.scale.setScalar(scale);
    scene.add(group);
    render();
    return {
      reset,
      zoom: (factor) => {
        camera.position.multiplyScalar(factor).clampLength(orbit.minDistance, orbit.maxDistance);
        orbit.update();
        render();
      },
      rotate: (radians) => {
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), radians);
        orbit.update();
        render();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
