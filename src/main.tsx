import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import type { BurgerState } from './engine/burger';
import { initialKitchen, kitchenActionId, legalKitchenActions, startOrder, transitionKitchen, type KitchenAction, type KitchenState, type Slot } from './engine/kitchen';
import { MENU, type Order } from './engine/recipes';
import type { ProviderKey } from './jev/types';
import { chooseKitchenMove } from './jev/kitchen';
import { parseOrder } from './jev/orders';
import { GrillScene } from './GrillScene';
import './styles.css';

type Ticket = { id: number; text: string; order: Order };
type Motion = { action: KitchenAction; id: number } | null;
const SAMPLE_TICKETS = [
  'a classic burger with bacon', 'two cheeseburgers with extra pickles',
  'three veggie burgers with avocado', 'four cheeseburgers with jalapeños',
  'a well-done cheeseburger with mushrooms', 'two classic burgers without onions',
  'a veggie burger with extra tomato', 'three cheeseburgers with bacon',
];
const names: Record<string, string> = {
  'patty.place': 'Patty on the grill', 'patty.season': 'Seasoning', 'patty.flip': 'Flipping the patty',
  'patty.remove': 'Patty off the heat', 'bun.toast': 'Toasting the bun', 'bun.bottom': 'Bottom bun down',
  'stack.patty': 'Adding the patty', 'stack.cheese': 'Melting cheese', 'bun.top': 'Top bun on',
  'burger.serve': 'Order up!', 'burger.discard': 'Starting over',
};
const label = (action: KitchenAction, tickets: (Ticket | null)[]) => action.type === 'grill.wait' ? 'Grill +30s · every patty' : `#${tickets[action.slot]?.id ?? action.slot + 1} · ${action.action.type === 'stack.topping' ? `Adding ${action.action.topping}` : names[action.action.type] ?? action.action.type}`;
const stage = (state: BurgerState) => {
  if (state.result) return state.result.correct ? '✓ ORDER UP' : '✕ NEEDS RETRY';
  if (state.patty?.onGrill) return `SIDE ${state.patty.side + 1} · ${state.patty.ticks[state.patty.side] * 30}/${state.order?.doneness === 'well-done' ? 90 : 60}s`;
  if (state.stack.at(-1) === 'top bun') return 'READY TO SERVE';
  if (state.patty) return 'PLATING';
  return 'WAITING FOR GRILL';
};
const readKey = (): ProviderKey => { try { return JSON.parse(localStorage.getItem('jevburger:key') || 'null') ?? { provider: 'openrouter', key: '' }; } catch { return { provider: 'openrouter', key: '' }; } };

function App() {
  const [kitchen, setKitchen] = useState<KitchenState>(initialKitchen);
  const [tickets, setTickets] = useState<[Ticket | null, Ticket | null, Ticket | null, Ticket | null]>([null, null, null, null]);
  const [queue, setQueue] = useState<Ticket[]>([]);
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [move, setMove] = useState('Write a ticket to start');
  const [motion, setMotion] = useState<Motion>(null);
  const [key, setKey] = useState<ProviderKey>(readKey);
  const [serverKey, setServerKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const nextId = useRef(1);
  const sequence = useRef(0);
  const latest = useRef(kitchen);
  latest.current = kitchen;
  const connected = Boolean(serverKey || key.key.trim());

  useEffect(() => { fetch('/api/config').then((r) => r.json()).then((data: { configured: boolean }) => setServerKey(data.configured)).catch(() => {}); }, []);

  function start(slot: Slot, ticket: Ticket) {
    sequence.current++;
    setTickets((current) => { const next: typeof current = [...current]; next[slot] = ticket; return next; });
    setKitchen((current) => startOrder(current, slot, ticket.order));
    setMove(`#${ticket.id} · Jev is on it`); setError(''); setPaused(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const ticketText = text.trim();
    if (!ticketText || parsing) return;
    if (!connected) { setShowKey(true); setError('Connect Jev to read your ticket.'); return; }
    setParsing(true); setError('');
    try {
      const { order, quantity } = await parseOrder(ticketText, key.key.trim() ? key : undefined);
      const tickets = Array.from({ length: quantity }, (_, index) => ({ id: nextId.current++, text: quantity === 1 ? ticketText : `${ticketText} · ${index + 1}/${quantity}`, order }));
      const free = kitchen.slots.flatMap((state, slot) => !state.order || state.result ? [slot as Slot] : []);
      const immediate = queue.length ? 0 : Math.min(free.length, tickets.length);
      for (let index = 0; index < immediate; index++) start(free[index], tickets[index]);
      if (immediate < tickets.length) setQueue((line) => [...line, ...tickets.slice(immediate)]);
      setText('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not read ticket'); }
    finally { setParsing(false); }
  }

  useEffect(() => {
    if (!connected || paused || busy || !kitchen.slots.some((state) => state.order && !state.result)) return;
    if (kitchen.moves >= 160 || kitchen.slots.some((state) => state.moves >= 50 && !state.result)) {
      setPaused(true); setError('Jev reached the move limit. Restart a ticket to try again.'); return;
    }
    const version = sequence.current;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const chosen = await chooseKitchenMove(kitchen, key.key.trim() ? key : undefined);
        if (sequence.current !== version) return;
        const action = legalKitchenActions(latest.current).find((candidate) => kitchenActionId(candidate) === kitchenActionId(chosen));
        if (action) {
          sequence.current++;
          setKitchen((current) => transitionKitchen(current, action));
          setMove(label(action, tickets)); setMotion({ action, id: sequence.current });
        }
      } catch (reason) {
        if (sequence.current === version) { setError(reason instanceof Error ? reason.message : 'Jev could not decide'); setPaused(true); }
      } finally { setBusy(false); }
    }, 950);
    return () => clearTimeout(timer);
  }, [kitchen, connected, paused, busy, tickets]);

  useEffect(() => {
    if (!queue.length || paused) return;
    const free = kitchen.slots.findIndex((state) => !state.order || state.result);
    if (free === -1) return;
    const timer = window.setTimeout(() => { start(free as Slot, queue[0]); setQueue(queue.slice(1)); }, kitchen.slots[free].result ? 2700 : 0);
    return () => clearTimeout(timer);
  }, [kitchen, queue, paused]);

  const active = kitchen.slots.some((state) => state.order && !state.result);
  const caption = paused ? 'Jev is paused' : busy ? 'Jev is deciding…' : move;

  return <div className="app">
    <header className="header"><div className="wordmark"><span>✳</span> jevburger</div><div className="header-actions"><span className="cook-mode"><i className={paused ? 'off' : ''}/>{paused ? 'PAUSED' : 'JEV COOKS'}</span><button className="key-link" onClick={() => setShowKey((value) => !value)}>{connected ? 'Key connected' : 'Connect Jev'}</button></div></header>
    <main className="main">
      <form className="ticket-line" onSubmit={submit}><div className="ticket-line-heading"><label htmlFor="ticket-input">NEW TICKET / {String(nextId.current).padStart(2, '0')}</label><button type="button" className="random-ticket" onClick={() => { const options = SAMPLE_TICKETS.filter((sample) => sample !== text); setText(options[Math.floor(Math.random() * options.length)]); }} aria-label="Fill a random ticket">✦ Surprise me</button></div><div className="ticket-entry"><input id="ticket-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={180} autoComplete="off" placeholder="Four cheeseburgers, extra pickles…"/><button type="submit" disabled={parsing || !text.trim()}>{parsing ? 'Reading…' : 'Fire ticket ↗'}</button></div></form>
      {error && <p className="error" role="alert">{error}</p>}
      {queue.length > 0 && <div className="queued-tickets"><span>NEXT UP</span>{queue.map((ticket) => <div key={ticket.id}><b>#{ticket.id}</b> {ticket.text}<button type="button" aria-label={`Remove ticket ${ticket.id}`} onClick={() => setQueue((line) => line.filter((item) => item.id !== ticket.id))}>×</button></div>)}</div>}
      {tickets.some(Boolean) && <div className="active-tickets">{tickets.map((ticket, slot) => ticket ? <div key={slot} className="ticket"><span className="ticket-label">ORDER {String(ticket.id).padStart(2, '0')}</span><strong>{MENU[ticket.order.recipe].name}</strong><span className="ticket-stage">{stage(kitchen.slots[slot])}</span><span className="ticket-request">{ticket.text}</span></div> : <div key={slot} className="ticket vacant">EMPTY SPOT {slot + 1}</div>)}</div>}
      <div className="move-bubble" role="status"><div className="move-icon">✳</div><div><small>JEV · {paused ? 'PAUSED' : busy ? 'DECIDING' : 'LAST MOVE'}</small><strong>{caption}</strong></div></div>
      <div className="scene" data-active={active} aria-label="Burger grill game">
        <GrillScene kitchen={kitchen} motion={motion} ids={tickets.map((ticket) => ticket?.id ?? null)}/>
      </div>
      <div className="mobile-plating" aria-label="Burger assembly plates"><GrillScene kitchen={kitchen} motion={null} ids={tickets.map((ticket) => ticket?.id ?? null)}/></div>
      <div className="toolbar"><span>{tickets.filter(Boolean).length} on the line{queue.length ? ` · ${queue.length} waiting` : ''}</span><div><button onClick={() => { sequence.current++; setPaused((value) => !value); setError(''); }} disabled={!active}>{paused ? 'Resume Jev ▶' : 'Pause Jev Ⅱ'}</button>{tickets.map((ticket, slot) => ticket && <button key={slot} onClick={() => start(slot as Slot, ticket)}>Retry #{ticket.id} ↗</button>)}</div></div>
      {showKey && <div className="key-drawer"><span>{serverKey ? 'Server key connected' : 'Connect Jev to read and cook tickets.'}</span>{!serverKey && <><select aria-label="Key provider" value={key.provider} onChange={(e) => setKey({ provider: e.target.value as ProviderKey['provider'], key: '' })}><option value="openrouter">OpenRouter</option><option value="typesafe">TypeSafe</option></select><input aria-label="API key" type="password" autoComplete="off" placeholder="Your API key" value={key.key} onChange={(e) => { const nextKey = { ...key, key: e.target.value }; setKey(nextKey); localStorage.setItem('jevburger:key', JSON.stringify(nextKey)); }}/></>}<button aria-label="Close key settings" onClick={() => setShowKey(false)}>✕</button><small>Saved in this browser. Jev handles parsing and every cooking move.</small></div>}
    </main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
