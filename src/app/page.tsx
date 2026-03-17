"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleBuyNow = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowType: "all" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch { setLoading(false); }
  };

  return (
    <main style={{ padding: "28px 16px", maxWidth: 430, margin: "0 auto", color: "#fff" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,0,255,0.5)", marginBottom: 20 }}>For Flow Artists, By Flow Artists</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, textTransform: "uppercase", color: "#00FF00", margin: 0, lineHeight: 1.1 }}>Flow Arts</h1>
        <h2 style={{ fontSize: 18, fontWeight: 400, letterSpacing: 10, textTransform: "uppercase", color: "rgba(255,0,255,0.6)", margin: "4px 0 0", lineHeight: 1.3 }}>Professional</h2>
        <div style={{ width: "100%", maxWidth: 220, height: 1.5, background: "rgba(255,0,255,0.3)", margin: "16px auto", borderRadius: 1 }} />
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 auto", maxWidth: 340, lineHeight: 1.7, fontWeight: 300 }}>
          Tools that write your <span style={{ color: "rgba(0,255,0,0.8)", fontWeight: 500 }}>sponsor pitches</span>, build your <span style={{ color: "rgba(255,0,255,0.8)", fontWeight: 500 }}>booking sheets</span>, and assemble your <span style={{ color: "rgba(0,255,0,0.8)", fontWeight: 500 }}>press kit</span> — all from a few questions.
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,0,255,0.45)", fontWeight: 500, margin: "14px auto 0", letterSpacing: 0.5 }}>The Thinking Has Already Been Done, So You Can Create!</p>
      </div>

      {/* Money Hook */}
      <Section variant="green" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#00FF00", marginBottom: 2 }}>We Make Artists Money.</div>
        <Line color="magenta" width={310} />
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 300, lineHeight: 1.7, maxWidth: 340, margin: "0 auto" }}>When artists on our platform start landing paid gigs, word spreads fast. Flow Arts Professional gives you the tools to get booked <span style={{ color: "rgba(0,255,0,0.8)", fontWeight: 500 }}>quickly</span> — so you can focus on what you do best.</p>
      </Section>

      {/* YOUR MOMENT */}
      <Section variant="magenta" style={{ marginBottom: 12, textAlign: "left" as const }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#FF00FF" }}>This Is YOUR MOMENT.</div></div>
        <Line color="green" width={200} />
        <p className="sub" style={{ textAlign: "center", marginBottom: 14 }}>Flow arts is at the same stage right now that these industries were before they exploded.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          <EraItem name="Skateboarding" desc="Before the X Games gave it a platform." />
          <EraItem name="Esports" desc="Before Twitch turned gamers into athletes." />
          <EraItem name="DJing" desc="Before SoundCloud and Beatport built the ecosystem." />
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, lineHeight: 1.6, textAlign: "center" }}>The talent exists. The centralized system doesn&apos;t — <span style={{ color: "rgba(255,0,255,0.8)" }}>until now</span>.</p>
      </Section>

      {/* Core Problem */}
      <Section style={{ marginBottom: 12, textAlign: "left" as const }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}><div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>The Core Problem</div></div>
        <Line color="magenta" width={150} />
        <p className="sub" style={{ textAlign: "center", marginBottom: 14 }}>Brands and event organizers don&apos;t take flow artists seriously — not because they lack talent, but because they lack <span style={{ color: "rgba(255,0,255,0.7)", fontWeight: 500 }}>infrastructure</span>.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <GapItem title="No Portfolio Standard" desc="Models, DJs, and designers all have one. Flow artists don't." />
          <GapItem title="No Booking Marketplace" desc="DJs have platforms. Influencers have agencies. Flow artists have nothing." />
          <GapItem title="No Performance Metrics" desc="Beyond likes and views, there's no way to prove your value to a brand." />
          <GapItem title="No Brand Collab Pipeline" desc="No system to connect talented spinners with the companies that make their props." />
        </div>
      </Section>

      {/* Solution */}
      <Section variant="green" style={{ marginBottom: 12, textAlign: "left" as const }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#00FF00" }}>We&apos;re Defining The Industry Standard.</div></div>
        <Line color="magenta" width={330} />
        <p className="sub" style={{ textAlign: "center", marginBottom: 14 }}>Flow Arts Professional isn&apos;t just a tool. It&apos;s the infrastructure the industry has been missing.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SolveItem title="Artist Press Kit" desc="Your professional portfolio, generated and ready to send." />
          <SolveItem title="Event Booking Sheet" desc="Tech rider, rates, and availability that event producers can actually use." />
          <SolveItem title="Custom Sponsor Pitch" desc="Personalized outreach to 50+ brands, written with your stats and story." />
          <SolveItem title="Media Pipeline" desc="Upload your reel and we post it everywhere, tagging you and giving you credit." />
        </div>
      </Section>

      {/* Two-Sided Value */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <Section variant="magenta" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#FF00FF", textAlign: "center", marginBottom: 6 }}>For Brands</div>
          <Line color="green" width={80} />
          <BenefitItem color="magenta" text="Discover artists by niche and prop type." />
          <BenefitItem color="magenta" text="Offer sponsorships and affiliate deals." />
          <BenefitItem color="magenta" text="Track campaign performance." />
        </Section>
        <Section variant="green" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#00FF00", textAlign: "center", marginBottom: 6 }}>For Artists</div>
          <Line color="magenta" width={80} />
          <BenefitItem color="green" text="Land deals without chasing." />
          <BenefitItem color="green" text="A legit resume for partnerships." />
          <BenefitItem color="green" text="Get paid what you're worth." />
        </Section>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        <Section style={{ padding: "16px 10px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: "rgba(0,255,0,0.8)" }}>AI</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 300, marginTop: 4 }}>Written For You</div></Section>
        <Section style={{ padding: "16px 10px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,0,255,0.8)" }}>50+</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 300, marginTop: 4 }}>Brand Contacts</div></Section>
        <Section style={{ padding: "16px 10px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: "rgba(0,255,0,0.8)" }}>$5</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 300, marginTop: 4 }}>Lifetime Access</div></Section>
      </div>

      {/* UNLOCK + BUY NOW */}
      <div style={{ marginBottom: 20, padding: "28px 20px", textAlign: "center", background: "rgba(0,255,0,0.04)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "2px solid rgba(0,255,0,0.25)", borderRadius: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#00FF00", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Unlock Everything For $5</div>
        <div style={{ width: "100%", maxWidth: 340, height: 2, background: "rgba(255,0,255,0.3)", margin: "0 auto 10px", borderRadius: 1 }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 300, marginBottom: 16 }}>One-Time Payment. Lifetime Access. Unlimited Uses.</div>
        <button onClick={handleBuyNow} disabled={loading} style={{ width: "100%", maxWidth: 300, padding: "18px 32px", background: "#fff", color: "#000", fontFamily: "Montserrat, sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", border: "none", borderRadius: 16, cursor: loading ? "wait" : "pointer", transition: "all 0.15s ease", WebkitAppearance: "none" as const, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Redirecting..." : "BUY NOW!"}
        </button>
      </div>

      {/* Free Reel Upload */}
      <Section variant="magenta" style={{ marginBottom: 20, textAlign: "center" as const }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#FF00FF", marginBottom: 4 }}>Submit Your Flow Reel For Free!</div>
        <Line color="green" width={280} />
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 300, lineHeight: 1.6, marginBottom: 16 }}>Upload a video of your best flow performance. Your reel enters our media pipeline and gets posted everywhere, tagging you and giving you credit.</p>
        <div style={{ border: "1px dashed rgba(255,0,255,0.25)", borderRadius: 16, padding: "28px 16px", background: "rgba(255,0,255,0.02)" }}>
          <div style={{ fontSize: 13, color: "rgba(0,255,0,0.6)", fontWeight: 500 }}>Tap To Upload Video</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 300, marginTop: 4 }}>MP4, MOV, or WebM &bull; Up To 500 MB</div>
        </div>
      </Section>

      {/* Footer */}
      <div style={{ textAlign: "center", paddingTop: 16 }}>
        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,0,255,0.3)", margin: "0 0 4px" }}>Your Vibe Attracts Your Tribe.</p>
        <div style={{ width: "100%", maxWidth: 220, height: 1, background: "rgba(0,255,0,0.2)", margin: "0 auto 4px" }} />
        <p style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "rgba(0,255,0,0.25)", margin: 0 }}>Glow Wit Da Flow</p>
      </div>
    </main>
  );
}

function Section({ children, variant, style }: { children: React.ReactNode; variant?: "green" | "magenta"; style?: React.CSSProperties }) {
  const base: React.CSSProperties = { padding: 20, textAlign: "center", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", borderRadius: 20 };
  if (variant === "green") Object.assign(base, { background: "rgba(0,255,0,0.03)", border: "1px solid rgba(0,255,0,0.12)" });
  else if (variant === "magenta") Object.assign(base, { background: "rgba(255,0,255,0.03)", border: "1px solid rgba(255,0,255,0.12)" });
  else Object.assign(base, { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" });
  return <div style={{ ...base, ...style }}>{children}</div>;
}

function Line({ color, width }: { color: "green" | "magenta"; width: number }) {
  return <div style={{ width: "100%", maxWidth: width, height: 1.5, background: color === "green" ? "rgba(0,255,0,0.3)" : "rgba(255,0,255,0.3)", margin: "0 auto 8px", borderRadius: 1 }} />;
}

function EraItem({ name, desc }: { name: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,0,255,0.08)", border: "1px solid rgba(255,0,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="3,2 7,5 3,8" stroke="rgba(255,0,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div><div style={{ fontSize: 12, color: "rgba(255,0,255,0.7)", fontWeight: 600 }}>{name}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>{desc}</div></div>
    </div>
  );
}

function GapItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="rgba(255,80,80,0.6)" strokeWidth="1.5" strokeLinecap="round" /><line x1="8" y1="2" x2="2" y2="8" stroke="rgba(255,80,80,0.6)" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </div>
      <div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{title}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 300, marginTop: 2 }}>{desc}</div></div>
    </div>
  );
}

function SolveItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 14, background: "rgba(0,255,0,0.02)", border: "1px solid rgba(0,255,0,0.06)" }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="2,5.5 4,7.5 8,3" stroke="rgba(0,255,0,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div><div style={{ fontSize: 12, color: "rgba(0,255,0,0.7)", fontWeight: 500 }}>{title}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 300, marginTop: 2 }}>{desc}</div></div>
    </div>
  );
}

function BenefitItem({ color, text }: { color: "green" | "magenta"; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0" }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 4, background: color === "green" ? "rgba(0,255,0,0.4)" : "rgba(255,0,255,0.4)" }} />
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 300, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}
