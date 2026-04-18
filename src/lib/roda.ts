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

export function generateRodaId(): string {
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
  player: Player;
  joinedAt: number;
  onHit: (h: HitEvent) => void;
  onPlayers: (players: Player[]) => void;
}): RealtimeChannel {
  const channel = supabase.channel(`roda:${opts.rodaId}`, {
    config: {
      // self: true so the sender's broadcast also comes back through the channel.
      // We play sound locally on send AND receive — dedup by checking playerId.
      broadcast: { self: false },
      presence: { key: opts.player.id },
    },
  });

  channel.on("broadcast", { event: "hit" }, (payload) => {
    opts.onHit(payload.payload as HitEvent);
  });

  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState<
      Player & { joinedAt: number }
    >();
    const players: Player[] = [];

    Object.values(state).forEach((entries) => {
      // Each presence key (player id) can have multiple entries — take the latest.
      const latest = entries[entries.length - 1];
      if (latest) {
        players.push({
          id: latest.id,
          name: latest.name,
          instrument: latest.instrument,
          color: latest.color,
        });
      }
    });

    // Sort by joinedAt so slot order is stable.
    const withTime = Object.values(state).map((entries) => {
      const latest = entries[entries.length - 1];
      return { player: { id: latest.id, name: latest.name, instrument: latest.instrument, color: latest.color } as Player, joinedAt: latest.joinedAt ?? 0 };
    });
    withTime.sort((a, b) => a.joinedAt - b.joinedAt);

    opts.onPlayers(withTime.map((x) => x.player));
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        ...opts.player,
        joinedAt: opts.joinedAt,
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

export async function updatePresence(
  channel: RealtimeChannel,
  player: Player,
  joinedAt: number,
) {
  await channel.track({
    ...player,
    joinedAt,
  });
}
