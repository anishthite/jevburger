import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Patty } from './engine/burger';
import type { KitchenAction, KitchenState } from './engine/kitchen';
import { GrillScene } from './GrillScene';
import { disposeGroup, grillHeight, grillPositions, makeBurger, makeLabel, makePatty, makeSpatula, makeStation, plateHeight, platePositions } from './KitchenModels';

type Motion = { action: KitchenAction; id: number; previousPatty: Patty | null } | null;
type Props = { kitchen: KitchenState; motion: Motion; ids: (number | null)[]; view?: 'grill' | 'plates' };
type Runtime = { update: (kitchen: KitchenState, motion: Motion, ids: (number | null)[]) => void };

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => 1 - Math.pow(1 - clamp(value), 3);

export function Kitchen3D({ kitchen, motion, ids, view = 'grill' }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const [fallback, setFallback] = useState(false);
  const labels = `Grill with ${kitchen.slots.filter((slot) => slot.patty?.onGrill).length} patties; ${kitchen.slots.map((slot, index) => `burger ${index + 1}: ${slot.stack.join(', ') || 'empty plate'}`).join('; ')}`;

  useEffect(() => {
    if (fallback || !holder.current) return;
    const mount = holder.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor('#604632');
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);
    const onContextLost = (event: Event) => { event.preventDefault(); setFallback(true); };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#493a31');
    scene.add(makeStation(view));
    scene.add(new THREE.HemisphereLight('#fff0d1', '#736453', 1.5));
    const key = new THREE.DirectionalLight('#fff0d8', 2.5);
    key.position.set(-3, 10, 4); key.castShadow = true;
    const shadowSize = view === 'plates' ? 512 : window.matchMedia('(max-width: 640px)').matches ? 1024 : 2048;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    key.shadow.camera.left = -8; key.shadow.camera.right = 8;
    key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
    key.shadow.camera.near = 1; key.shadow.camera.far = 30;
    key.shadow.bias = -.0003; key.shadow.radius = 4;
    scene.add(key);
    const bounce = new THREE.DirectionalLight('#b7c7b7', .4);
    bounce.position.set(6, 5, -4); scene.add(bounce);
    const heatLight = new THREE.PointLight('#ffad65', 0, 5);
    heatLight.position.set(-1.55, 1.2, 0); scene.add(heatLight);

    const camera = new THREE.OrthographicCamera(-7, 7, 4, -4, .1, 50);
    const dynamic = new THREE.Group(); scene.add(dynamic);
    const media = window.matchMedia('(max-width: 640px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let animation: { start: number; action: KitchenAction; old: THREE.Group | null; current: THREE.Group | null; spatula: THREE.Group | null; layer: THREE.Object3D | null; layerY: number; x: number; z: number } | null = null;

    function draw() { renderer.render(scene, camera); }
    function resize() {
      const width = mount.clientWidth, height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const span = view === 'plates' ? 6.3 : media.matches ? 8.95 : 13.6;
      const x = view === 'plates' ? 4.35 : media.matches ? -1.85 : 0;
      const z = view === 'plates' ? -.18 : 0;
      const y = view === 'plates' ? .45 : 0;
      const h = span * height / width;
      camera.left = -span / 2; camera.right = span / 2; camera.top = h / 2; camera.bottom = -h / 2;
      camera.position.set(x, 14 + y, 9 + z);
      camera.lookAt(x, y, z); camera.updateProjectionMatrix(); draw();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    media.addEventListener('change', resize);

    function tick(now: number) {
      if (!animation) return;
      const { start, action, old, current, spatula, layer, layerY, x, z } = animation;
      const t = clamp((now - start) / 840);
      if (action.type === 'grill.wait') heatLight.intensity = .9 * Math.sin(Math.PI * t);
      if (action.type === 'slot') {
        const kind = action.action.type;
        if (layer) layer.position.y = layerY + .35 * (1 - ease(t / .45));
        if (spatula) {
          const arriving = ease(t / .54);
          const leaving = ease((t - .68) / .32);
          spatula.position.set(x, grillHeight + .05 + .2 * (t > .54 ? leaving : 1 - arriving), z + 3.1 * (1 - arriving + leaving));
          spatula.visible = t < 1;
        }
        if (kind === 'patty.place' && current) {
          current.visible = t > .12;
          current.position.set(x, grillHeight + .42 * (1 - ease(t / .72)), z + 3.1 * (1 - ease(t / .54)));
        }
        if (kind === 'patty.flip') {
          if (old) { old.visible = t < .54; old.position.y = grillHeight + .35 * Math.sin(Math.PI * clamp(t / .55)); old.rotation.x = -Math.PI / 2 * ease((t - .25) / .30); }
          if (current) { current.visible = t >= .54; current.position.y = grillHeight + .2 * (1 - ease((t - .54) / .42)); current.rotation.x = Math.PI / 2 * (1 - ease((t - .54) / .40)); }
        }
        if (kind === 'patty.remove' && old) {
          const lift = ease((t - .57) / .43);
          old.position.y = grillHeight + .42 * lift;
          old.position.z = z + 3 * lift;
          old.visible = t < 1;
        }
      }
      draw();
      if (t < 1) frame = requestAnimationFrame(tick);
      else { animation = null; heatLight.intensity = 0; }
    }

    runtime.current = { update(kitchen, motion, ids) {
      cancelAnimationFrame(frame);
      animation = null;
      heatLight.intensity = 0;
      disposeGroup(dynamic); dynamic.clear();
      for (let slot = 0; slot < 4; slot++) {
        const state = kitchen.slots[slot];
        const [x, z] = grillPositions[slot];
        const moved = motion?.action.type === 'slot' && motion.action.slot === slot ? motion.action.action.type : null;
        let current: THREE.Group | null = null, old: THREE.Group | null = null;
        if (view === 'grill' && state.patty?.onGrill) {
          current = makePatty(state.patty);
          current.position.set(x, grillHeight, z); dynamic.add(current);
        }
        if (view === 'grill' && (moved === 'patty.flip' || moved === 'patty.remove') && motion?.previousPatty) {
          old = makePatty(motion.previousPatty);
          old.position.set(x, grillHeight, z); dynamic.add(old);
          if (!reduced.matches) { if (current) current.visible = false; }
          else old.visible = false;
        }
        if (ids[slot] !== null && view !== 'plates') dynamic.add(makeLabel(ids[slot]!, x - 1, z - .35, 1.55));
        const [px, pz] = platePositions[slot];
        const burger = makeBurger(state.stack, state.patty);
        burger.position.set(px, plateHeight, pz); dynamic.add(burger);
        if (ids[slot] !== null) dynamic.add(makeLabel(ids[slot]!, px - .59, pz - .60, 1.15));
        if (view === 'grill' && moved && ['patty.place', 'patty.flip', 'patty.remove'].includes(moved) && !reduced.matches && motion) {
          const spatula = makeSpatula(); dynamic.add(spatula);
          animation = { start: performance.now(), action: motion.action, old, current, spatula, layer: null, layerY: 0, x, z };
        }
        if ((view === 'plates' || !media.matches) && moved && (moved.startsWith('stack.') || moved === 'bun.bottom' || moved === 'bun.top') && !reduced.matches && motion) {
          const layer = burger.children.at(-1)!;
          const layerY = layer.position.y;
          layer.position.y += .35;
          animation = { start: performance.now(), action: motion.action, old: null, current: null, spatula: null, layer, layerY, x: px, z: pz };
        }
      }
      if (view === 'grill' && motion?.action.type === 'grill.wait' && !reduced.matches)
        animation = { start: performance.now(), action: motion.action, old: null, current: null, spatula: null, layer: null, layerY: 0, x: 0, z: 0 };
      if (animation) frame = requestAnimationFrame(tick);
      else draw();
    } };
    resize();
    return () => {
      runtime.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect(); media.removeEventListener('change', resize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      disposeGroup(scene); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [view, fallback]);

  useEffect(() => { runtime.current?.update(kitchen, motion, ids); }, [kitchen, motion, ids.join(','), view, fallback]);

  if (fallback) return <GrillScene kitchen={kitchen} motion={motion} ids={ids}/>;
  return <div ref={holder} className="kitchen-3d" role="img" aria-label={labels}/>;
}
