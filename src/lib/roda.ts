// Roda realtime sync via Supabase Realtime broadcast + presence.
// Anonymous, ephemeral — no DB tables needed.

import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { InstrumentId } from "./instruments";

export const MAX_PLAYERS = 6;

export type Player = {
  id: string;          // random session id
  name: string;
  instrument: InstrumentId | null;
  color: string;
};

export type HitEvent = {
  playerId: string;
  instrument: InstrumentId;
  note?: string;
  at: number; // ms timestamp
};

export type RodaInfo = {
  id: string;
  name: string;
  createdAt: number;
};

export function generateRodaId(): string {
  // short, URL-safe id
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function generatePlayerId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const PLAYER_COLORS = [
  "var(--mango)",
  "var(--hibiscus)",
  "var(--palm)",
  "var(--accent)",
  "var(--coral)",
  "var(--ocean)",
];

export function colorForIndex(i: number): string {
  return PLAYER_COLORS[i % PLAYER_COLORS.length];
}

export function joinRoda(opts: {
  rodaId: string;
  rodaName: string;
  genre?: string;
  player: Player;
  onHit: (h: HitEvent) => void;
  onPlayers: (players: Player[]) => void;
  onMeta?: (meta: { rodaName: string; genre: string; hostId: string }) => void;
}): RealtimeChannel {
  const channel = supabase.channel(`roda:${opts.rodaId}`, {
    config: {
      broadcast: { self: false },
      presence: { key: opts.player.id },
    },
  });

  channel.on("broadcast", { event: "hit" }, (payload) => {
    opts.onHit(payload.payload as HitEvent);
  });

  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState<
      Player & { rodaName: string; genre?: string; joinedAt?: number }
    >();
    const players: Player[] = [];
    let host: { id: string; rodaName: string; genre: string; joinedAt: number } | null = null;
    Object.values(state).forEach((entries) => {
      entries.forEach((e) => {
        players.push({
          id: e.id,
          name: e.name,
          instrument: e.instrument,
          color: e.color,
        });
        const j = e.joinedAt ?? Number.MAX_SAFE_INTEGER;
        if (!host || j < host.joinedAt) {
          host = {
            id: e.id,
            rodaName: e.rodaName ?? "Roda",
            genre: e.genre ?? "open",
            joinedAt: j,
          };
        }
      });
    });
    opts.onPlayers(players);
    if (host && opts.onMeta) {
      opts.onMeta({ rodaName: host.rodaName, genre: host.genre, hostId: host.id });
    }
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        ...opts.player,
        rodaName: opts.rodaName,
        genre: opts.genre ?? "open",
        joinedAt: Date.now(),
      });
    }
  });

  return channel;
}

export async function broadcastHit(channel: RealtimeChannel, hit: HitEvent) {
  await channel.send({
    type: "broadcast",
    event: "hit",
    payload: hit,
  });
}

export async function updatePlayer(
  channel: RealtimeChannel,
  player: Player,
  rodaName: string,
  genre?: string,
) {
  await channel.track({
    ...player,
    rodaName,
    genre: genre ?? "open",
    joinedAt: (player as Player & { joinedAt?: number }).joinedAt ?? Date.now(),
  });
}

// Browse: subscribe to a discovery channel where each roda announces itself periodically.
export type PublicRoda = {
  id: string;
  name: string;
  playerCount: number;
  updatedAt: number;
};

const DISCOVERY_CHANNEL = "rodas:discovery";

export function announceRoda(info: { id: string; name: string; playerCount: number }): RealtimeChannel {
  const ch = supabase.channel(`announce:${info.id}`);
  ch.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await supabase.channel(DISCOVERY_CHANNEL).send({
        type: "broadcast",
        event: "alive",
        payload: { ...info, updatedAt: Date.now() },
      }).catch(() => {});
    }
  });
  return ch;
}

export function subscribeDiscovery(onUpdate: (rodas: PublicRoda[]) => void): RealtimeChannel {
  const rodas = new Map<string, PublicRoda>();
  const ch = supabase.channel(DISCOVERY_CHANNEL, { config: { broadcast: { self: true } } });

  ch.on("broadcast", { event: "alive" }, (payload) => {
    const r = payload.payload as PublicRoda;
    rodas.set(r.id, r);
    // Drop entries older than 20s
    const now = Date.now();
    for (const [id, roda] of rodas) {
      if (now - roda.updatedAt > 20000) rodas.delete(id);
    }
    onUpdate(Array.from(rodas.values()).sort((a, b) => b.updatedAt - a.updatedAt));
  });

  ch.subscribe();
  return ch;
}

export async function pingDiscovery(info: { id: string; name: string; playerCount: number }) {
  await supabase.channel(DISCOVERY_CHANNEL).send({
    type: "broadcast",
    event: "alive",
    payload: { ...info, updatedAt: Date.now() },
  }).catch(() => {});
}
