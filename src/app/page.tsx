"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Keyframes injected once ──
const KEYFRAMES = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(0,255,0,0.3), 0 0 60px rgba(0,255,0,0.1); }
  50% { box-shadow: 0 0 30px rgba(0,255,0,0.5), 0 0 80px rgba(0,255,0,0.2), 0 0 120px rgba(0,255,0,0.05); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes particleDrift {
  0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) translateX(40px) scale(0); opacity: 0; }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes headerSlideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
html { scroll-behavior: smooth; }
`;

// ── IntersectionObserver hook ──
function useReveal(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ── Main Page ──
export default function Home() {
  const [loading, setLoading] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

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

  // Sticky header on scroll
  useEffect(() => {
    const handler = () => setShowStickyHeader(window.scrollY > 300);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Inject keyframes
  useEffect(() => {
    const id = "fa-keyframes";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <>
      {/* Particle background */}
      <ParticleBackground />

      {/* Sticky header */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,255,0,0.15)",
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transform: showStickyHeader ? "translateY(0)" : "translateY(-100%)",
          opacity: showStickyHeader ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s ease",
          pointerEvents: showStickyHeader ? "auto" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#00FF00", letterSpacing: 3, textTransform: "uppercase", textShadow: "0 0 20px rgba(0,255,0,0.5)" }}>
            Flow Arts
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,0,255,0.6)", letterSpacing: 4, textTransform: "uppercase" }}>
            Pro
          </span>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={loading}
          style={{
            padding: "8px 20px", background: "#00FF00", color: "#000",
            fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 800,
            letterSpacing: 2, textTransform: "uppercase", border: "none",
            borderRadius: 8, cursor: loading ? "wait" : "pointer",
            boxShadow: "0 0 15px rgba(0,255,0,0.3)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(0,255,0,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(0,255,0,0.3)"; }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.95)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
        >
          {loading ? "..." : "$5"}
        </button>
      </div>

      <main style={{
        padding: "40px 20px 60px",
        maxWidth: 800,
        margin: "0 auto",
        color: "#fff",
        position: "relative",
        zIndex: 1,
      }}>

        {/* ── Header ── */}
        <RevealSection delay={0}>
          <div style={{ textAlign: "center", marginBottom: 48, paddingTop: 24 }}>
            <div style={{
              fontSize: "clamp(10px, 2.5vw, 12px)", letterSpacing: 6, textTransform: "uppercase",
              color: "rgba(255,0,255,0.5)", marginBottom: 24,
            }}>
              For Flow Artists, By Flow Artists
            </div>
            <h1 style={{
              fontSize: "clamp(40px, 10vw, 64px)", fontWeight: 900, letterSpacing: "clamp(6px, 2vw, 14px)",
              textTransform: "uppercase", color: "#00FF00", margin: 0, lineHeight: 1.05,
              textShadow: "0 0 40px rgba(0,255,0,0.4), 0 0 80px rgba(0,255,0,0.15)",
            }}>
              Flow Arts
            </h1>
            <h2 style={{
              fontSize: "clamp(16px, 4vw, 24px)", fontWeight: 400,
              letterSpacing: "clamp(8px, 2.5vw, 16px)", textTransform: "uppercase",
              color: "rgba(255,0,255,0.6)", margin: "6px 0 0", lineHeight: 1.3,
              textShadow: "0 0 30px rgba(255,0,255,0.25)",
            }}>
              Professional
            </h2>
            <div style={{
              width: "100%", maxWidth: 260, height: 2,
              background: "linear-gradient(90deg, transparent, rgba(255,0,255,0.5), transparent)",
              margin: "24px auto", borderRadius: 1,
            }} />
            <p style={{
              fontSize: "clamp(14px, 3.5vw, 17px)", color: "rgba(255,255,255,0.5)",
              margin: "0 auto", maxWidth: 500, lineHeight: 1.8, fontWeight: 300,
            }}>
              Tools that write your <Glow color="green">sponsor pitches</Glow>, build your{" "}
              <Glow color="magenta">booking sheets</Glow>, and assemble your{" "}
              <Glow color="green">press kit</Glow> — all from a few questions.
            </p>
            <p style={{
              fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,0,255,0.45)",
              fontWeight: 500, margin: "18px auto 0", letterSpacing: 0.5,
              textShadow: "0 0 20px rgba(255,0,255,0.15)",
            }}>
              The Thinking Has Already Been Done, So You Can Create!
            </p>
          </div>
        </RevealSection>

        {/* ── Money Hook ── */}
        <RevealSection delay={0.05}>
          <Section variant="green" style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: "clamp(24px, 6vw, 34px)", fontWeight: 800, color: "#00FF00", marginBottom: 4,
              textShadow: "0 0 30px rgba(0,255,0,0.35)",
            }}>
              We Make Artists Money.
            </div>
            <GradientLine color="magenta" />
            <p style={{
              fontSize: "clamp(13px, 3.2vw, 15px)", color: "rgba(255,255,255,0.5)",
              fontWeight: 300, lineHeight: 1.8, maxWidth: 520, margin: "0 auto",
            }}>
              When artists on our platform start landing paid gigs, word spreads fast. Flow Arts
              Professional gives you the tools to get booked{" "}
              <Glow color="green">quickly</Glow> — so you can focus on what you do best.
            </p>
          </Section>
        </RevealSection>

        {/* ── YOUR MOMENT ── */}
        <RevealSection delay={0.05}>
          <Section variant="magenta" style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{
                fontSize: "clamp(14px, 3.5vw, 18px)", fontWeight: 700, color: "#FF00FF",
                textShadow: "0 0 25px rgba(255,0,255,0.3)",
              }}>
                This Is YOUR MOMENT.
              </div>
            </div>
            <GradientLine color="green" />
            <p style={{
              textAlign: "center", marginBottom: 18,
              fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.45)",
              fontWeight: 400, lineHeight: 1.7, maxWidth: 480, marginLeft: "auto", marginRight: "auto",
            }}>
              Flow arts is at the same stage right now that these industries were before they exploded.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
              <EraItem name="Skateboarding" desc="Before the X Games gave it a platform." />
              <EraItem name="Esports" desc="Before Twitch turned gamers into athletes." />
              <EraItem name="DJing" desc="Before SoundCloud and Beatport built the ecosystem." />
            </div>
            <p style={{
              fontSize: "clamp(13px, 3.2vw, 15px)", color: "rgba(255,255,255,0.6)",
              fontWeight: 500, lineHeight: 1.6, textAlign: "center",
            }}>
              The talent exists. The centralized system doesn&apos;t —{" "}
              <span style={{ color: "rgba(255,0,255,0.8)", textShadow: "0 0 15px rgba(255,0,255,0.3)" }}>until now</span>.
            </p>
          </Section>
        </RevealSection>

        {/* ── Core Problem ── */}
        <RevealSection delay={0.05}>
          <Section style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{
                fontSize: "clamp(14px, 3.5vw, 18px)", fontWeight: 700, color: "rgba(255,255,255,0.85)",
              }}>
                The Core Problem
              </div>
            </div>
            <GradientLine color="magenta" />
            <p style={{
              textAlign: "center", marginBottom: 18,
              fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.45)",
              fontWeight: 400, lineHeight: 1.7, maxWidth: 520, marginLeft: "auto", marginRight: "auto",
            }}>
              Brands and event organizers don&apos;t take flow artists seriously — not because they
              lack talent, but because they lack{" "}
              <span style={{ color: "rgba(255,0,255,0.7)", fontWeight: 500 }}>infrastructure</span>.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
              <GapItem title="No Portfolio Standard" desc="Models, DJs, and designers all have one. Flow artists don't." />
              <GapItem title="No Booking Marketplace" desc="DJs have platforms. Influencers have agencies. Flow artists have nothing." />
              <GapItem title="No Performance Metrics" desc="Beyond likes and views, there's no way to prove your value to a brand." />
              <GapItem title="No Brand Collab Pipeline" desc="No system to connect talented spinners with the companies that make their props." />
            </div>
          </Section>
        </RevealSection>

        {/* ── Solution ── */}
        <RevealSection delay={0.05}>
          <Section variant="green" style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{
                fontSize: "clamp(14px, 3.5vw, 18px)", fontWeight: 700, color: "#00FF00",
                textShadow: "0 0 25px rgba(0,255,0,0.3)",
              }}>
                We&apos;re Defining The Industry Standard.
              </div>
            </div>
            <GradientLine color="magenta" />
            <p style={{
              textAlign: "center", marginBottom: 18,
              fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.45)",
              fontWeight: 400, lineHeight: 1.7, maxWidth: 520, marginLeft: "auto", marginRight: "auto",
            }}>
              Flow Arts Professional isn&apos;t just a tool. It&apos;s the infrastructure the industry has been missing.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
              <SolveItem title="Artist Press Kit" desc="Your professional portfolio, generated and ready to send." />
              <SolveItem title="Event Booking Sheet" desc="Tech rider, rates, and availability that event producers can actually use." />
              <SolveItem title="Custom Sponsor Pitch" desc="Personalized outreach to 50+ brands, written with your stats and story." />
              <SolveItem title="Media Pipeline" desc="Upload your reel and we post it everywhere, tagging you and giving you credit." />
            </div>
          </Section>
        </RevealSection>

        {/* ── Two-Sided Value ── */}
        <RevealSection delay={0.05}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}>
            <Section variant="magenta" style={{ padding: "clamp(16px, 4vw, 24px)" }}>
              <div style={{
                fontSize: "clamp(13px, 3.3vw, 16px)", fontWeight: 700, color: "#FF00FF",
                textAlign: "center", marginBottom: 8,
                textShadow: "0 0 20px rgba(255,0,255,0.3)",
              }}>
                For Brands
              </div>
              <GradientLine color="green" />
              <BenefitItem color="magenta" text="Discover artists by niche and prop type." />
              <BenefitItem color="magenta" text="Offer sponsorships and affiliate deals." />
              <BenefitItem color="magenta" text="Track campaign performance." />
            </Section>
            <Section variant="green" style={{ padding: "clamp(16px, 4vw, 24px)" }}>
              <div style={{
                fontSize: "clamp(13px, 3.3vw, 16px)", fontWeight: 700, color: "#00FF00",
                textAlign: "center", marginBottom: 8,
                textShadow: "0 0 20px rgba(0,255,0,0.3)",
              }}>
                For Artists
              </div>
              <GradientLine color="magenta" />
              <BenefitItem color="green" text="Land deals without chasing." />
              <BenefitItem color="green" text="A legit resume for partnerships." />
              <BenefitItem color="green" text="Get paid what you're worth." />
            </Section>
          </div>
        </RevealSection>

        {/* ── Stats ── */}
        <RevealSection delay={0.05}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(10px, 3vw, 16px)",
            marginBottom: 32,
          }}>
            <StatCard value="AI" label="Written For You" color="green" />
            <StatCard value="50+" label="Brand Contacts" color="magenta" />
            <StatCard value="$5" label="Lifetime Access" color="green" />
          </div>
        </RevealSection>

        {/* ── UNLOCK + BUY NOW ── */}
        <RevealSection delay={0.05}>
          <div style={{
            marginBottom: 32,
            padding: "clamp(24px, 6vw, 40px) clamp(20px, 5vw, 32px)",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(0,255,0,0.06) 0%, rgba(0,255,0,0.02) 50%, rgba(255,0,255,0.04) 100%)",
            backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            border: "2px solid rgba(0,255,0,0.25)",
            borderRadius: 28,
            boxShadow: "0 0 60px rgba(0,255,0,0.06), inset 0 0 60px rgba(0,255,0,0.02)",
          }}>
            <div style={{
              fontSize: "clamp(22px, 5.5vw, 32px)", fontWeight: 900, color: "#00FF00",
              letterSpacing: "clamp(2px, 0.8vw, 5px)", textTransform: "uppercase", marginBottom: 8,
              textShadow: "0 0 30px rgba(0,255,0,0.4), 0 0 60px rgba(0,255,0,0.15)",
            }}>
              Unlock Everything For $5
            </div>
            <div style={{
              width: "100%", maxWidth: 400, height: 2,
              background: "linear-gradient(90deg, transparent, rgba(255,0,255,0.5), transparent)",
              margin: "0 auto 14px", borderRadius: 1,
            }} />
            <div style={{
              fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.35)",
              fontWeight: 300, marginBottom: 24,
            }}>
              One-Time Payment. Lifetime Access. Unlimited Uses.
            </div>
            <button
              onClick={handleBuyNow}
              disabled={loading}
              style={{
                width: "100%", maxWidth: 340,
                padding: "clamp(16px, 4vw, 22px) 32px",
                background: "linear-gradient(135deg, #00FF00 0%, #00DD00 100%)",
                color: "#000",
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(18px, 4.5vw, 24px)",
                fontWeight: 900,
                letterSpacing: "clamp(3px, 1vw, 6px)",
                textTransform: "uppercase",
                border: "none",
                borderRadius: 16,
                cursor: loading ? "wait" : "pointer",
                transition: "transform 0.15s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease",
                WebkitAppearance: "none" as const,
                opacity: loading ? 0.7 : 1,
                animation: loading ? "none" : "pulseGlow 2.5s ease-in-out infinite",
                boxShadow: "0 0 20px rgba(0,255,0,0.3), 0 0 60px rgba(0,255,0,0.1)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
            >
              {loading ? "Redirecting..." : "BUY NOW!"}
            </button>
          </div>
        </RevealSection>

        {/* ── Free Reel Upload ── */}
        <RevealSection delay={0.05}>
          <Section variant="magenta" style={{ marginBottom: 32, textAlign: "center" as const }}>
            <div style={{
              fontSize: "clamp(14px, 3.5vw, 18px)", fontWeight: 600, color: "#FF00FF", marginBottom: 6,
              textShadow: "0 0 20px rgba(255,0,255,0.3)",
            }}>
              Submit Your Flow Reel For Free!
            </div>
            <GradientLine color="green" />
            <p style={{
              fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.4)",
              fontWeight: 300, lineHeight: 1.7, marginBottom: 20, maxWidth: 480,
              marginLeft: "auto", marginRight: "auto",
            }}>
              Upload a video of your best flow performance. Your reel enters our media pipeline and
              gets posted everywhere, tagging you and giving you credit.
            </p>
            <UploadZone />
          </Section>
        </RevealSection>

        {/* ── Footer ── */}
        <RevealSection delay={0.05}>
          <div style={{ textAlign: "center", paddingTop: 24, paddingBottom: 16 }}>
            <p style={{
              fontSize: "clamp(10px, 2.5vw, 12px)", letterSpacing: 4, textTransform: "uppercase",
              color: "rgba(255,0,255,0.35)", margin: "0 0 8px",
              textShadow: "0 0 15px rgba(255,0,255,0.15)",
            }}>
              Your Vibe Attracts Your Tribe.
            </p>
            <div style={{
              width: "100%", maxWidth: 260, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(0,255,0,0.3), transparent)",
              margin: "0 auto 8px",
            }} />
            <p style={{
              fontSize: "clamp(9px, 2.2vw, 11px)", letterSpacing: 3, textTransform: "uppercase",
              color: "rgba(0,255,0,0.3)", margin: 0,
              textShadow: "0 0 15px rgba(0,255,0,0.1)",
            }}>
              Glow Wit Da Flow
            </p>
          </div>
        </RevealSection>
      </main>
    </>
  );
}

// ── RevealSection wrapper ──
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(.4,0,.2,1) ${delay}s, transform 0.7s cubic-bezier(.4,0,.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Section card ──
function Section({ children, variant, style }: { children: React.ReactNode; variant?: "green" | "magenta"; style?: React.CSSProperties }) {
  const base: React.CSSProperties = {
    padding: "clamp(20px, 5vw, 28px)",
    textAlign: "center",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    borderRadius: 24,
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  };
  if (variant === "green") {
    Object.assign(base, {
      background: "linear-gradient(135deg, rgba(0,255,0,0.05) 0%, rgba(0,255,0,0.015) 100%)",
      border: "1px solid rgba(0,255,0,0.15)",
      boxShadow: "0 0 40px rgba(0,255,0,0.03), inset 0 0 40px rgba(0,255,0,0.01)",
    });
  } else if (variant === "magenta") {
    Object.assign(base, {
      background: "linear-gradient(135deg, rgba(255,0,255,0.05) 0%, rgba(255,0,255,0.015) 100%)",
      border: "1px solid rgba(255,0,255,0.15)",
      boxShadow: "0 0 40px rgba(255,0,255,0.03), inset 0 0 40px rgba(255,0,255,0.01)",
    });
  } else {
    Object.assign(base, {
      background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 0 40px rgba(255,255,255,0.01)",
    });
  }
  return <div style={{ ...base, ...style }}>{children}</div>;
}

// ── Gradient line divider ──
function GradientLine({ color }: { color: "green" | "magenta" }) {
  const c = color === "green" ? "0,255,0" : "255,0,255";
  return (
    <div style={{
      width: "100%", maxWidth: 280, height: 2,
      background: `linear-gradient(90deg, transparent, rgba(${c},0.5), transparent)`,
      margin: "0 auto 12px", borderRadius: 1,
    }} />
  );
}

// ── Glow text span ──
function Glow({ color, children }: { color: "green" | "magenta"; children: React.ReactNode }) {
  const c = color === "green" ? "#00FF00" : "#FF00FF";
  const rgb = color === "green" ? "0,255,0" : "255,0,255";
  return (
    <span style={{
      color: `rgba(${rgb},0.85)`, fontWeight: 500,
      textShadow: `0 0 12px rgba(${rgb},0.3)`,
    }}>
      {children}
    </span>
  );
}

// ── Era comparison item ──
function EraItem({ name, desc }: { name: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 16,
        background: hovered ? "rgba(255,0,255,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(255,0,255,0.2)" : "rgba(255,255,255,0.05)"}`,
        transition: "all 0.25s ease",
        cursor: "default",
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 8,
        background: "rgba(255,0,255,0.08)", border: "1px solid rgba(255,0,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: hovered ? "0 0 12px rgba(255,0,255,0.2)" : "none",
        transition: "box-shadow 0.25s ease",
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="3,2 7,5 3,8" stroke="rgba(255,0,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,0,255,0.75)", fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.35)", fontWeight: 300, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Gap/problem item ──
function GapItem({ title, desc }: { title: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px", borderRadius: 16,
        background: hovered ? "rgba(255,80,80,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(255,80,80,0.15)" : "rgba(255,255,255,0.05)"}`,
        transition: "all 0.25s ease",
        cursor: "default",
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 8,
        background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
        boxShadow: hovered ? "0 0 12px rgba(255,80,80,0.15)" : "none",
        transition: "box-shadow 0.25s ease",
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <line x1="2" y1="2" x2="8" y2="8" stroke="rgba(255,80,80,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="2" x2="2" y2="8" stroke="rgba(255,80,80,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.35)", fontWeight: 300, marginTop: 3 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Solution item ──
function SolveItem({ title, desc }: { title: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px", borderRadius: 16,
        background: hovered ? "rgba(0,255,0,0.06)" : "rgba(0,255,0,0.02)",
        border: `1px solid ${hovered ? "rgba(0,255,0,0.2)" : "rgba(0,255,0,0.06)"}`,
        transition: "all 0.25s ease",
        cursor: "default",
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 8,
        background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
        boxShadow: hovered ? "0 0 12px rgba(0,255,0,0.2)" : "none",
        transition: "box-shadow 0.25s ease",
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="2,5.5 4,7.5 8,3" stroke="rgba(0,255,0,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(0,255,0,0.75)", fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.35)", fontWeight: 300, marginTop: 3 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Benefit bullet item ──
function BenefitItem({ color, text }: { color: "green" | "magenta"; text: string }) {
  const rgb = color === "green" ? "0,255,0" : "255,0,255";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0" }}>
      <div style={{
        width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 4,
        background: `rgba(${rgb},0.5)`,
        boxShadow: `0 0 8px rgba(${rgb},0.3)`,
      }} />
      <div style={{
        fontSize: "clamp(11px, 2.8vw, 14px)", color: "rgba(255,255,255,0.5)",
        fontWeight: 300, lineHeight: 1.6,
      }}>
        {text}
      </div>
    </div>
  );
}

// ── Stat card ──
function StatCard({ value, label, color }: { value: string; label: string; color: "green" | "magenta" }) {
  const rgb = color === "green" ? "0,255,0" : "255,0,255";
  return (
    <Section style={{
      padding: "clamp(16px, 4vw, 24px) clamp(10px, 3vw, 16px)",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: "clamp(22px, 5.5vw, 32px)", fontWeight: 700,
        color: `rgba(${rgb},0.85)`,
        textShadow: `0 0 20px rgba(${rgb},0.3)`,
        animation: "float 4s ease-in-out infinite",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: "clamp(9px, 2.2vw, 11px)", color: "rgba(255,255,255,0.3)",
        fontWeight: 300, marginTop: 6, letterSpacing: 0.5,
      }}>
        {label}
      </div>
    </Section>
  );
}

// ── Upload zone ──
function UploadZone() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1.5px dashed ${hovered ? "rgba(255,0,255,0.4)" : "rgba(255,0,255,0.2)"}`,
        borderRadius: 20,
        padding: "clamp(24px, 6vw, 36px) clamp(16px, 4vw, 24px)",
        background: hovered ? "rgba(255,0,255,0.04)" : "rgba(255,0,255,0.015)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        boxShadow: hovered ? "0 0 30px rgba(255,0,255,0.06)" : "none",
        maxWidth: 400, marginLeft: "auto", marginRight: "auto",
      }}
    >
      <div style={{
        fontSize: "clamp(13px, 3.2vw, 15px)", color: "rgba(0,255,0,0.65)", fontWeight: 500,
        textShadow: hovered ? "0 0 12px rgba(0,255,0,0.2)" : "none",
        transition: "text-shadow 0.3s ease",
      }}>
        Tap To Upload Video
      </div>
      <div style={{
        fontSize: "clamp(10px, 2.5vw, 12px)", color: "rgba(255,255,255,0.25)",
        fontWeight: 300, marginTop: 6,
      }}>
        MP4, MOV, or WebM &bull; Up To 500 MB
      </div>
    </div>
  );
}

// ── CSS Particle background ──
function ParticleBackground() {
  const particles = useRef<Array<{ left: string; size: number; delay: number; duration: number; color: string }> | null>(null);
  if (!particles.current) {
    particles.current = Array.from({ length: 30 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 20,
      duration: Math.random() * 15 + 15,
      color: i % 3 === 0 ? "rgba(0,255,0,0.15)" : i % 3 === 1 ? "rgba(255,0,255,0.12)" : "rgba(255,255,255,0.04)",
    }));
  }
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      overflow: "hidden", zIndex: 0, pointerEvents: "none",
    }}>
      {/* Radial glow layers */}
      <div style={{
        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "120vw", height: "60vh",
        background: "radial-gradient(ellipse at center, rgba(0,255,0,0.04) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "100vw", height: "50vh",
        background: "radial-gradient(ellipse at center, rgba(255,0,255,0.03) 0%, transparent 70%)",
      }} />
      {/* Floating particles */}
      {particles.current.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: "-10px",
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `particleDrift ${p.duration}s linear ${p.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
