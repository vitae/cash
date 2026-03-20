"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Keyframes injected once ──
const KEYFRAMES = `
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(0,255,0,0.4), 0 0 60px rgba(0,255,0,0.2); }
  50% { box-shadow: 0 0 40px rgba(0,255,0,0.6), 0 0 100px rgba(0,255,0,0.3), 0 0 160px rgba(0,255,0,0.1); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes particleDrift {
  0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) translateX(60px) scale(0); opacity: 0; }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes headerSlideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes spinBorder {
  from { --angle: 0deg; }
  to { --angle: 360deg; }
}
@keyframes buyPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(0,255,0,0.5), 0 0 80px rgba(0,255,0,0.2), 0 0 120px rgba(255,0,255,0.1); }
  50% { transform: scale(1.02); box-shadow: 0 0 40px rgba(255,0,255,0.5), 0 0 100px rgba(255,0,255,0.3), 0 0 160px rgba(0,255,0,0.1); }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes neonFlicker {
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.8; }
  94% { opacity: 1; }
  96% { opacity: 0.9; }
  97% { opacity: 1; }
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
  const [hasAccess, setHasAccess] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check if user already has access (returning customer)
  useEffect(() => {
    const stored = localStorage.getItem("fa_session_id");
    const urlParams = new URLSearchParams(window.location.search);
    const urlSession = urlParams.get("session_id");
    const sid = urlSession || stored;

    if (!sid) { setCheckingAccess(false); return; }

    fetch(`/api/verify?session_id=${encodeURIComponent(sid)}`)
      .then(r => r.json())
      .then(data => {
        if (data.verified) {
          setHasAccess(true);
          setSessionId(sid);
          localStorage.setItem("fa_session_id", sid);
        } else {
          localStorage.removeItem("fa_session_id");
        }
      })
      .catch(() => { localStorage.removeItem("fa_session_id"); })
      .finally(() => setCheckingAccess(false));
  }, []);

  const [showCheckout, setShowCheckout] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const handleBuyNow = () => {
    setShowCheckout(true);
    setTimeout(() => {
      checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flowType: "all" }),
    });
    const data = await res.json();
    return data.clientSecret;
  }, []);

  const goToGenerators = () => {
    if (sessionId) {
      window.location.href = `/success?session_id=${encodeURIComponent(sessionId)}`;
    }
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

      {/* Noise/grain overlay */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0, pointerEvents: "none", opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "180px 180px",
      }} />

      {/* Sticky header */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(0,255,0,0.3)",
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transform: showStickyHeader ? "translateY(0)" : "translateY(-100%)",
          opacity: showStickyHeader ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s ease",
          pointerEvents: showStickyHeader ? "auto" : "none",
          boxShadow: showStickyHeader ? "0 4px 40px rgba(0,255,0,0.15), 0 1px 0 rgba(0,255,0,0.3)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontSize: 16, fontWeight: 900, color: "#00FF00", letterSpacing: 3, textTransform: "uppercase",
            textShadow: "0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5)",
          }}>
            Flow Arts
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#FF00FF", letterSpacing: 4, textTransform: "uppercase",
            textShadow: "0 0 10px #FF00FF, 0 0 30px rgba(255,0,255,0.5)",
          }}>
            Pro
          </span>
        </div>
        <button
          onClick={hasAccess ? goToGenerators : handleBuyNow}
          disabled={loading}
          style={{
            padding: "8px 20px",
            background: "linear-gradient(135deg, #00FF00 0%, #FF00FF 100%)",
            backgroundSize: "200% 200%",
            animation: "gradientShift 3s ease infinite",
            color: "#000",
            fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 900,
            letterSpacing: 2, textTransform: "uppercase", border: "none",
            borderRadius: 8, cursor: loading ? "wait" : "pointer",
            boxShadow: "0 0 15px rgba(0,255,0,0.4), 0 0 30px rgba(255,0,255,0.2)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(0,255,0,0.6), 0 0 50px rgba(255,0,255,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(0,255,0,0.4), 0 0 30px rgba(255,0,255,0.2)"; }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.95)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
        >
          {loading ? "..." : hasAccess ? "GENERATORS" : "ONLY $5"}
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
          <div style={{ textAlign: "center", marginBottom: 56, paddingTop: 32 }}>
            <div style={{
              fontSize: "clamp(11px, 2.5vw, 13px)", letterSpacing: 8, textTransform: "uppercase",
              color: "#FF00FF", marginBottom: 28,
              textShadow: "0 0 10px #FF00FF, 0 0 40px #FF00FF, 0 0 80px rgba(255,0,255,0.5)",
              animation: "neonFlicker 5s ease-in-out infinite",
            }}>
              For Flow Artists, By Flow Artists
            </div>
            <h1 style={{
              fontSize: "clamp(48px, 12vw, 80px)", fontWeight: 900, letterSpacing: "clamp(8px, 3vw, 20px)",
              textTransform: "uppercase", margin: 0, lineHeight: 1.0,
              background: "linear-gradient(135deg, #00FF00 0%, #00FF99 25%, #FF00FF 50%, #FF00FF 75%, #00FF00 100%)",
              backgroundSize: "300% 300%",
              animation: "gradientShift 6s ease infinite",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 30px rgba(0,255,0,0.4)) drop-shadow(0 0 60px rgba(255,0,255,0.2))",
            }}>
              Flow Arts
            </h1>
            <h2 style={{
              fontSize: "clamp(20px, 5vw, 32px)", fontWeight: 300,
              letterSpacing: "clamp(10px, 3vw, 22px)", textTransform: "uppercase",
              color: "#FF00FF", margin: "8px 0 0", lineHeight: 1.3,
              textShadow: "0 0 10px #FF00FF, 0 0 40px #FF00FF, 0 0 80px rgba(255,0,255,0.5)",
            }}>
              Professional
            </h2>
            <div style={{
              width: "100%", maxWidth: 300, height: 2,
              background: "linear-gradient(90deg, transparent, #FF00FF, transparent)",
              margin: "28px auto", borderRadius: 1,
              boxShadow: "0 0 15px rgba(255,0,255,0.5)",
            }} />

            {/* Prominent OPEN GENERATORS button for paid users */}
            {hasAccess && (
              <button
                onClick={goToGenerators}
                style={{
                  marginTop: 32,
                  width: "100%", maxWidth: 380,
                  padding: "clamp(18px, 4.5vw, 24px) 32px",
                  background: "linear-gradient(135deg, #00FF00 0%, #00DD00 30%, #FF00FF 70%, #00FF00 100%)",
                  backgroundSize: "300% 300%",
                  animation: "gradientShift 3s ease infinite, buyPulse 2.5s ease-in-out infinite",
                  color: "#000",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(18px, 4.5vw, 26px)",
                  fontWeight: 900,
                  letterSpacing: "clamp(3px, 1vw, 7px)",
                  textTransform: "uppercase" as const,
                  border: "none",
                  borderRadius: 16,
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(0,255,0,0.5), 0 0 80px rgba(0,255,0,0.2), 0 0 120px rgba(255,0,255,0.1)",
                  transition: "transform 0.15s cubic-bezier(.4,0,.2,1)",
                  WebkitAppearance: "none" as const,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
              >
                OPEN GENERATORS
              </button>
            )}
          </div>
        </RevealSection>

        {/* ── Money Hook ── */}
        <RevealSection delay={0.05}>
          <Section variant="green" style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: "clamp(26px, 6.5vw, 38px)", fontWeight: 900, color: "#00FF00", marginBottom: 6,
              textShadow: "0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5)",
            }}>
              We Make Artists Money.
            </div>
            <GradientLine color="magenta" />
            <p style={{
              fontSize: "clamp(13px, 3.2vw, 16px)", color: "rgba(255,255,255,0.85)",
              fontWeight: 300, lineHeight: 1.8, maxWidth: 520, margin: "0 auto",
            }}>
              When artists on our platform start landing paid gigs, word spreads fast. Flow Arts
              Professional gives you the tools to get booked{" "}
              <Glow color="green">quickly</Glow> — so you can focus on what you do best.
            </p>
          </Section>
        </RevealSection>

        {/* ── Free Reel Upload ── */}
        <RevealSection delay={0.05}>
          <Section variant="magenta" style={{ marginBottom: 32, textAlign: "center" as const }}>
            <div style={{
              fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700, color: "#FF00FF", marginBottom: 6,
              textShadow: "0 0 10px #FF00FF, 0 0 40px #FF00FF, 0 0 80px rgba(255,0,255,0.5)",
            }}>
              Submit Your Flow Reel For Free!
            </div>
            <GradientLine color="green" />
            <p style={{
              fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.8)",
              fontWeight: 300, lineHeight: 1.7, marginBottom: 20, maxWidth: 480,
              marginLeft: "auto", marginRight: "auto",
            }}>
              Upload a video of your best flow performance. Your reel enters our media pipeline and
              gets posted everywhere, tagging you and giving you credit.
            </p>
            <UploadZone />
          </Section>
        </RevealSection>

        {/* ── YOUR MOMENT ── */}
        <RevealSection delay={0.05}>
          <Section variant="green" style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{
                fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 800, color: "#00FF00",
                textShadow: "0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5)",
              }}>
                This Is YOUR MOMENT.
              </div>
            </div>
            <GradientLine color="green" />
            <p style={{
              textAlign: "center", marginBottom: 18,
              fontSize: "clamp(12px, 3vw, 15px)", color: "rgba(255,255,255,0.8)",
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
              fontSize: "clamp(14px, 3.2vw, 16px)", color: "rgba(255,255,255,0.85)",
              fontWeight: 500, lineHeight: 1.6, textAlign: "center",
            }}>
              The talent exists. The centralized system doesn&apos;t —{" "}
              <span style={{ color: "#FF00FF", textShadow: "0 0 10px #FF00FF, 0 0 30px rgba(255,0,255,0.5)" }}>until now</span>.
            </p>
          </Section>
        </RevealSection>

        {/* ── Core Problem ── */}
        <RevealSection delay={0.05}>
          <Section variant="red" style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{
                fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 800, color: "#FF0000",
                textShadow: "0 0 10px #FF0000, 0 0 40px #FF0000, 0 0 80px rgba(255,0,0,0.5)",
              }}>
                The Core Problem
              </div>
            </div>
            <GradientLine color="red" />
            <p style={{
              textAlign: "center", marginBottom: 18,
              fontSize: "clamp(12px, 3vw, 15px)", color: "rgba(255,255,255,0.8)",
              fontWeight: 400, lineHeight: 1.7, maxWidth: 520, marginLeft: "auto", marginRight: "auto",
            }}>
              Brands and event organizers don&apos;t take flow artists seriously — not because they
              lack talent, but because they lack{" "}
              <span style={{ color: "#FF00FF", fontWeight: 600, textShadow: "0 0 10px #FF00FF, 0 0 20px rgba(255,0,255,0.3)" }}>infrastructure</span>.
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
                fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 800, color: "#00FF00",
                textShadow: "0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5)",
              }}>
                We&apos;re Defining The Industry Standard.
              </div>
            </div>
            <GradientLine color="magenta" />
            <p style={{
              textAlign: "center", marginBottom: 18,
              fontSize: "clamp(12px, 3vw, 15px)", color: "rgba(255,255,255,0.8)",
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
                fontSize: "clamp(14px, 3.5vw, 18px)", fontWeight: 800, color: "#FF00FF",
                textAlign: "center", marginBottom: 8,
                textShadow: "0 0 10px #FF00FF, 0 0 40px #FF00FF, 0 0 80px rgba(255,0,255,0.5)",
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
                fontSize: "clamp(14px, 3.5vw, 18px)", fontWeight: 800, color: "#00FF00",
                textAlign: "center", marginBottom: 8,
                textShadow: "0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5)",
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
            padding: "clamp(28px, 7vw, 48px) clamp(20px, 5vw, 36px)",
            textAlign: "center",
            background: "radial-gradient(ellipse at 20% 0%, rgba(0,255,0,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(255,0,255,0.08) 0%, transparent 50%), rgba(0,0,0,0.6)",
            backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            border: "2px solid rgba(0,255,0,0.4)",
            borderRadius: 28,
            boxShadow: "0 0 20px rgba(0,255,0,0.3), 0 0 60px rgba(0,255,0,0.1), inset 0 1px 0 rgba(0,255,0,0.2)",
            position: "relative" as const,
            overflow: "hidden",
          }}>
            {/* Gradient mesh bleed */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
              background: "radial-gradient(circle at 0% 0%, rgba(0,255,0,0.06) 0%, transparent 40%), radial-gradient(circle at 100% 100%, rgba(255,0,255,0.06) 0%, transparent 40%)",
            }} />
            <div style={{
              fontSize: "clamp(24px, 6vw, 38px)", fontWeight: 900,
              letterSpacing: "clamp(3px, 1vw, 6px)", textTransform: "uppercase", marginBottom: 10,
              background: "linear-gradient(135deg, #00FF00, #00FFAA, #FF00FF, #00FF00)",
              backgroundSize: "300% 300%",
              animation: "gradientShift 4s ease infinite",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(0,255,0,0.4))",
              position: "relative" as const,
            }}>
              {hasAccess ? "Your Generators Are Ready" : (<>UNLOCK EVERYTHING<br />FOR ONLY $5</>)}
            </div>
            <div style={{
              width: "100%", maxWidth: 400, height: 2,
              background: "linear-gradient(90deg, transparent, #FF00FF, transparent)",
              margin: "0 auto 14px", borderRadius: 1,
              boxShadow: "0 0 10px rgba(255,0,255,0.5)",
            }} />
            <div style={{
              fontSize: "clamp(12px, 2.8vw, 14px)", color: "rgba(255,255,255,0.7)",
              fontWeight: 300, marginBottom: 28,
            }}>
              {hasAccess ? "You have lifetime access. Open your generators anytime." : "One-Time Payment. Unlimited Lifetime Access."}
            </div>
            {hasAccess ? (
              <button
                onClick={goToGenerators}
                style={{
                  width: "100%", maxWidth: 360,
                  padding: "clamp(18px, 4.5vw, 24px) 32px",
                  background: "linear-gradient(135deg, #00FF00 0%, #00DD00 30%, #FF00FF 70%, #00FF00 100%)",
                  backgroundSize: "300% 300%",
                  animation: "gradientShift 3s ease infinite, buyPulse 2.5s ease-in-out infinite",
                  color: "#000",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(20px, 5vw, 28px)",
                  fontWeight: 900,
                  letterSpacing: "clamp(4px, 1.2vw, 8px)",
                  textTransform: "uppercase",
                  border: "none",
                  borderRadius: 16,
                  cursor: "pointer",
                  transition: "transform 0.15s cubic-bezier(.4,0,.2,1)",
                  WebkitAppearance: "none" as const,
                  boxShadow: "0 0 30px rgba(0,255,0,0.5), 0 0 80px rgba(0,255,0,0.2), 0 0 120px rgba(255,0,255,0.1)",
                  position: "relative" as const,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
              >
                OPEN GENERATORS
              </button>
            ) : !showCheckout ? (
              <button
                onClick={handleBuyNow}
                style={{
                  width: "100%", maxWidth: 360,
                  padding: "clamp(18px, 4.5vw, 24px) 32px",
                  background: "linear-gradient(135deg, #00FF00 0%, #00DD00 30%, #FF00FF 70%, #00FF00 100%)",
                  backgroundSize: "300% 300%",
                  animation: "gradientShift 3s ease infinite, buyPulse 2.5s ease-in-out infinite",
                  color: "#000",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(20px, 5vw, 28px)",
                  fontWeight: 900,
                  letterSpacing: "clamp(4px, 1.2vw, 8px)",
                  textTransform: "uppercase",
                  border: "none",
                  borderRadius: 16,
                  cursor: "pointer",
                  transition: "transform 0.15s cubic-bezier(.4,0,.2,1)",
                  WebkitAppearance: "none" as const,
                  boxShadow: "0 0 30px rgba(0,255,0,0.5), 0 0 80px rgba(0,255,0,0.2), 0 0 120px rgba(255,0,255,0.1)",
                  position: "relative" as const,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
              >
                BUY NOW!
              </button>
            ) : (
              <div ref={checkoutRef} style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </div>
        </RevealSection>

        {/* ── Footer ── */}
        <RevealSection delay={0.05}>
          <div style={{ textAlign: "center", paddingTop: 24, paddingBottom: 16 }}>
            <p style={{
              fontSize: "clamp(11px, 2.5vw, 13px)", letterSpacing: "clamp(2px, 1vw, 6px)", textTransform: "uppercase",
              color: "#FF00FF", margin: "0 0 10px", whiteSpace: "nowrap",
              textShadow: "0 0 10px #FF00FF, 0 0 40px #FF00FF, 0 0 80px rgba(255,0,255,0.5)",
            }}>
              Your Vibe Attracts Your Tribe
            </p>
            <div style={{
              width: "100%", maxWidth: 260, height: 2,
              background: "linear-gradient(90deg, transparent, #00FF00, transparent)",
              margin: "0 auto 10px",
              boxShadow: "0 0 10px rgba(0,255,0,0.4)",
            }} />
            <p style={{
              fontSize: "clamp(10px, 2.4vw, 12px)", letterSpacing: 4, textTransform: "uppercase",
              color: "#00FF00", margin: 0,
              textShadow: "0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5)",
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

// ── Section card with animated gradient border ──
function Section({ children, variant, style }: { children: React.ReactNode; variant?: "green" | "magenta" | "red"; style?: React.CSSProperties }) {
  const borderColor = variant === "green" ? "#00FF00" : variant === "magenta" ? "#FF00FF" : variant === "red" ? "#FF0000" : "rgba(255,255,255,0.15)";
  const glowRgb = variant === "green" ? "0,255,0" : variant === "magenta" ? "255,0,255" : variant === "red" ? "255,0,0" : "255,255,255";

  const base: React.CSSProperties = {
    padding: "clamp(20px, 5vw, 28px)",
    textAlign: "center",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    borderRadius: 24,
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    position: "relative",
    overflow: "hidden",
  };

  if (variant === "green") {
    Object.assign(base, {
      background: "radial-gradient(ellipse at 30% 0%, rgba(0,255,0,0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(0,255,0,0.05) 0%, transparent 50%), rgba(0,0,0,0.5)",
      border: "1px solid rgba(0,255,0,0.35)",
      boxShadow: "0 0 20px rgba(0,255,0,0.3), 0 0 60px rgba(0,255,0,0.1), inset 0 1px 0 rgba(0,255,0,0.2)",
    });
  } else if (variant === "magenta") {
    Object.assign(base, {
      background: "radial-gradient(ellipse at 30% 0%, rgba(255,0,255,0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(255,0,255,0.05) 0%, transparent 50%), rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,0,255,0.35)",
      boxShadow: "0 0 20px rgba(255,0,255,0.3), 0 0 60px rgba(255,0,255,0.1), inset 0 1px 0 rgba(255,0,255,0.2)",
    });
  } else if (variant === "red") {
    Object.assign(base, {
      background: "radial-gradient(ellipse at 30% 0%, rgba(255,0,0,0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(255,0,0,0.05) 0%, transparent 50%), rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,0,0,0.35)",
      boxShadow: "0 0 20px rgba(255,0,0,0.3), 0 0 60px rgba(255,0,0,0.1), inset 0 1px 0 rgba(255,0,0,0.2)",
    });
  } else {
    Object.assign(base, {
      background: "radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.06) 0%, transparent 50%), rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 0 20px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
    });
  }
  return <div style={{ ...base, ...style }}>{children}</div>;
}

// ── Gradient line divider ──
function GradientLine({ color }: { color: "green" | "magenta" | "red" }) {
  const c = color === "green" ? "#00FF00" : color === "red" ? "#FF0000" : "#FF00FF";
  const glow = color === "green" ? "rgba(0,255,0,0.5)" : color === "red" ? "rgba(255,0,0,0.5)" : "rgba(255,0,255,0.5)";
  return (
    <div style={{
      width: "100%", maxWidth: 280, height: 2,
      background: `linear-gradient(90deg, transparent, ${c}, transparent)`,
      margin: "0 auto 14px", borderRadius: 1,
      boxShadow: `0 0 10px ${glow}`,
    }} />
  );
}

// ── Glow text span ──
function Glow({ color, children }: { color: "green" | "magenta"; children: React.ReactNode }) {
  const c = color === "green" ? "#00FF00" : "#FF00FF";
  const rgb = color === "green" ? "0,255,0" : "255,0,255";
  return (
    <span style={{
      color: c, fontWeight: 600,
      textShadow: `0 0 10px ${c}, 0 0 40px ${c}, 0 0 80px rgba(${rgb},0.5)`,
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
        background: hovered ? "rgba(255,0,255,0.1)" : "rgba(255,0,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,0,255,0.4)" : "rgba(255,0,255,0.12)"}`,
        transition: "all 0.25s ease",
        cursor: "default",
        boxShadow: hovered ? "0 0 20px rgba(255,0,255,0.15)" : "none",
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        background: "rgba(255,0,255,0.12)", border: "1px solid rgba(255,0,255,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: hovered ? "0 0 15px rgba(255,0,255,0.3)" : "0 0 8px rgba(255,0,255,0.1)",
        transition: "box-shadow 0.25s ease",
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="3,2 7,5 3,8" stroke="#FF00FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: "clamp(13px, 3vw, 15px)", color: "#FF00FF", fontWeight: 700, textShadow: "0 0 10px rgba(255,0,255,0.3)" }}>{name}</div>
        <div style={{ fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.7)", fontWeight: 300, marginTop: 2 }}>{desc}</div>
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
        background: hovered ? "rgba(255,80,80,0.08)" : "rgba(255,80,80,0.03)",
        border: `1px solid ${hovered ? "rgba(255,80,80,0.3)" : "rgba(255,80,80,0.1)"}`,
        transition: "all 0.25s ease",
        cursor: "default",
        boxShadow: hovered ? "0 0 20px rgba(255,80,80,0.1)" : "none",
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,80,80,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
        boxShadow: hovered ? "0 0 15px rgba(255,80,80,0.2)" : "none",
        transition: "box-shadow 0.25s ease",
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <line x1="2" y1="2" x2="8" y2="8" stroke="rgba(255,80,80,0.8)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="2" x2="2" y2="8" stroke="rgba(255,80,80,0.8)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: "clamp(13px, 3vw, 15px)", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.65)", fontWeight: 300, marginTop: 3 }}>{desc}</div>
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
        background: hovered ? "rgba(0,255,0,0.1)" : "rgba(0,255,0,0.03)",
        border: `1px solid ${hovered ? "rgba(0,255,0,0.35)" : "rgba(0,255,0,0.12)"}`,
        transition: "all 0.25s ease",
        cursor: "default",
        boxShadow: hovered ? "0 0 20px rgba(0,255,0,0.15)" : "none",
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        background: "rgba(0,255,0,0.12)", border: "1px solid rgba(0,255,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
        boxShadow: hovered ? "0 0 15px rgba(0,255,0,0.3)" : "0 0 8px rgba(0,255,0,0.1)",
        transition: "box-shadow 0.25s ease",
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="2,5.5 4,7.5 8,3" stroke="#00FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: "clamp(13px, 3vw, 15px)", color: "#00FF00", fontWeight: 600, textShadow: "0 0 10px rgba(0,255,0,0.3)", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.65)", fontWeight: 300, marginTop: 3 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Benefit bullet item ──
function BenefitItem({ color, text }: { color: "green" | "magenta"; text: string }) {
  const c = color === "green" ? "#00FF00" : "#FF00FF";
  const rgb = color === "green" ? "0,255,0" : "255,0,255";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0" }}>
      <div style={{
        width: 12, height: 12, borderRadius: 6, flexShrink: 0, marginTop: 4,
        background: c,
        boxShadow: `0 0 10px ${c}, 0 0 20px rgba(${rgb},0.4)`,
      }} />
      <div style={{
        fontSize: "clamp(12px, 3vw, 15px)", color: "rgba(255,255,255,0.85)",
        fontWeight: 300, lineHeight: 1.6,
      }}>
        {text}
      </div>
    </div>
  );
}

// ── Stat card ──
function StatCard({ value, label, color }: { value: string; label: string; color: "green" | "magenta" }) {
  const c = color === "green" ? "#00FF00" : "#FF00FF";
  const rgb = color === "green" ? "0,255,0" : "255,0,255";
  return (
    <Section style={{
      padding: "clamp(18px, 4.5vw, 28px) clamp(10px, 3vw, 16px)",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: "clamp(26px, 6vw, 38px)", fontWeight: 900,
        color: c,
        textShadow: `0 0 10px ${c}, 0 0 40px ${c}, 0 0 80px rgba(${rgb},0.5)`,
        animation: "float 4s ease-in-out infinite",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: "clamp(10px, 2.4vw, 12px)", color: "rgba(255,255,255,0.7)",
        fontWeight: 400, marginTop: 6, letterSpacing: 1,
      }}>
        {label}
      </div>
    </Section>
  );
}

// ── Upload zone with real file upload ──
type FileEntry = {
  file: File;
  status: "uploading" | "uploaded" | "failed" | "submitting" | "done";
  percent: number;
  videoUrl?: string;
  filename?: string;
};

function UploadZone() {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const ACCEPTED = ".mp4,.mov,.hevc,.webm";
  const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/hevc", "video/webm"];

  // Upload a single file to Supabase Storage immediately
  const uploadToStorage = useCallback((file: File, index: number) => {
    const ext = file.name.split(".").pop() || "mp4";
    const slug = `upload-${Date.now()}-${index}`;
    const filename = `${slug}.${ext}`;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/reels/${filename}`);
    xhr.setRequestHeader("Authorization", `Bearer ${supabaseKey}`);
    xhr.setRequestHeader("apikey", supabaseKey);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setEntries(prev => prev.map((en, i) => i === index ? { ...en, percent, status: "uploading" } : en));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const videoUrl = `${supabaseUrl}/storage/v1/object/public/reels/${filename}`;
        setEntries(prev => prev.map((en, i) => i === index ? { ...en, status: "uploaded", percent: 100, videoUrl, filename } : en));
      } else {
        setEntries(prev => prev.map((en, i) => i === index ? { ...en, status: "failed", percent: 0 } : en));
      }
    };
    xhr.onerror = () => {
      setEntries(prev => prev.map((en, i) => i === index ? { ...en, status: "failed", percent: 0 } : en));
    };
    xhr.send(file);
  }, [supabaseUrl, supabaseKey]);

  const handleFiles = (newFiles: FileList | File[]) => {
    const valid: File[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp4|mov|hevc|webm)$/i)) continue;
      if (f.size > 500 * 1024 * 1024) continue;
      valid.push(f);
    }
    if (valid.length === 0) {
      setErrorMsg("Please upload MP4, MOV, HEVC, or WebM files only (max 500 MB each).");
      return;
    }
    const remaining = 3 - entries.length;
    if (remaining <= 0) {
      setErrorMsg("MAX UPLOADS: 3");
      return;
    }
    if (valid.length > remaining) valid.splice(remaining);
    setErrorMsg("");
    setUploadStatus("idle");

    // Add entries and start uploading immediately
    const startIndex = entries.length;
    const newEntries: FileEntry[] = valid.map(f => ({
      file: f, status: "uploading" as const, percent: 0,
    }));
    setEntries(prev => [...prev, ...newEntries]);

    // Kick off uploads right away
    valid.forEach((f, i) => uploadToStorage(f, startIndex + i));
  };

  const removeFile = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  // Submit just sends the DB records (files already uploaded)
  const handleSubmit = async () => {
    if (entries.length === 0) {
      setErrorMsg("Please upload at least one video.");
      return;
    }
    const ready = entries.filter(e => e.status === "uploaded");
    const stillUploading = entries.some(e => e.status === "uploading");
    if (stillUploading) {
      setErrorMsg("Videos still uploading — please wait a moment.");
      return;
    }
    if (ready.length === 0) {
      setErrorMsg("No videos uploaded successfully. Try again.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    let allSuccess = true;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.status !== "uploaded" || !entry.videoUrl) continue;

      setEntries(prev => prev.map((en, j) => j === i ? { ...en, status: "submitting" } : en));

      try {
        const res = await fetch("/api/submit-reel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artistName: instagram.trim(),
            email: email.trim() || undefined,
            videoUrl: entry.videoUrl,
            description: description.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setEntries(prev => prev.map((en, j) => j === i ? { ...en, status: "done" } : en));
        } else {
          setEntries(prev => prev.map((en, j) => j === i ? { ...en, status: "failed" } : en));
          allSuccess = false;
        }
      } catch {
        setEntries(prev => prev.map((en, j) => j === i ? { ...en, status: "failed" } : en));
        allSuccess = false;
      }
    }

    if (allSuccess) {
      setUploadStatus("success");
      setEntries([]);
      setInstagram("");
      setEmail("");
      setDescription("");
    } else {
      setUploadStatus("error");
      setErrorMsg("Some submissions failed. Tap Submit again to retry.");
    }
    setSubmitting(false);
  };

  const allUploaded = entries.length > 0 && entries.every(e => e.status === "uploaded" || e.status === "done");
  const anyUploading = entries.some(e => e.status === "uploading");

  if (uploadStatus === "success") {
    return (
      <div style={{
        border: "1.5px solid rgba(0,255,0,0.5)", borderRadius: 20,
        padding: "clamp(24px, 6vw, 36px) clamp(16px, 4vw, 24px)",
        background: "radial-gradient(ellipse at center, rgba(0,255,0,0.08) 0%, rgba(0,0,0,0.4) 100%)",
        maxWidth: 400, margin: "0 auto", textAlign: "center",
        boxShadow: "0 0 30px rgba(0,255,0,0.15), inset 0 0 30px rgba(0,255,0,0.05)",
      }}>
        <div style={{
          fontSize: 22, color: "#00FF00", marginBottom: 8, fontWeight: 800,
          textShadow: "0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5)",
        }}>
          Submitted!
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 300, lineHeight: 1.6 }}>
          Your {entries.length > 1 ? "reels have" : "reel has"} been uploaded. We&apos;ll tag you when they go live.
        </div>
        <button onClick={() => setUploadStatus("idle")} style={{
          marginTop: 16, padding: "12px 28px", fontSize: 13, fontWeight: 700,
          letterSpacing: 2, textTransform: "uppercase", background: "rgba(255,0,255,0.15)",
          border: "1px solid rgba(255,0,255,0.4)", borderRadius: 12, color: "#FF00FF",
          fontFamily: "Inter, sans-serif", cursor: "pointer",
          textShadow: "0 0 10px rgba(255,0,255,0.3)",
          boxShadow: "0 0 15px rgba(255,0,255,0.15)",
          transition: "all 0.2s ease",
        }}>
          Upload More
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 18px", background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(0,255,0,0.2)", borderRadius: 12, color: "#fff",
    fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 300, outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <input ref={fileInputRef} type="file" accept={ACCEPTED} multiple style={{ display: "none" }}
        onChange={e => { if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files); e.target.value = ""; }}
      />
      <div
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#00FF00" : hovered ? "#FF00FF" : "rgba(255,0,255,0.35)"}`,
          borderRadius: 20, padding: "clamp(22px, 5.5vw, 36px) clamp(16px, 4vw, 24px)",
          background: dragging
            ? "radial-gradient(ellipse at center, rgba(0,255,0,0.1) 0%, rgba(0,0,0,0.4) 100%)"
            : hovered
              ? "radial-gradient(ellipse at center, rgba(255,0,255,0.08) 0%, rgba(0,0,0,0.4) 100%)"
              : "rgba(255,0,255,0.03)",
          transition: "all 0.3s ease", cursor: "pointer",
          boxShadow: dragging
            ? "0 0 30px rgba(0,255,0,0.2), inset 0 0 30px rgba(0,255,0,0.05)"
            : hovered
              ? "0 0 30px rgba(255,0,255,0.15), inset 0 0 30px rgba(255,0,255,0.03)"
              : "none",
        }}
      >
        {entries.length > 0 ? (
          <>
            <div style={{
              fontSize: 14, color: allUploaded ? "#00FF00" : anyUploading ? "#FF00FF" : "#00FF00", fontWeight: 600,
              textShadow: `0 0 10px ${allUploaded ? "rgba(0,255,0,0.4)" : "rgba(255,0,255,0.4)"}`,
            }}>
              {anyUploading ? "Uploading..." : `${entries.length} video${entries.length > 1 ? "s" : ""} ready`}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
              {(entries.reduce((sum, e) => sum + e.file.size, 0) / (1024 * 1024)).toFixed(1)} MB total &bull; Tap to add more
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: "clamp(14px, 3.5vw, 17px)", color: "#00FF00", fontWeight: 600,
              textShadow: "0 0 10px #00FF00, 0 0 30px rgba(0,255,0,0.4)",
            }}>
              {dragging ? "Drop Your Videos Here" : "Tap To Select Videos"}
            </div>
            <div style={{ fontSize: "clamp(11px, 2.8vw, 13px)", color: "rgba(255,255,255,0.5)", fontWeight: 300, marginTop: 6 }}>
              MP4, MOV, HEVC, or WebM &bull; Up To 500 MB &bull; MAX UPLOADS: 3
            </div>
          </>
        )}
      </div>
      {entries.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {entries.map((entry, i) => (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                <span style={{
                  color: entry.status === "done" ? "#00FF00" : entry.status === "uploaded" ? "#00FF00" : entry.status === "failed" ? "#ff5050" : "#FF00FF",
                  fontWeight: 600, minWidth: 14, textAlign: "center",
                }}>
                  {entry.status === "done" ? "\u2713" : entry.status === "uploaded" ? "\u2713" : entry.status === "failed" ? "\u2717" : `${entry.percent}%`}
                </span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.file.name}</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{(entry.file.size / (1024 * 1024)).toFixed(1)}MB</span>
                {!submitting && entry.status !== "uploading" && (
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{
                    background: "none", border: "none", color: "rgba(255,80,80,0.7)", cursor: "pointer", fontSize: 14, padding: "0 2px",
                  }}>&times;</button>
                )}
              </div>
              {entry.status === "uploading" && (
                <div style={{
                  marginTop: 4, height: 4, borderRadius: 2,
                  background: "rgba(255,255,255,0.08)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${entry.percent}%`,
                    background: "#00FF00",
                    boxShadow: "0 0 8px #00FF00, 0 0 16px rgba(0,255,0,0.4)",
                    borderRadius: 2,
                    transition: "width 0.2s ease",
                  }} />
                </div>
              )}
              {(entry.status === "uploaded" || entry.status === "done") && (
                <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "#00FF00", boxShadow: "0 0 6px rgba(0,255,0,0.4)" }} />
              )}
            </div>
          ))}
        </div>
      )}
      {entries.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text" placeholder="@instagram (optional)" value={instagram}
            onChange={e => setInstagram(e.target.value)} style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.5)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(0,255,0,0.15)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <input
            type="email" placeholder="Your Email (optional)" value={email}
            onChange={e => setEmail(e.target.value)} style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.5)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(0,255,0,0.15)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <textarea
            placeholder="Caption / Description (optional — used for YouTube Shorts)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical" as const,
              minHeight: 60,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.5)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(0,255,0,0.15)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <button onClick={handleSubmit} disabled={submitting || anyUploading} style={{
            padding: "16px 28px", fontSize: 14, fontWeight: 800, letterSpacing: 2,
            textTransform: "uppercase",
            background: submitting || anyUploading ? "rgba(0,255,0,0.08)" : allUploaded ? "rgba(0,255,0,0.2)" : "rgba(0,255,0,0.08)",
            border: "1px solid rgba(0,255,0,0.4)", borderRadius: 14, color: "#00FF00",
            fontFamily: "Inter, sans-serif", cursor: submitting || anyUploading ? "wait" : "pointer",
            textShadow: "0 0 10px rgba(0,255,0,0.3)",
            boxShadow: allUploaded && !submitting ? "0 0 20px rgba(0,255,0,0.15)" : "none",
            transition: "all 0.2s ease",
          }}>
            {anyUploading ? "Videos uploading..." : submitting ? "Submitting..." : allUploaded ? (entries.length > 1 ? `Submit ${entries.length} Reels` : "Submit Reel") : "Waiting for uploads..."}
          </button>
        </div>
      )}
      {errorMsg && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#ff5050", textAlign: "center", textShadow: "0 0 10px rgba(255,80,80,0.3)" }}>{errorMsg}</div>
      )}
    </div>
  );
}

// ── CSS Particle background ──
function ParticleBackground() {
  const particles = useRef<Array<{ left: string; size: number; delay: number; duration: number; color: string; glow: string }> | null>(null);
  if (!particles.current) {
    particles.current = Array.from({ length: 60 }, (_, i) => {
      const isGreen = i % 3 === 0;
      const isMagenta = i % 3 === 1;
      const size = Math.random() * 5 + 2;
      return {
        left: `${Math.random() * 100}%`,
        size,
        delay: Math.random() * 18,
        duration: Math.random() * 12 + 10,
        color: isGreen
          ? "rgba(0,255,0,0.4)"
          : isMagenta
            ? "rgba(255,0,255,0.35)"
            : "rgba(255,255,255,0.15)",
        glow: isGreen
          ? `0 0 ${size * 4}px rgba(0,255,0,0.4), 0 0 ${size * 8}px rgba(0,255,0,0.15)`
          : isMagenta
            ? `0 0 ${size * 4}px rgba(255,0,255,0.35), 0 0 ${size * 8}px rgba(255,0,255,0.12)`
            : `0 0 ${size * 3}px rgba(255,255,255,0.1)`,
      };
    });
  }
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      overflow: "hidden", zIndex: 0, pointerEvents: "none",
    }}>
      {/* Gradient mesh background bleeds */}
      <div style={{
        position: "absolute", top: "-20%", left: "30%", transform: "translateX(-50%)",
        width: "80vw", height: "60vh",
        background: "radial-gradient(ellipse at center, rgba(0,255,0,0.07) 0%, transparent 60%)",
      }} />
      <div style={{
        position: "absolute", top: "20%", right: "-10%",
        width: "50vw", height: "50vh",
        background: "radial-gradient(ellipse at center, rgba(255,0,255,0.05) 0%, transparent 60%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "100vw", height: "50vh",
        background: "radial-gradient(ellipse at center, rgba(255,0,255,0.06) 0%, transparent 60%)",
      }} />
      <div style={{
        position: "absolute", bottom: "30%", left: "-10%",
        width: "60vw", height: "40vh",
        background: "radial-gradient(ellipse at center, rgba(0,255,0,0.04) 0%, transparent 60%)",
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
            boxShadow: p.glow,
            animation: `particleDrift ${p.duration}s linear ${p.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
