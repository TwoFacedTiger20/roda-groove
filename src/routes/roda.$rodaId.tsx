import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/SiteHeader";
import {
  INSTRUMENTS,
  PITCHED,
  playInstrument,
  type InstrumentId,
} from "@/lib/instruments";
import {
  MAX_PLAYERS,
  broadcastHit,
  colorForIndex,
  generatePlayerId,
  joinRoda,
  pingDiscovery,
  updatePlayer,
  type HitEvent,
  type Player,
} from "@/lib/roda";
import { RodaRecorder, downloadBlob } from "@/lib/recorder";

export const Route = createFileRoute("/roda/$rodaId")({
  head: ({ params }) => ({
    meta: [
      { title: `Roda ${params.rodaId} — Axé` },
      { name: "description", content: "Join this live percussion roda. Pick an instrument and jam." },
      { property: "og:title", content: `Live Roda — Axé` },
      { property: "og:description", content: "Hop in and play live percussion with up to 6 friends." },
    ],
  }),
  component: RodaPage,
});

const RANDOM_NAMES = [
  "Mango", "Coco", "Brisa", "Sol", "Lua", "Praia", "Palma", "Onda",
  "Café", "Rumba", "Samba", "Salsa", "Cacau", "Açaí",
];

function RodaPage() {
  const { rodaId } = Route.useParams();
  const navigate = useNavigate();

  // Stable session player id + name
  const playerIdRef = useRef<string>("");
  if (!playerIdRef.current) playerIdRef.current = generatePlayerId();

  const initialName = useMemo(() => {
    if (typeof window === "undefined") return "Player";
    const stored = sessionStorage.getItem("axe-player-name");
    if (stored) return stored;
    const n = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] +
      " " + Math.floor(Math.random() * 90 + 10);
    sessionStorage.setItem("axe-player-name", n);
    return n;
  }, []);

  const initialRodaName = `Roda ${rodaId}`;

  const [playerName, setPlayerName] = useState(initialName);
  const [rodaName, setRodaName] = useState(initialRodaName);
  const [editingName, setEditingName] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentId | null>(null);
  const [notes, setNotes] = useState<Partial<Record<InstrumentId, string>>>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [hits, setHits] = useState<Array<HitEvent & { key: number }>>([]);
  const [recording, setRecording] = useState(false);
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);

  // Hydrate roda name from sessionStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = sessionStorage.getItem(`roda-name:${rodaId}`);
    if (stored) setRodaName(stored);
  }, [rodaId]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const recorderRef = useRef<RodaRecorder | null>(null);
  const hitKeyRef = useRef(0);

  const me: Player = useMemo(
    () => ({
      id: playerIdRef.current,
      name: playerName,
      instrument,
      color: colorForIndex(0),
    }),
    [playerName, instrument],
  );

  // Connect to roda channel
  useEffect(() => {
    const ch = joinRoda({
      rodaId,
      rodaName: initialRodaName,
      player: me,
      onHit: (h) => {
        playInstrument(h.instrument);
        const k = ++hitKeyRef.current;
        setHits((prev) => [...prev.slice(-30), { ...h, key: k }]);
      },
      onPlayers: (list) => {
        // include self if not yet present (presence may lag)
        const hasMe = list.some((p) => p.id === playerIdRef.current);
        const merged = hasMe ? list : [...list, me];
        if (merged.length > MAX_PLAYERS && !hasMe) {
          setFull(true);
          return;
        }
        setPlayers(merged);
      },
    });
    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodaId]);

  // Update presence on local changes
  useEffect(() => {
    if (channelRef.current) {
      void updatePlayer(channelRef.current, me, initialRodaName);
    }
  }, [me, initialRodaName]);

  // Periodically announce roda for discovery
  useEffect(() => {
    const ping = () => {
      void pingDiscovery({
        id: rodaId,
        name: initialRodaName,
        playerCount: players.length || 1,
      });
    };
    ping();
    const t = setInterval(ping, 8000);
    return () => clearInterval(t);
  }, [rodaId, initialRodaName, players.length]);

  // Cleanup hit visuals
  useEffect(() => {
    if (hits.length === 0) return;
    const t = setTimeout(() => setHits((prev) => prev.slice(1)), 800);
    return () => clearTimeout(t);
  }, [hits]);

  const handleHit = (id: InstrumentId) => {
    playInstrument(id);
    const hit: HitEvent = { playerId: playerIdRef.current, instrument: id, at: Date.now() };
    const k = ++hitKeyRef.current;
    setHits((prev) => [...prev.slice(-30), { ...hit, key: k }]);
    if (channelRef.current) void broadcastHit(channelRef.current, hit);
  };

  const toggleRecord = async () => {
    if (!recorderRef.current) recorderRef.current = new RodaRecorder();
    const r = recorderRef.current;
    if (!recording) {
      r.start();
      setRecording(true);
    } else {
      const blob = await r.stop();
      setRecording(false);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadBlob(blob, `roda-${rodaId}-${stamp}.webm`);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (full) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-pixel text-xl text-coral">RODA IS FULL</h1>
          <p className="mt-4 text-display text-xl text-sand/90">
            This roda already has {MAX_PLAYERS} players. Try another or open your own.
          </p>
          <button
            onClick={() => navigate({ to: "/browse" })}
            className="mt-6 bg-mango text-night text-pixel text-xs px-4 py-3 pixel-border"
          >
            BROWSE RODAS
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {/* Roda header */}
        <div className="bg-card pixel-border p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-pixel text-[10px] text-accent">RODA</div>
              <h1 className="text-pixel text-base sm:text-xl text-mango truncate">
                {initialRodaName}
              </h1>
              <div className="text-display text-base text-sand/70 mt-1">/{rodaId}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copyLink}
                className="bg-accent text-night text-pixel text-[10px] px-3 py-2 pixel-border-sm hover:brightness-110"
              >
                {copied ? "✓ COPIED" : "🔗 SHARE LINK"}
              </button>
              <button
                onClick={toggleRecord}
                className={`text-pixel text-[10px] px-3 py-2 pixel-border-sm ${
                  recording
                    ? "bg-hibiscus text-foreground animate-pixel-pulse"
                    : "bg-mango text-night"
                }`}
              >
                {recording ? "⏹ STOP & SAVE" : "⏺ RECORD"}
              </button>
            </div>
          </div>

          {/* Players */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
              const p = players[i];
              const isMe = p?.id === playerIdRef.current;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 pixel-border-sm ${
                    p ? "bg-night" : "bg-muted opacity-40"
                  }`}
                >
                  <span
                    className="inline-block h-3 w-3"
                    style={{ background: p ? colorForIndex(i) : "var(--muted-foreground)" }}
                  />
                  {p ? (
                    isMe && editingName ? (
                      <input
                        autoFocus
                        value={playerName}
                        maxLength={20}
                        onChange={(e) => {
                          setPlayerName(e.target.value);
                          sessionStorage.setItem("axe-player-name", e.target.value);
                        }}
                        onBlur={() => setEditingName(false)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                        className="bg-transparent text-display text-base text-mango outline-none w-28"
                      />
                    ) : (
                      <button
                        onClick={() => isMe && setEditingName(true)}
                        className={`text-display text-base ${isMe ? "text-mango" : "text-sand"}`}
                        title={isMe ? "Click to rename" : undefined}
                      >
                        {p.name}{isMe ? " (you)" : ""}
                      </button>
                    )
                  ) : (
                    <span className="text-display text-base text-muted-foreground">empty</span>
                  )}
                  {p?.instrument && (
                    <span className="text-display text-base text-accent">
                      · {INSTRUMENTS.find((x) => x.id === p.instrument)?.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live hit ticker */}
        <div className="relative h-16 mt-4 bg-night/60 pixel-border-sm overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-display text-lg text-muted-foreground">
            {hits.length === 0 ? "Tap an instrument to start the roda" : ""}
          </div>
          <div className="absolute inset-0 flex items-end justify-center gap-1 px-3 pb-2">
            {hits.slice(-20).map((h) => {
              const meta = INSTRUMENTS.find((i) => i.id === h.instrument)!;
              return (
                <span
                  key={h.key}
                  className="text-2xl animate-float-up"
                  style={{ color: meta.color }}
                  aria-hidden
                >
                  {meta.emoji}
                </span>
              );
            })}
          </div>
        </div>

        {/* Instruments */}
        <h2 className="mt-8 text-pixel text-sm text-coral">PICK YOUR INSTRUMENT · TAP TO PLAY</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {INSTRUMENTS.map((ins) => {
            const selected = instrument === ins.id;
            return (
              <button
                key={ins.id}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setInstrument(ins.id);
                  handleHit(ins.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setInstrument(ins.id);
                    handleHit(ins.id);
                  }
                }}
                className={`group relative flex flex-col items-start text-left p-3 pixel-border bg-card hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform ${
                  selected ? "ring-4 ring-mango" : ""
                }`}
                style={selected ? { borderColor: ins.color } : undefined}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-3xl group-active:animate-hit" style={{ color: ins.color }}>
                    {ins.emoji}
                  </span>
                  <span
                    className="text-pixel text-[8px] px-1.5 py-0.5 pixel-border-sm"
                    style={{ background: ins.color, color: "var(--night)" }}
                  >
                    {ins.origin === "Brazil" ? "BR" : ins.origin === "Caribbean" ? "CARIB" : "LATIN"}
                  </span>
                </div>
                <div className="mt-2 text-pixel text-[10px] text-mango">{ins.name.toUpperCase()}</div>
                <div className="text-display text-base text-sand/70">{ins.hint}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link to="/browse" className="text-display text-lg text-accent hover:text-mango">
            ← Back to live rodas
          </Link>
        </div>
      </main>
    </div>
  );
}
