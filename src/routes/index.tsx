import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { generateRodaId } from "@/lib/roda";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Axé — Open a Roda, Jam Live with Friends" },
      {
        name: "description",
        content:
          "Create a free roda, share the link, and play virtual surdo, conga, steel pan and more — together, live, in your browser. No login.",
      },
      { property: "og:title", content: "Axé — Open a Roda, Jam Live with Friends" },
      {
        property: "og:description",
        content: "Brazilian & Caribbean percussion jam rooms. Pixelated. Real-time. No login.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const createRoda = () => {
    const id = generateRodaId();
    const rodaName = name.trim() || "Open Roda";
    sessionStorage.setItem(`roda-name:${id}`, rodaName);
    navigate({ to: "/roda/$rodaId", params: { rodaId: id } });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        {/* Hero */}
        <section className="text-center">
          <div className="inline-block bg-tropical pixel-border px-3 py-1 mb-6">
            <span className="text-pixel text-xs text-night">PIXEL · TROPICAL · LIVE</span>
          </div>
          <h1 className="text-pixel text-2xl sm:text-4xl md:text-5xl text-mango leading-tight">
            JAM IN A <span className="text-coral">RODA</span>
          </h1>
          <p className="mt-6 text-display text-xl sm:text-2xl text-sand max-w-2xl mx-auto">
            Open a roda, share the link, and play virtual percussion together —
            live, in your browser. Up to 6 players. No login, ever.
          </p>

          {/* CTA card */}
          <div className="mt-10 mx-auto max-w-md bg-card pixel-border p-5 text-left">
            <label className="text-pixel text-[10px] text-mango block mb-2">
              RODA NAME (OPTIONAL)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bahia Sunset"
              maxLength={32}
              className="w-full bg-night text-foreground text-display text-xl px-3 py-2 pixel-border-sm outline-none focus:ring-2 focus:ring-mango"
              onKeyDown={(e) => e.key === "Enter" && createRoda()}
            />
            <button
              onClick={createRoda}
              className="mt-4 w-full bg-mango text-night text-pixel text-sm py-3 pixel-border hover:bg-coral active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform"
            >
              ▶ OPEN RODA
            </button>
            <Link
              to="/browse"
              className="block text-center mt-3 text-display text-lg text-accent hover:text-mango"
            >
              or browse live rodas →
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: "🥁", title: "14 Instruments", desc: "Brazilian samba & axé meets Caribbean and Latin percussion." },
            { icon: "🌐", title: "Live Together", desc: "Hear every hit from every player in real time. Share the link." },
            { icon: "💾", title: "Record & Save", desc: "Capture your jam and download it as audio." },
          ].map((f) => (
            <div key={f.title} className="bg-card pixel-border p-5">
              <div className="text-4xl mb-2">{f.icon}</div>
              <h3 className="text-pixel text-sm text-mango">{f.title}</h3>
              <p className="mt-2 text-display text-lg text-sand/90">{f.desc}</p>
            </div>
          ))}
        </section>

        <p className="mt-12 text-center text-display text-base text-muted-foreground">
          🌴 Made for samba, axé, capoeira, salsa, soca, calypso & beyond. 🌴
        </p>
      </main>
    </div>
  );
}
