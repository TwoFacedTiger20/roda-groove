import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { subscribeDiscovery, type PublicRoda } from "@/lib/roda";
import { GENRES } from "@/lib/instruments";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Live Rodas — Axé" },
      { name: "description", content: "See which world-music rodas are jamming right now and hop into one to play or just listen." },
      { property: "og:title", content: "Browse Live Rodas — Axé" },
      { property: "og:description", content: "Live percussion jams happening right now. Join in or just listen." },
    ],
  }),
  component: BrowsePage,
});

function genreMeta(id: string) {
  return GENRES.find((g) => g.id === id) ?? GENRES[0];
}

function BrowsePage() {
  const [rodas, setRodas] = useState<PublicRoda[]>([]);

  useEffect(() => {
    const ch = subscribeDiscovery(setRodas);
    return () => {
      ch.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-pixel text-xl sm:text-2xl text-mango">LIVE RODAS</h1>
        <p className="mt-2 text-display text-lg text-sand/90">
          Public jams happening right now. Pop in, play along, or just listen.
        </p>

        {rodas.length === 0 ? (
          <div className="mt-10 bg-card pixel-border p-8 text-center">
            <div className="text-5xl mb-3">🌴</div>
            <h2 className="text-pixel text-sm text-coral">NO ACTIVE RODAS</h2>
            <p className="mt-3 text-display text-lg text-sand/90">
              Be the first — open one and share the link.
            </p>
            <Link
              to="/"
              className="inline-block mt-5 bg-mango text-night text-pixel text-xs px-4 py-3 pixel-border hover:bg-coral"
            >
              ▶ OPEN A RODA
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rodas.map((r) => {
              const g = genreMeta(r.genre);
              return (
                <li key={r.id}>
                  <Link
                    to="/roda/$rodaId"
                    params={{ rodaId: r.id }}
                    className="block bg-card pixel-border p-5 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-pixel text-sm text-mango truncate">{r.name}</h3>
                        <p className="text-display text-base text-sand/70 mt-1">/{r.id}</p>
                        <div className="mt-2 inline-flex items-center gap-1 bg-night px-2 py-1 pixel-border-sm">
                          <span>{g.emoji}</span>
                          <span className="text-pixel text-[9px] text-accent">{g.name.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-pixel text-[10px] text-accent">
                          {r.playerCount}/6
                        </div>
                        <div className="text-display text-base text-palm flex items-center gap-1 mt-1">
                          <span className="inline-block h-2 w-2 bg-palm animate-pixel-pulse" />
                          LIVE
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
