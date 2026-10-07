import * as THREE from 'three';
import type { Patty } from './engine/burger';

export const grillPositions: [number, number][] = [[-3.22, -1.1], [.08, -1.1], [-3.22, 1.12], [.08, 1.12]];
export const platePositions: [number, number][] = [[3.52, -1.25], [5.18, -1.25], [3.52, 1.2], [5.18, 1.2]];
export const grillHeight = 1.04;
export const plateHeight = .53;

const paints = new Map<string, THREE.MeshStandardMaterial>();
function paint(color: string, roughness = .82, metalness = 0) {
  const key = `${color}/${roughness}/${metalness}`;
  if (!paints.has(key)) paints.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.DoubleSide }));
  return paints.get(key)!;
}
function mesh(geometry: THREE.BufferGeometry, color: string, roughness?: number, metalness?: number) {
  const object = new THREE.Mesh(geometry, paint(color, roughness, metalness));
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}
function box(parent: THREE.Group, size: [number, number, number], position: [number, number, number], color: string, roughness?: number, metalness?: number) {
  const object = mesh(new THREE.BoxGeometry(...size), color, roughness, metalness);
  object.position.set(...position); parent.add(object); return object;
}
function slab(parent: THREE.Group, width: number, depth: number, height: number, radius: number, color: string, x: number, y: number, z: number, roughness?: number, metalness?: number) {
  const shape = new THREE.Shape();
  const left = -width / 2, top = -depth / 2, right = width / 2, bottom = depth / 2;
  shape.moveTo(left + radius, top);
  shape.lineTo(right - radius, top); shape.quadraticCurveTo(right, top, right, top + radius);
  shape.lineTo(right, bottom - radius); shape.quadraticCurveTo(right, bottom, right - radius, bottom);
  shape.lineTo(left + radius, bottom); shape.quadraticCurveTo(left, bottom, left, bottom - radius);
  shape.lineTo(left, top + radius); shape.quadraticCurveTo(left, top, left + radius, top);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 2, curveSegments: 5 });
  geometry.rotateX(-Math.PI / 2);
  const object = mesh(geometry, color, roughness, metalness);
  object.position.set(x, y, z); parent.add(object); return object;
}
function cylinder(parent: THREE.Group, radius: number, height: number, color: string, x = 0, y = 0, z = 0, segments = 40) {
  const object = mesh(new THREE.CylinderGeometry(radius, radius, height, segments), color);
  object.position.set(x, y, z); parent.add(object); return object;
}
function torus(parent: THREE.Group, radius: number, tube: number, color: string, y: number, x = 0, z = 0) {
  const object = mesh(new THREE.TorusGeometry(radius, tube, 8, 48), color);
  object.rotation.x = -Math.PI / 2; object.position.set(x, y, z); parent.add(object); return object;
}
function path(parent: THREE.Group, points: THREE.Vector3[], radius: number, color: string) {
  const object = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, radius, 6, false), color);
  object.castShadow = false; parent.add(object); return object;
}

export function makeStation(view: 'grill' | 'plates' = 'grill') {
  const group = new THREE.Group();
  const platesOnly = view === 'plates';
  const boardWidth = platesOnly ? 6.35 : 12.8;
  const boardX = platesOnly ? 4.35 : 0;
  slab(group, boardWidth, 7.25, .22, .26, '#3b312c', boardX, -.18, 0);
  slab(group, boardWidth - .1, 7.14, .17, .23, '#79563d', boardX, .04, 0);
  for (const z of [-3.1, 3.16]) box(group, [boardWidth - .7, .009, .024], [boardX, .235, z], '#63452f');

  if (!platesOnly) {
    slab(group, 8.55, 5.77, .49, .32, '#28312f', -1.56, .24, .04, .56, .28);
    slab(group, 8.36, 5.55, .09, .29, '#a0aaa0', -1.56, .73, -.04, .42, .62);
    slab(group, 7.86, 5.07, .04, .22, '#202624', -1.56, .84, -.04);
    slab(group, 8.2, .52, .12, .10, '#46514b', -1.56, .76, 2.72, .58, .25);
    for (let i = 0; i < 15; i++) {
      const z = -2.33 + i * .326;
      box(group, [7.75, .11, .16], [-1.56, .98, z + .035], '#151d1b', .75, .13);
      const rail = box(group, [7.75, .105, .12], [-1.56, 1.06, z], '#737f77', .45, .55);
      rail.castShadow = false;
      box(group, [7.65, .011, .016], [-1.56, 1.116, z - .039], '#aab5aa', .45, .35).castShadow = false;
    }
    cylinder(group, .13, .095, '#a9b6a9', 2.02, .91, 2.73);
    cylinder(group, .083, .10, '#2b3832', 2.02, .975, 2.73);
    for (const x of [1.26, 1.52]) cylinder(group, .038, .015, x === 1.26 ? '#ca8050' : '#d5a86a', x, .9, 2.75);
  }

  for (const [x, z] of platePositions) {
    const profile = [[0, 0], [.55, 0], [.67, .065], [.8, .16], [.81, .22], [.72, .22], [.60, .14], [0, .14]];
    const ceramic = mesh(new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), 48), '#d1d7c8', .47);
    ceramic.position.set(x, .25, z); group.add(ceramic);
    cylinder(group, .6, .006, '#f0ebda', x, .397, z);
    torus(group, .73, .025, '#f4efde', .47, x, z);
  }
  return group;
}

function pattyGeometry() {
  const positions: number[] = [0, .235, 0], indices: number[] = [];
  const rings = [[.36, .233], [.72, .192], [.94, .125], [1, .057], [.98, .012]];
  const count = 48;
  for (const [r, h] of rings) for (let i = 0; i < count; i++) {
    const a = i * 2 * Math.PI / count;
    const wobble = 1 + .019 * Math.sin(a * 5 + .7) + .013 * Math.cos(a * 9);
    positions.push(Math.cos(a) * r * wobble, h, Math.sin(a) * r * wobble);
  }
  for (let i = 0; i < count; i++) indices.push(0, 1 + (i + 1) % count, 1 + i);
  for (let row = 0; row < rings.length - 1; row++) for (let i = 0; i < count; i++) {
    const p = 1 + row * count + i, next = 1 + row * count + (i + 1) % count;
    const q = p + count, after = next + count;
    indices.push(p, next, q, next, after, q);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function makePatty(patty: Patty, size = 1) {
  const group = new THREE.Group();
  const heat = patty.ticks[patty.side];
  const base = patty.kind === 'veggie' ? ['#82906a', '#898664', '#767354', '#595743', '#393a32'][Math.min(heat, 4)] : ['#a96d64', '#9b694e', '#855737', '#70452e', '#382e27'][Math.min(heat, 4)];
  const body = mesh(pattyGeometry(), base, .92);
  group.add(body);
  const dark = patty.kind === 'veggie' ? '#53664a' : heat ? '#523828' : '#9e655d';
  for (let i = 0; i < (patty.kind === 'veggie' ? 15 : 9); i++) {
    const angle = i * 2.399 + .3, r = .23 + (i * 7 % 11) / 18;
    const dot = mesh(new THREE.SphereGeometry(i % 3 === 0 ? .055 : .032, 7, 5), i % 4 === 0 ? patty.kind === 'veggie' ? '#c6a878' : '#d2a085' : dark);
    dot.scale.set(1.2, .16, .65);
    dot.position.set(Math.cos(angle) * r, .248 - .10 * r * r, Math.sin(angle) * r);
    dot.rotation.y = angle; dot.castShadow = false; group.add(dot);
  }
  if (heat) for (const z of [-.34, 0, .34]) {
    path(group, [-.65, -.35, 0, .35, .65].map((x) => new THREE.Vector3(x, .248 - .11 * (x * x + z * z), z + .05 * Math.sin(x * 3))), .020 + heat * .003, heat >= 3 ? '#322b24' : patty.kind === 'veggie' ? '#484a35' : '#5e362a');
  }
  group.scale.setScalar(size);
  return group;
}

function bun(top: boolean) {
  const group = new THREE.Group();
  const outline: [number, number][] = top
    ? [[0, 0], [.58, 0], [.68, .045], [.70, .12], [.63, .23], [.49, .33], [.27, .405], [0, .43]]
    : [[0, 0], [.55, 0], [.65, .045], [.68, .12], [.64, .18], [.52, .21], [0, .21]];
  group.add(mesh(new THREE.LatheGeometry(outline.map(([r, h]) => new THREE.Vector2(r, h)), 48), top ? '#d59a57' : '#bf8047', .8));
  torus(group, top ? .64 : .62, .023, top ? '#a46738' : '#945f36', top ? .068 : .14);
  if (!top) cylinder(group, .51, .01, '#e3b071', 0, .21);
  if (top) {
    const seeds = [[-.34,-.13],[-.14,-.31],[.18,-.31],[.39,-.08],[-.32,.22],[.02,.11],[.31,.27],[-.07,.36]];
    for (const [x, z] of seeds) {
      const seed = mesh(new THREE.SphereGeometry(.037, 8, 6), '#f9e4b0', .8);
      const r2 = x * x + z * z;
      seed.scale.set(1.35, .22, .58); seed.rotation.y = -.5;
      seed.position.set(x, .43 - .24 * r2 / .49, z); seed.castShadow = false; group.add(seed);
    }
  }
  return group;
}

function topping(layer: string, index: number) {
  const group = new THREE.Group();
  const shift = index % 2 ? .055 : -.055;
  switch (layer) {
    case 'bottom bun': group.add(bun(false)); return { group, height: .21 };
    case 'top bun': group.add(bun(true)); return { group, height: .43 };
    case 'cheese': {
      const shape = new THREE.Shape();
      shape.moveTo(-.61, -.58); shape.lineTo(.56, -.64); shape.lineTo(.63, .52); shape.lineTo(.37, .60); shape.lineTo(-.59, .59); shape.closePath();
      const sheet = mesh(new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: false }), '#e9bd5e');
      sheet.rotation.x = -Math.PI / 2; sheet.position.y = .045; sheet.rotation.y = .13; group.add(sheet);
      return { group, height: .075 };
    }
    case 'lettuce': {
      const shape = new THREE.Shape();
      for (let i = 0; i <= 44; i++) {
        const a = 2 * Math.PI * i / 44;
        const r = .66 + .075 * Math.sin(i * 1.9 + .3) + .025 * Math.sin(i * .6);
        if (!i) shape.moveTo(r, 0); else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const leaf = mesh(new THREE.ShapeGeometry(shape), '#729556');
      leaf.rotation.x = -Math.PI / 2; leaf.position.y = .045;
      leaf.castShadow = true; group.add(leaf);
      for (const x of [-.32, .18]) path(group, [new THREE.Vector3(x, .058, -.33), new THREE.Vector3(x + .05, .07, 0), new THREE.Vector3(x + .13, .058, .38)], .011, '#a8ba76');
      return { group, height: .075 };
    }
    case 'tomato': {
      for (const x of [-.21, .21]) { cylinder(group, .47, .075, '#bf5a49', x, .055, shift); torus(group, .36, .019, '#e38b6d', .098, x, shift); }
      return { group, height: .105 };
    }
    case 'onion': {
      torus(group, .44, .045, '#b4a0b9', .07, -.12, shift);
      torus(group, .34, .035, '#dac9d3', .105, .16, -shift);
      return { group, height: .12 };
    }
    case 'pickle': case 'jalapeno': {
      for (const [x,z] of [[-.33,-.26],[.32,-.24],[-.13,.3],[.4,.23]]) {
        const disc = cylinder(group, layer === 'pickle' ? .16 : .15, .045, layer === 'pickle' ? '#7f9754' : '#527b4b', x, .055, z);
        disc.scale.z = .72;
        if (layer === 'jalapeno') torus(group, .075, .022, '#b7ca8d', .085, x, z);
      }
      return { group, height: .09 };
    }
    case 'bacon': {
      for (const x of [-.22, .18]) {
        path(group, [-.6,-.3,0,.3,.6].map((z, i) => new THREE.Vector3(x + .12 * Math.sin(i * 2), .065 + .035 * (i % 2), z)), .075, '#a8503f');
        path(group, [-.55,-.25,.05,.3,.55].map((z, i) => new THREE.Vector3(x + .11 * Math.sin(i * 2) - .026, .13 + .035 * (i % 2), z)), .014, '#d88b65');
      }
      return { group, height: .17 };
    }
    case 'mushroom': {
      for (const [x,z] of [[-.33,-.27],[.28,-.23],[-.16,.28],[.36,.26]]) {
        const cap = mesh(new THREE.SphereGeometry(.21, 14, 8), '#b49979');
        cap.scale.set(1, .35, .8); cap.position.set(x, .07, z); group.add(cap);
      }
      return { group, height: .13 };
    }
    case 'avocado': {
      for (const x of [-.35,-.12,.13,.37]) {
        const slice = mesh(new THREE.SphereGeometry(.28, 16, 10), '#abc17d');
        slice.scale.set(.56, .22, 1.18); slice.position.set(x, .07, -.04 + .10 * x); slice.rotation.y = -.2; group.add(slice);
      }
      return { group, height: .13 };
    }
    case 'ketchup': case 'mustard': case 'mayo': {
      const color = layer === 'ketchup' ? '#b55143' : layer === 'mustard' ? '#cfa556' : '#efe1c3';
      path(group, Array.from({ length: 15 }, (_, i) => {
        const a = i * Math.PI * 1.7 / 14;
        const r = .56 - i * .028;
        return new THREE.Vector3(Math.cos(a) * r, .065, Math.sin(a) * r);
      }), .029, color);
      return { group, height: .075 };
    }
    default: return { group, height: 0 };
  }
}

export function makeBurger(stack: string[], patty: Patty | null) {
  const group = new THREE.Group();
  let height = 0;
  stack.forEach((layer, index) => {
    const model = layer === 'patty' && patty ? { group: makePatty({ ...patty, side: patty.ticks[0] >= patty.ticks[1] ? 0 : 1 }, .65), height: .16 } : topping(layer, index);
    model.group.position.y = height;
    group.add(model.group);
    height += model.height;
  });
  return group;
}

export function makeSpatula() {
  const group = new THREE.Group();
  slab(group, 1.06, .65, .065, .085, '#a9b4a7', 0, 0, -.33, .34, .7);
  for (const x of [-.25,-.08,.09,.26]) box(group, [.035, .004, .33], [x, .091, -.36], '#64776c', .58, .32).castShadow = false;
  const shaft = box(group, [.09, .08, 1.37], [0, .06, .66], '#a4b1a8', .35, .64);
  shaft.rotation.x = -.09;
  slab(group, .19, .95, .15, .08, '#80513c', 0, .16, 1.74);
  return group;
}

export function makeLabel(number: number, x: number, z: number, y = 1.84) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.beginPath(); context.arc(64, 64, 55, 0, Math.PI * 2);
  context.fillStyle = '#25372c'; context.fill();
  context.strokeStyle = '#f1dba5'; context.lineWidth = 7; context.stroke();
  context.fillStyle = '#fff0c9'; context.font = 'bold 48px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(String(number).padStart(2, '0'), 64, 68);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, toneMapped: false }));
  sprite.position.set(x, y, z); sprite.scale.set(.51, .51, 1);
  sprite.renderOrder = 20;
  return sprite;
}

export function disposeGroup(group: THREE.Object3D) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
    if (object instanceof THREE.Sprite) { object.material.map?.dispose(); object.material.dispose(); }
  });
}
