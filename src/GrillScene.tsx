import type { Patty } from './engine/burger';
import type { KitchenState, KitchenAction } from './engine/kitchen';

const bars = Array.from({ length: 14 }, (_, i) => 119 + i * 31);
const grillPositions = [[-165, -90], [165, -90], [-165, 115], [165, 115]];
const platePositions = [[940, 200], [1110, 200], [940, 435], [1110, 435]];
const sesame = [[-50,-29],[-19,-54],[23,-43],[53,-23],[-39,12],[6,4],[42,22],[-4,42]];

function StackedBurger({ stack, x, y }: { stack: string[]; x: number; y: number }) {
  return <g transform={`translate(${x} ${y}) scale(.46)`} filter="url(#foodShadow)">
    {stack.map((layer, index) => <g key={index} className="layer-drop">
      {layer === 'bottom bun' && <g><circle r="105" fill="#bd8049" stroke="#88572f" strokeWidth="5"/><circle r="88" fill="#e3b374"/></g>}
      {layer === 'patty' && <g><circle r="91" fill="#775039" stroke="#4d3428" strokeWidth="7"/><path d="M-60 -25 Q-5 -48 56 -28 M-59 15 Q0 -8 63 10" fill="none" stroke="#493024" strokeOpacity=".65" strokeWidth="7" strokeLinecap="round"/></g>}
      {layer === 'cheese' && <path d="M-88 -72 L89 -69 L96 83 L42 65 L-61 90 L-93 31Z" fill="#e5bc5d" stroke="#ad813b" strokeWidth="4"/>}
      {layer === 'lettuce' && <path d="M-99 -24 Q-113 -73 -65 -78 Q-41 -111 -9 -86 Q27 -108 55 -78 Q105 -84 99 -34 Q121 -1 93 22 Q110 68 63 74 Q34 106 0 81 Q-31 104 -59 71 Q-111 78 -97 29 Q-121 -2 -99 -24Z" fill="#82a36a" stroke="#52754b" strokeWidth="5"/>}
      {layer === 'tomato' && <g><circle r="80" fill="#c96954" stroke="#995242" strokeWidth="5"/><path d="M-45 -36 Q0 -58 45 -35" fill="none" stroke="#e39a77" strokeWidth="5" opacity=".7" strokeLinecap="round"/></g>}
      {layer === 'onion' && <g><circle r="77" fill="none" stroke="#a98ba4" strokeWidth="16"/><circle r="52" fill="none" stroke="#d3b8c9" strokeWidth="10"/></g>}
      {layer === 'pickle' && <g>{[[-36,-28],[30,-36],[-20,34],[46,28]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="28" ry="18" transform={`rotate(${i*27} ${x} ${y})`} fill="#819459" stroke="#536c40" strokeWidth="4"/>)}</g>}
      {layer === 'bacon' && <g>{[-33,12,55].map((x)=><path key={x} d={`M${x-13} -76 Q${x+15} -45 ${x-10} -13 Q${x+15} 20 ${x-13} 77 L${x+5} 75 Q${x+32} 20 ${x+10} -12 Q${x+32} -46 ${x+5} -77Z`} fill="#a75c48" stroke="#714235" strokeWidth="3"/>)}</g>}
      {layer === 'mushroom' && <g>{[[-40,-32],[32,-38],[-23,37],[45,30]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="25" ry="17" fill="#ad8c70" stroke="#745d49" strokeWidth="3"/>)}</g>}
      {layer === 'jalapeno' && <g>{[[-44,-37],[36,-30],[-23,36],[46,36]].map(([x,y],i)=><g key={i}><ellipse cx={x} cy={y} rx="24" ry="16" fill="#668957" stroke="#456b42" strokeWidth="4"/><ellipse cx={x} cy={y} rx="10" ry="6" fill="#b3c78b"/></g>)}</g>}
      {layer === 'avocado' && <g>{[-50,-18,15,46].map((x,i)=><path key={i} d={`M${x-25} -49 Q${x+11} -73 ${x+25} -40 Q${x+34} 6 ${x+18} 54 Q${x} 75 ${x-17} 55 Q${x-30} 9 ${x-25} -49Z`} fill="#afc37c" stroke="#718c58" strokeWidth="4"/>)}</g>}
      {['ketchup','mustard','mayo'].includes(layer) && <path d="M-62 -44 Q-12 -82 51 -45 Q86 -4 52 43 Q4 76 -54 47 Q-82 5 -62 -44Z" fill="none" stroke={layer === 'ketchup' ? '#b85b4b' : layer === 'mustard' ? '#c39a53' : '#ded6bb'} strokeWidth="10" strokeDasharray="36 14" strokeLinecap="round"/>}
      {layer === 'top bun' && <g><circle r="88" fill="#d49a58" stroke="#956237" strokeWidth="6"/><path d="M-60 -31 Q-37 -58 0 -64" fill="none" stroke="#efc48b" strokeWidth="7" strokeLinecap="round"/>{sesame.map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="7" ry="3" transform={`rotate(-28 ${x} ${y})`} fill="#f7e3b1"/>)}</g>}
    </g>)}
  </g>;
}

function pattyColors(patty: Patty): [string, string, string] {
  const heat = patty.ticks[patty.side];
  if (heat > 3) return ['#5e4840', '#514036', '#40332c'];
  if (patty.kind === 'veggie') return heat === 0 ? ['#a4aa7e', '#929c70', '#78865d'] : heat === 1 ? ['#9b9a6b', '#8a8d61', '#70764f'] : ['#89885b', '#797951', '#606443'];
  return heat === 0 ? ['#d89b91', '#ca877f', '#b8726c'] : heat === 1 ? ['#bd876c', '#ad775e', '#925f49'] : heat === 2 ? ['#a7744e', '#956542', '#805237'] : ['#956544', '#82593c', '#6a4833'];
}

function PattyGradient({ patty, id }: { patty: Patty; id: string }) {
  const [light, middle, edge] = pattyColors(patty);
  return <radialGradient id={id} cx=".38" cy=".3"><stop stopColor={light}/><stop offset=".7" stopColor={middle}/><stop offset="1" stopColor={edge}/></radialGradient>;
}

function PattyArt({ patty, gradient, className }: { patty: Patty; gradient: string; className?: string }) {
  const heat = patty.ticks[patty.side];
  return <g className={className} filter="url(#foodShadow)">
    <path d="M341 226 Q359 200 395 198 Q420 183 449 197 Q492 181 524 208 Q554 209 569 243 Q593 263 572 298 Q579 329 550 357 Q518 376 493 370 Q456 387 421 369 Q386 379 354 346 Q326 332 326 302 Q306 264 341 226Z" fill={`url(#${gradient})`} stroke={heat ? '#694632' : patty.kind === 'veggie' ? '#777657' : '#a26961'} strokeWidth="7"/>
    <path d="M355 262 Q381 228 418 225" stroke="#eac098" strokeWidth="5" fill="none" opacity={heat ? '.3' : '.35'} strokeLinecap="round"/>
    {heat > 0 && <g fill="none" stroke="#684733" strokeWidth="7" strokeLinecap="round" opacity={Math.min(.2 + heat * .14, .58)}><path d="M378 257 Q453 278 540 250 M365 291 Q452 313 554 290 M386 328 Q452 346 525 323"/></g>}
    {heat >= 2 && <g fill="#3e291d" opacity=".3"><ellipse cx="410" cy="237" rx="10" ry="4"/><ellipse cx="513" cy="308" rx="13" ry="5"/><ellipse cx="459" cy="340" rx="8" ry="3"/></g>}
    {patty.kind === 'veggie' && <g fill="#5b7650" opacity=".75"><ellipse cx="389" cy="283" rx="9" ry="4" transform="rotate(-25 389 283)"/><ellipse cx="453" cy="237" rx="8" ry="4" transform="rotate(30 453 237)"/><ellipse cx="518" cy="273" rx="10" ry="4" transform="rotate(20 518 273)"/><ellipse cx="419" cy="335" rx="8" ry="4" transform="rotate(-22 419 335)"/><ellipse cx="495" cy="325" rx="9" ry="4" transform="rotate(-35 495 325)"/></g>}
  </g>;
}

export function GrillScene({ kitchen, motion, ids }: { kitchen: KitchenState; motion: { action: KitchenAction; id: number; previousPatty: Patty | null } | null; ids: (number | null)[] }) {
  return <svg className="grill-art" viewBox="0 0 1200 650" role="img" aria-label={`Grill with ${kitchen.slots.filter((state) => state.patty?.onGrill).length} patties; ${kitchen.slots.map((state, slot) => `burger ${slot + 1}: ${state.stack.join(', ') || 'empty plate'}`).join('; ')}`}>
    <defs>
      {kitchen.slots.flatMap((state, slot) => [state.patty && <PattyGradient key={`current-${slot}`} id={`grill-meat-${slot}`} patty={state.patty}/>, motion?.action.type === 'slot' && motion.action.slot === slot && motion.previousPatty && <PattyGradient key={`previous-${slot}`} id={`grill-meat-previous-${slot}`} patty={motion.previousPatty}/>])}
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dy="7" dx="3"/><feComponentTransfer><feFuncA type="linear" slope=".4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="foodShadow" x="-50%" y="-50%" width="200%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dy="5" dx="2"/><feComponentTransfer><feFuncA type="linear" slope=".4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <clipPath id="grillClip"><rect x="78" y="83" width="738" height="452" rx="13"/></clipPath>
    </defs>
    <rect width="1200" height="650" fill="#745943"/>
    <path d="M0 27 H1200 M0 615 H1200" stroke="#3f3027" strokeOpacity=".25" strokeWidth="5" fill="none"/>
    <g filter="url(#shadow)"><rect x="36" y="43" width="822" height="540" rx="35" fill="#46534a" stroke="#3d4a41" strokeWidth="12"/><rect x="43" y="49" width="808" height="491" rx="28" fill="#aab5a5" stroke="#c8cebb" strokeWidth="5"/><rect x="74" y="79" width="745" height="460" rx="15" fill="#252d28" stroke="#536157" strokeWidth="9"/>
      <g clipPath="url(#grillClip)">{bars.map((y, i) => <g key={y}><rect x="66" y={y+5} width="764" height="15" rx="5" fill="#141d19"/><rect x="66" y={y} width="764" height="12" rx="4" fill="#69786d"/><path d={`M80 ${y+2} H804`} stroke="#bcc7b4" strokeWidth="2" opacity={i % 3 === 0 ? '.4' : '.2'}/></g>)}</g><rect x="52" y="540" width="792" height="33" rx="8" fill="#46554b"/><path d="M70 552 H825" stroke="#b7c1ab" strokeOpacity=".3" strokeWidth="2"/><circle cx="789" cy="558" r="18" fill="#2b3c31" stroke="#aab6a5" strokeWidth="5"/><path d="M789 541 v11" stroke="#e2dec9" strokeWidth="3" strokeLinecap="round"/><circle cx="705" cy="558" r="5" fill="#c98155"/><circle cx="728" cy="558" r="5" fill="#d9a669"/></g>
    {kitchen.slots.map((state, slot) => {
      const move = motion?.action.type === 'slot' && motion.action.slot === slot ? motion.action.action.type : null;
      const oldPatty = move === 'patty.flip' || move === 'patty.remove' ? motion?.previousPatty : null;
      if (!state.patty?.onGrill && !oldPatty) return null;
      return <g key={`patty-${slot}`} transform={`translate(${grillPositions[slot][0]} ${grillPositions[slot][1]})`}>
        {oldPatty && <PattyArt key={`old-${motion?.id}`} patty={oldPatty} gradient={`grill-meat-previous-${slot}`} className={move === 'patty.flip' ? 'patty-flip-front' : 'patty-lift'}/>}
        {state.patty?.onGrill && <PattyArt key={`current-${state.patty.side}`} patty={state.patty} gradient={`grill-meat-${slot}`} className={move === 'patty.place' ? 'patty-place' : move === 'patty.flip' ? 'patty-flip-back' : undefined}/>}
        {state.patty?.onGrill && state.patty.ticks.some(Boolean) && <g className="steam" aria-hidden="true"><path d="M400 192 Q382 168 400 145 T402 114"/><path d="M510 192 Q488 170 508 145 T506 111"/></g>}
        {state.patty?.onGrill && motion?.action.type === 'grill.wait' && <g key={motion.id} className="sizzle" aria-hidden="true"><path d="M339 228 Q321 243 326 260 M569 244 Q584 264 575 281 M352 353 Q366 370 388 374"/></g>}
      </g>;
    })}
    {ids.map((id, slot) => id !== null && <g key={`grill-number-${slot}`} className="position-number" transform={`translate(${160 + (slot % 2) * 330} ${116 + Math.floor(slot / 2) * 205})`}><circle r="24"/><text>{String(id).padStart(2, '0')}</text></g>)}
    <g className="plate-group">{kitchen.slots.map((state, slot) => <g key={slot}><g filter="url(#foodShadow)"><circle cx={platePositions[slot][0]} cy={platePositions[slot][1]} r="79" fill="#cbd3bf" stroke="#a7b2a1" strokeWidth="4"/><circle cx={platePositions[slot][0]} cy={platePositions[slot][1]} r="64" fill="#f0e9d8" stroke="#aebba7" strokeWidth="3"/></g><StackedBurger stack={state.stack} x={platePositions[slot][0]} y={platePositions[slot][1]}/>{ids[slot] !== null && <g className="position-number plate-number" transform={`translate(${platePositions[slot][0] - 57} ${platePositions[slot][1] - 61})`}><circle r="21"/><text>{String(ids[slot]).padStart(2, '0')}</text></g>}</g>)}</g>
    {motion?.action.type === 'slot' && ['patty.place', 'patty.flip', 'patty.remove'].includes(motion.action.action.type) && <g key={motion.id} transform={`translate(${450 + grillPositions[motion.action.slot][0]} ${285 + grillPositions[motion.action.slot][1]})`}><g className={`spatula spatula-${motion.action.action.type.split('.')[1]}`}><path d="M-46 5 L20 -43 L42 -21 L-23 29Z" fill="#abb8a8" stroke="#53665a" strokeWidth="5"/><path d="M15 23 L90 117" stroke="#9baba3" strokeWidth="11" strokeLinecap="round"/><path d="M75 102 L142 185" stroke="#6c3c26" strokeWidth="18" strokeLinecap="round"/></g></g>}
  </svg>;
}
