import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { generateRodaId } from "@/lib/roda";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Axé — Open a Roda, Jam Live with Friends" },
      {
        name: "description",
        content:
          "Create a free roda, share the link, and play 60+ virtual percussion & melody instruments from around the world — together, live, in your browser. No login.",
      },
      { property: "og:title", content: "Axé — Open a Roda, Jam Live with Friends" },
      {
        property: "og:description",
        content: "World percussion jam rooms — samba, afrobeat, gamelan, taiko & more. Pixelated. Real-time. No login.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();

  const createRoda = () => {
    const id = generateRodaId();
    navigate({ to: "/roda/$rodaId", params: { rodaId: id } });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <section className="text-center">
          <div className="inline-block bg-tropical pixel-border px-3 py-1 mb-6">
            <span className="text-pixel text-xs text-night">PIXEL · GLOBAL · LIVE</span>
          </div>
          <h1 className="text-pixel text-2xl sm:text-4xl md:text-5xl text-mango leading-tight">
            JAM IN A <span className="text-coral">RODA</span>
          </h1>
          <p className="mt-6 text-display text-xl sm:text-2xl text-sand max-w-2xl mx-auto">
            Open a roda, share the link, and play 60+ virtual instruments from
            around the world — live, in your browser. Up to 6 players. No login.
          </p>

          <div className="mt-10 mx-auto max-w-md bg-card pixel-border p-5 text-left">
            <button
              onClick={createRoda}
              className="w-full bg-mango text-night text-pixel text-sm py-4 pixel-border hover:bg-coral active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform"
            >
              ▶ OPEN A RODA
            </button>
            <p className="mt-3 text-center text-display text-base text-sand/70">
              Share the link with friends to jam together
            </p>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: "🌍", title: "60+ Instruments", desc: "Percussion & melody from Brazil, Africa, Asia, Andes, Europe & more." },
            { icon: "🎶", title: "Live Together", desc: "Hear every hit from every player in real time. Share the link." },
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
          🌴 Samba · Afrobeat · Gamelan · Taiko · Salsa · Celtic · Andean & beyond. 🌴
        </p>
      </main>
    </div>
  );
}
