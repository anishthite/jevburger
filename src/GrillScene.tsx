import { doneness } from './engine/burger';
import type { KitchenState, KitchenAction } from './engine/kitchen';

const bars = Array.from({ length: 17 }, (_, i) => 119 + i * 26);
const grillPositions = [[-165, -90], [165, -90], [-165, 115], [165, 115]];
const platePositions = [[900, 210], [1070, 210], [900, 465], [1070, 465]];
const sesame = [[-50,-35],[-21,-48],[16,-39],[42,-22],[-34,-16],[4,-19],[55,-40],[-2,-55]];

function StackedBurger({ stack, x, y }: { stack: string[]; x: number; y: number }) {
  return <g transform={`translate(${x} ${y}) scale(.46)`} filter="url(#foodShadow)">
    {stack.map((layer, index) => <g key={index} className="layer-drop">
      {layer === 'bottom bun' && <g><circle r="105" fill="url(#bunBottom)" stroke="#a66430" strokeWidth="5"/><circle r="89" fill="#eeb772" stroke="#f5d197" strokeWidth="4"/></g>}
      {layer === 'patty' && <g><circle r="91" fill="url(#meat)" stroke="#583021" strokeWidth="9"/><path d="M-62 -25 Q-5 -56 55 -30 M-61 16 Q0 -12 65 9 M-40 55 Q10 36 46 48" fill="none" stroke="#482719" strokeOpacity=".45" strokeWidth="10" strokeLinecap="round"/></g>}
      {layer === 'cheese' && <g><path d="M-88 -72 L89 -69 L96 83 L42 65 L-61 90 L-93 31Z" fill="#f2bb35" stroke="#c67d20" strokeWidth="4"/><path d="M-70 -63 L72 -61" stroke="#ffe393" strokeWidth="6" opacity=".7"/></g>}
      {layer === 'lettuce' && <path d="M-99 -24 Q-113 -73 -65 -78 Q-41 -111 -9 -86 Q27 -108 55 -78 Q105 -84 99 -34 Q121 -1 93 22 Q110 68 63 74 Q34 106 0 81 Q-31 104 -59 71 Q-111 78 -97 29 Q-121 -2 -99 -24Z" fill="#82ae48" stroke="#477234" strokeWidth="5"/>}
      {layer === 'tomato' && <g><circle r="80" fill="#cb503c" stroke="#9e3528" strokeWidth="5"/><circle r="66" fill="none" stroke="#f48e6d" strokeWidth="5" opacity=".65"/><path d="M0 -49 Q-8 -13 0 9 Q9 -11 0 -49 M0 8 Q-25 20 -20 45 M0 8 Q27 20 23 45" fill="none" stroke="#f2b080" strokeWidth="5" opacity=".6"/></g>}
      {layer === 'onion' && <g><circle r="78" fill="none" stroke="#b98cb4" strokeWidth="17"/><circle r="55" fill="none" stroke="#e0bdd5" strokeWidth="11"/><circle r="30" fill="none" stroke="#9b6a9b" strokeWidth="7"/></g>}
      {layer === 'pickle' && <g>{[[-36,-28],[30,-36],[-20,34],[46,28]].map(([x,y],i)=><g key={i}><ellipse cx={x} cy={y} rx="28" ry="18" transform={`rotate(${i*27} ${x} ${y})`} fill="#789b43" stroke="#405f30" strokeWidth="4"/><circle cx={x-7} cy={y-3} r="2" fill="#d4db8b"/><circle cx={x+8} cy={y+5} r="2" fill="#d4db8b"/></g>)}</g>}
      {layer === 'bacon' && <g>{[-33,12,55].map((x)=><path key={x} d={`M${x-13} -76 Q${x+15} -45 ${x-10} -13 Q${x+15} 20 ${x-13} 77 L${x+5} 75 Q${x+32} 20 ${x+10} -12 Q${x+32} -46 ${x+5} -77Z`} fill="#a74731" stroke="#692a21" strokeWidth="3"/>)}</g>}
      {layer === 'mushroom' && <g>{[[-40,-32],[32,-38],[-23,37],[45,30]].map(([x,y],i)=><g key={i}><ellipse cx={x} cy={y} rx="25" ry="17" fill="#aa815d" stroke="#755136" strokeWidth="3"/><path d={`M${x-16} ${y} Q${x} ${y-12} ${x+16} ${y}`} stroke="#d4b18a" strokeWidth="3" fill="none"/></g>)}</g>}
      {layer === 'jalapeno' && <g>{[[-44,-37],[36,-30],[-23,36],[46,36]].map(([x,y],i)=><g key={i}><ellipse cx={x} cy={y} rx="24" ry="16" fill="#5f943d" stroke="#315b30" strokeWidth="4"/><ellipse cx={x} cy={y} rx="11" ry="7" fill="#c3d087"/></g>)}</g>}
      {layer === 'avocado' && <g>{[-50,-18,15,46].map((x,i)=><path key={i} d={`M${x-25} -49 Q${x+11} -73 ${x+25} -40 Q${x+34} 6 ${x+18} 54 Q${x} 75 ${x-17} 55 Q${x-30} 9 ${x-25} -49Z`} fill="#a8c95e" stroke="#5b8739" strokeWidth="4"/>)}</g>}
      {['ketchup','mustard','mayo'].includes(layer) && <path d="M-62 -44 Q-12 -82 51 -45 Q86 -4 52 43 Q4 76 -54 47 Q-82 5 -62 -44Z" fill="none" stroke={layer === 'ketchup' ? '#be392d' : layer === 'mustard' ? '#d4a12c' : '#eee2bb'} strokeWidth="13" strokeDasharray="36 12" strokeLinecap="round"/>}
      {layer === 'top bun' && <g><circle r="105" fill="url(#bunTop)" stroke="#9e582a" strokeWidth="6"/><path d="M-75 -34 Q-45 -78 10 -84" fill="none" stroke="#ffe0a4" strokeWidth="9" opacity=".6" strokeLinecap="round"/>{sesame.map(([x,y],i)=><ellipse key={i} cx={x*1.5} cy={y*1.3+35} rx="8" ry="3.3" transform={`rotate(-28 ${x*1.5} ${y*1.3+35})`} fill="#fff0c1"/>)}</g>}
    </g>)}
  </g>;
}

export function GrillScene({ kitchen, motion, ids }: { kitchen: KitchenState; motion: { action: KitchenAction; id: number } | null; ids: (number | null)[] }) {
  return <svg className="grill-art" viewBox="0 0 1200 650" role="img" aria-label={`Grill with ${kitchen.slots.filter((state) => state.patty?.onGrill).length} patties; ${kitchen.slots.map((state, slot) => `burger ${slot + 1}: ${state.stack.join(', ') || 'empty plate'}`).join('; ')}`}>
    <defs>
      <linearGradient id="counter" x2="0" y2="1"><stop stopColor="#664331"/><stop offset=".46" stopColor="#865c3d"/><stop offset="1" stopColor="#533725"/></linearGradient>
      <linearGradient id="steel" x2=".25" y2="1"><stop stopColor="#f6ebd2"/><stop offset=".2" stopColor="#9caaa5"/><stop offset=".43" stopColor="#46565a"/><stop offset=".7" stopColor="#aab7ad"/><stop offset="1" stopColor="#485453"/></linearGradient>
      <linearGradient id="grillDark" x2="0" y2="1"><stop stopColor="#14191a"/><stop offset=".5" stopColor="#30251c"/><stop offset="1" stopColor="#101719"/></linearGradient>
      <linearGradient id="bar" x2="0" y2="1"><stop stopColor="#c8d0c5"/><stop offset=".3" stopColor="#788b82"/><stop offset=".6" stopColor="#313d39"/><stop offset="1" stopColor="#0a1111"/></linearGradient>
      <radialGradient id="coals"><stop stopColor="#fd8b35" stopOpacity=".83"/><stop offset=".48" stopColor="#d94e23" stopOpacity=".36"/><stop offset="1" stopColor="#e0712c" stopOpacity="0"/></radialGradient>
      <radialGradient id="meat" cx=".34" cy=".25"><stop stopColor="#bd8655"/><stop offset=".6" stopColor="#814528"/><stop offset="1" stopColor="#492416"/></radialGradient>
      {kitchen.slots.map((state, slot) => <radialGradient key={slot} id={`grill-meat-${slot}`} cx=".34" cy=".25"><stop stopColor={state.patty && doneness(state.patty) === 'burnt' ? '#4b3025' : state.patty?.ticks.every((n) => n === 0) && state.patty.kind === 'beef' ? '#d98982' : '#b6794c'}/><stop offset=".56" stopColor={state.patty?.kind === 'veggie' ? '#75653b' : state.patty?.ticks.every((n) => n === 0) ? '#ac514a' : '#814528'}/><stop offset="1" stopColor="#492416"/></radialGradient>)}
      <linearGradient id="bunTop" x2=".3" y2="1"><stop stopColor="#f6cc83"/><stop offset=".6" stopColor="#dd9447"/><stop offset="1" stopColor="#a95e28"/></linearGradient><linearGradient id="bunBottom" x2="0" y2="1"><stop stopColor="#f3bb70"/><stop offset="1" stopColor="#a86430"/></linearGradient>
      <radialGradient id="plate"><stop stopColor="#f4ebd8"/><stop offset=".62" stopColor="#f4ebd8"/><stop offset=".64" stopColor="#c4c8b8"/><stop offset=".78" stopColor="#e8e3d1"/><stop offset=".83" stopColor="#a2aaa1"/><stop offset="1" stopColor="#e5e0cc"/></radialGradient>
      <pattern id="grain" width="200" height="210" patternUnits="userSpaceOnUse"><path d="M-10 65 Q65 59 210 65 M-10 132 Q85 137 210 129 M-10 204 Q94 194 210 205" fill="none" stroke="#38271c" strokeOpacity=".18" strokeWidth="4"/><path d="M0 70 Q80 65 200 70 M0 137 Q90 143 200 136" fill="none" stroke="#edb277" strokeOpacity=".12" strokeWidth="2"/></pattern>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="13"/><feOffset dy="16" dx="7"/><feComponentTransfer><feFuncA type="linear" slope=".7"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="foodShadow" x="-50%" y="-50%" width="200%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dy="6"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" result="noise" seed="7"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="9"/></filter>
      <clipPath id="grillClip"><rect x="78" y="83" width="738" height="452" rx="13"/></clipPath>
    </defs>
    <rect width="1200" height="650" fill="url(#counter)"/><rect width="1200" height="650" fill="url(#grain)"/>
    <path d="M0 27 Q446 10 1200 22 M0 610 Q680 589 1200 615" stroke="#b98b60" strokeOpacity=".17" strokeWidth="9" fill="none"/>
    <g filter="url(#shadow)"><rect x="36" y="43" width="822" height="540" rx="35" fill="#293433" stroke="#252e2e" strokeWidth="14"/><rect x="43" y="49" width="808" height="491" rx="28" fill="url(#steel)" stroke="#d6dfcf" strokeOpacity=".7" strokeWidth="7"/><rect x="74" y="79" width="745" height="460" rx="15" fill="url(#grillDark)" stroke="#253330" strokeWidth="12"/>
      <g clipPath="url(#grillClip)"><ellipse cx="445" cy="310" rx="430" ry="270" fill="url(#coals)" opacity=".95"/>{bars.map((y, i) => <g key={y}><rect x="66" y={y+5} width="764" height="16" rx="6" fill="#0c0e0c" opacity=".85"/><rect x="66" y={y} width="764" height="13" rx="4" fill="url(#bar)"/><path d={`M80 ${y+2} H804`} stroke="#dae0d1" strokeWidth="2" opacity={i % 3 === 0 ? '.7' : '.36'}/></g>)}</g><rect x="52" y="540" width="792" height="33" rx="8" fill="#34403d"/><path d="M70 552 H825" stroke="#bac5b7" strokeOpacity=".36" strokeWidth="2"/><circle cx="789" cy="558" r="18" fill="#17211f" stroke="#80918a" strokeWidth="6"/><path d="M789 541 v11" stroke="#d9e0d1" strokeWidth="3" strokeLinecap="round"/><circle cx="705" cy="558" r="5" fill="#ee8748"/><circle cx="728" cy="558" r="5" fill="#f2aa65"/></g>
    {kitchen.slots.map((state, slot) => state.patty?.onGrill && <g key={`patty-${slot}`} transform={`translate(${grillPositions[slot][0]} ${grillPositions[slot][1]})`}>
      <g key={`side-${state.patty.side}`} className={motion?.action.type === 'slot' && motion.action.slot === slot && motion.action.action.type === 'patty.flip' ? 'patty-flip' : 'patty-enter'} filter="url(#foodShadow)">
        <path d="M341 226 Q359 200 395 198 Q420 183 449 197 Q492 181 524 208 Q554 209 569 243 Q593 263 572 298 Q579 329 550 357 Q518 376 493 370 Q456 387 421 369 Q386 379 354 346 Q326 332 326 302 Q306 264 341 226Z" fill={`url(#grill-meat-${slot})`} stroke="#613a29" strokeWidth="12" filter="url(#rough)"/>
        <path d="M352 260 Q399 204 460 215 M537 326 Q485 369 421 354" stroke="#df9b61" strokeWidth="6" fill="none" opacity=".46" strokeLinecap="round"/>
        <path d="M377 257 Q453 276 541 250 M363 293 Q451 311 555 289 M382 329 Q453 345 527 325" stroke="#3c231a" strokeWidth="10" strokeOpacity=".5" fill="none" strokeLinecap="round"/>
      </g><g className="steam" aria-hidden="true"><path d="M400 192 Q382 168 400 145 T402 114"/><path d="M510 192 Q488 170 508 145 T506 111"/></g>
    </g>)}
    {ids.map((id, slot) => id !== null && <g key={`grill-number-${slot}`} className="position-number" transform={`translate(${160 + (slot % 2) * 330} ${116 + Math.floor(slot / 2) * 205})`}><circle r="24"/><text>{String(id).padStart(2, '0')}</text></g>)}
    <g className="plate-group">{kitchen.slots.map((state, slot) => <g key={slot}><g filter="url(#shadow)"><circle cx={platePositions[slot][0]} cy={platePositions[slot][1]} r="79" fill="url(#plate)" stroke="#e8e6d8" strokeWidth="4"/><circle cx={platePositions[slot][0]} cy={platePositions[slot][1]} r="58" fill="none" stroke="#aeb6a9" strokeWidth="2" opacity=".65"/></g><StackedBurger stack={state.stack} x={platePositions[slot][0]} y={platePositions[slot][1]}/>{ids[slot] !== null && <g className="position-number plate-number" transform={`translate(${platePositions[slot][0] - 57} ${platePositions[slot][1] - 61})`}><circle r="21"/><text>{String(ids[slot]).padStart(2, '0')}</text></g>}</g>)}</g>
    {motion?.action.type === 'slot' && ['patty.place', 'patty.flip', 'patty.remove'].includes(motion.action.action.type) && <g key={motion.id} transform={`translate(${450 + grillPositions[motion.action.slot][0]} ${285 + grillPositions[motion.action.slot][1]})`}><g className={`spatula spatula-${motion.action.action.type.split('.')[1]}`}><path d="M-46 5 L20 -43 L42 -21 L-23 29Z" fill="url(#steel)" stroke="#50615c" strokeWidth="5"/><path d="M30 -32 L112 -115" stroke="#9baba3" strokeWidth="11" strokeLinecap="round"/><path d="M98 -101 L168 -169" stroke="#6c3c26" strokeWidth="18" strokeLinecap="round"/></g></g>}
  </svg>;
}
