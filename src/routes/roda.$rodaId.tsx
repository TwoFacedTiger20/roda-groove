import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/SiteHeader";
import {
  GENRES,
  INSTRUMENTS,
  PITCHED,
  playInstrument,
  type InstrumentId,
  type Origin,
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

const ORIGINS: Origin[] = [
  "Brazil", "Caribbean", "Latin", "Africa", "Middle East", "India",
  "East Asia", "Southeast Asia", "Europe", "Andes", "North America", "Oceania",
];

function originLabel(o: Origin): string {
  switch (o) {
    case "Brazil": return "BR";
    case "Caribbean": return "CARIB";
    case "Latin": return "LATIN";
    case "Africa": return "AFR";
    case "Middle East": return "ME";
    case "India": return "IND";
    case "East Asia": return "E.ASIA";
    case "Southeast Asia": return "SE.ASIA";
    case "Europe": return "EU";
    case "Andes": return "ANDES";
    case "North America": return "N.AM";
    case "Oceania": return "OCE";
  }
}

function RodaPage() {
  const { rodaId } = Route.useParams();
  const navigate = useNavigate();

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

  const [playerName, setPlayerName] = useState(initialName);
  const [rodaName, setRodaName] = useState(`Roda ${rodaId}`);
  const [genre, setGenre] = useState<string>("open");
  const [hostId, setHostId] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentId | null>(null);
  const [notes, setNotes] = useState<Partial<Record<InstrumentId, string>>>({});
  const [originFilter, setOriginFilter] = useState<Origin | "All">("All");
  const [players, setPlayers] = useState<Player[]>([]);
  const [hits, setHits] = useState<Array<HitEvent & { key: number }>>([]);
  const [recording, setRecording] = useState(false);
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);

  // Hydrate roda name + genre from sessionStorage after mount
  useEffect(() => {
    const storedName = sessionStorage.getItem(`roda-name:${rodaId}`);
    if (storedName) setRodaName(storedName);
    const storedGenre = sessionStorage.getItem(`roda-genre:${rodaId}`);
    if (storedGenre) setGenre(storedGenre);
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

  const isHost = hostId === playerIdRef.current;
  const genreMeta = GENRES.find((g) => g.id === genre) ?? GENRES[0];

  // Connect to roda channel
  useEffect(() => {
    const ch = joinRoda({
      rodaId,
      rodaName,
      genre,
      player: me,
      onHit: (h) => {
        playInstrument(h.instrument, h.note);
        const k = ++hitKeyRef.current;
        setHits((prev) => [...prev.slice(-30), { ...h, key: k }]);
      },
      onPlayers: (list) => {
        const hasMe = list.some((p) => p.id === playerIdRef.current);
        const merged = hasMe ? list : [...list, me];
        if (merged.length > MAX_PLAYERS && !hasMe) {
          setFull(true);
          return;
        }
        setPlayers(merged);
      },
      onMeta: (meta) => {
        // Only the HOST's genre/name authoritatively define the roda.
        setHostId(meta.hostId);
        if (meta.hostId !== playerIdRef.current) {
          setRodaName(meta.rodaName);
          setGenre(meta.genre);
        }
      },
    });
    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodaId]);

  // Update presence on local changes (host changes propagate genre/name to all)
  useEffect(() => {
    if (channelRef.current) {
      void updatePlayer(channelRef.current, me, rodaName, genre);
    }
  }, [me, rodaName, genre]);

  // Periodically announce roda for discovery
  useEffect(() => {
    const ping = () => {
      void pingDiscovery({
        id: rodaId,
        name: rodaName,
        genre,
        playerCount: players.length || 1,
      });
    };
    ping();
    const t = setInterval(ping, 8000);
    return () => clearInterval(t);
  }, [rodaId, rodaName, genre, players.length]);

  // Cleanup hit visuals
  useEffect(() => {
    if (hits.length === 0) return;
    const t = setTimeout(() => setHits((prev) => prev.slice(1)), 800);
    return () => clearTimeout(t);
  }, [hits]);

  const handleHit = (id: InstrumentId, note?: string) => {
    const n = note ?? notes[id];
    playInstrument(id, n);
    const hit: HitEvent = { playerId: playerIdRef.current, instrument: id, note: n, at: Date.now() };
    const k = ++hitKeyRef.current;
    setHits((prev) => [...prev.slice(-30), { ...hit, key: k }]);
    if (channelRef.current) void broadcastHit(channelRef.current, hit);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        return;
      }
      if (!instrument) return;
      const palette = PITCHED[instrument];

      if (e.code === "Space") {
        e.preventDefault();
        handleHit(instrument);
        return;
      }

      if (palette) {
        if (/^[0-9]$/.test(e.key)) {
          const raw = parseInt(e.key, 10);
          const idx = raw === 0 ? 9 : raw - 1;
          if (idx < palette.length) {
            e.preventDefault();
            const n = palette[idx];
            setNotes((prev) => ({ ...prev, [instrument]: n }));
            handleHit(instrument, n);
          }
          return;
        }
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const current = notes[instrument] ?? palette[0];
          const i = palette.indexOf(current);
          const next = e.key === "ArrowRight"
            ? palette[(i + 1) % palette.length]
            : palette[(i - 1 + palette.length) % palette.length];
          setNotes((prev) => ({ ...prev, [instrument]: next }));
          handleHit(instrument, next);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrument, notes]);

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

  const visibleInstruments = useMemo(
    () => originFilter === "All"
      ? INSTRUMENTS
      : INSTRUMENTS.filter((i) => i.origin === originFilter),
    [originFilter],
  );

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
                {rodaName}
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

          {/* Genre row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-pixel text-[10px] text-accent">GENRE</span>
            {isHost ? (
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="bg-night text-foreground text-display text-base px-2 py-1 pixel-border-sm outline-none focus:ring-2 focus:ring-mango"
                title="As host, you set the genre for this roda"
              >
                {GENRES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="inline-flex items-center gap-1 bg-night px-2 py-1 pixel-border-sm">
                <span>{genreMeta.emoji}</span>
                <span className="text-pixel text-[10px] text-mango">{genreMeta.name.toUpperCase()}</span>
              </div>
            )}
            {isHost && (
              <span className="text-display text-sm text-palm">★ you're the host</span>
            )}
          </div>

          {/* Players */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
              const p = players[i];
              const isMe = p?.id === playerIdRef.current;
              const isHostSlot = p?.id === hostId;
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
                        {isHostSlot ? "★ " : ""}{p.name}{isMe ? " (you)" : ""}
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

        {/* Note picker for selected pitched instrument */}
        {instrument && PITCHED[instrument] && (
          <div className="mt-6 bg-card pixel-border p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-pixel text-[10px] text-accent">
                NOTE · {INSTRUMENTS.find((x) => x.id === instrument)?.name.toUpperCase()}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PITCHED[instrument]!.map((n, idx) => {
                  const active = (notes[instrument] ?? PITCHED[instrument]![0]) === n;
                  const key = idx === 9 ? "0" : idx < 9 ? String(idx + 1) : null;
                  return (
                    <button
                      key={n}
                      onClick={() => {
                        setNotes((prev) => ({ ...prev, [instrument]: n }));
                        handleHit(instrument, n);
                      }}
                      className={`relative text-pixel text-[10px] px-2 py-1.5 pixel-border-sm transition-colors ${
                        active
                          ? "bg-mango text-night"
                          : "bg-night text-sand hover:bg-muted"
                      }`}
                    >
                      {n}
                      {key && (
                        <span className={`ml-1 text-[8px] opacity-70 ${active ? "text-night" : "text-accent"}`}>
                          [{key}]
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 text-display text-sm text-sand/60">
              Keys <span className="text-accent">1–9, 0</span> play notes · <span className="text-accent">←/→</span> cycle · <span className="text-accent">Space</span> replays
            </div>
          </div>
        )}

        {/* Region filter */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <h2 className="text-pixel text-sm text-coral mr-2">PICK YOUR INSTRUMENT</h2>
          <button
            onClick={() => setOriginFilter("All")}
            className={`text-pixel text-[9px] px-2 py-1 pixel-border-sm ${
              originFilter === "All" ? "bg-mango text-night" : "bg-night text-sand hover:bg-muted"
            }`}
          >
            ALL
          </button>
          {ORIGINS.map((o) => (
            <button
              key={o}
              onClick={() => setOriginFilter(o)}
              className={`text-pixel text-[9px] px-2 py-1 pixel-border-sm ${
                originFilter === o ? "bg-mango text-night" : "bg-night text-sand hover:bg-muted"
              }`}
            >
              {originLabel(o)}
            </button>
          ))}
        </div>

        {/* Instruments */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visibleInstruments.map((ins) => {
            const selected = instrument === ins.id;
            const isPitched = !!PITCHED[ins.id];
            const currentNote = notes[ins.id] ?? PITCHED[ins.id]?.[0];
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
                    {originLabel(ins.origin)}
                  </span>
                </div>
                <div className="mt-2 text-pixel text-[10px] text-mango">{ins.name.toUpperCase()}</div>
                <div className="text-display text-base text-sand/70">{ins.hint}</div>
                {isPitched && (
                  <div className="mt-1 text-pixel text-[9px] text-accent">
                    ♪ {currentNote}
                  </div>
                )}
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
