"use client";

import { useState, useEffect, useRef } from "react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function Card({ children, accent = "green" }: { children: React.ReactNode; accent?: "green" | "magenta" }) {
  const c = accent === "green" ? "0,255,0" : "255,0,255";
  return (
    <div style={{
      background: `rgba(${c},0.03)`,
      border: `1px solid rgba(${c},0.2)`,
      borderRadius: 20,
      padding: "28px 24px",
      marginBottom: 16,
      backdropFilter: "blur(20px)",
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, accent = "green" }: { children: React.ReactNode; accent?: "green" | "magenta" }) {
  const color = accent === "green" ? "#00FF00" : "#FF00FF";
  return (
    <h2 style={{
      color,
      fontSize: "clamp(18px, 4vw, 22px)",
      fontWeight: 700,
      marginBottom: 16,
      textShadow: `0 0 10px ${color}, 0 0 30px ${color}40`,
    }}>
      {children}
    </h2>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,0,255,0.06)",
      border: "1px solid rgba(255,0,255,0.25)",
      borderRadius: 12,
      padding: "14px 18px",
      marginTop: 12,
      marginBottom: 8,
      fontSize: "clamp(12px, 3vw, 14px)",
      color: "rgba(255,255,255,0.85)",
      lineHeight: 1.7,
    }}>
      <span style={{ color: "#FF00FF", fontWeight: 700, marginRight: 8 }}>PRO TIP</span>
      {children}
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6,
        background: "rgba(0,255,0,0.12)", border: "1px solid rgba(0,255,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="2,5.5 4,7.5 8,3" stroke="#00FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

export default function TravelingForGigsPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      fontFamily: "Inter, -apple-system, sans-serif",
      padding: "40px 20px 80px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        <Reveal>
          <a href="/success" style={{
            color: "#00FF00", fontSize: 12, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
            opacity: 0.7,
          }}>
            ← Back to Dashboard
          </a>
          <p style={{
            color: "#FF00FF", fontSize: 10, letterSpacing: 4, textTransform: "uppercase",
            textShadow: "0 0 10px #FF00FF", marginBottom: 8,
          }}>
            Flow Arts Professional Guide
          </p>
          <h1 style={{
            fontSize: "clamp(26px, 6vw, 38px)",
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 12,
            background: "linear-gradient(135deg, #00FF00 0%, #FF00FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Traveling for Gigs
          </h1>
          <p style={{
            fontSize: "clamp(13px, 3vw, 15px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}>
            How to build a touring circuit, budget for travel gigs, and make every trip count. The road is where flow arts careers are built.
          </p>
          <div style={{
            width: "100%", maxWidth: 300, height: 2,
            background: "linear-gradient(90deg, transparent, #00FF00, #FF00FF, transparent)",
            margin: "0 auto 40px",
            boxShadow: "0 0 15px rgba(0,255,0,0.4)",
          }} />
        </Reveal>

        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>1. The Festival Circuit</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Festival season runs roughly April through October in the US. The key is to cluster bookings geographically so you&apos;re not crisscrossing the country for single gigs.
            </p>
            <CheckItem>Map out festivals by region and month — build a calendar showing which festivals are near each other in time and distance</CheckItem>
            <CheckItem>Apply to 3-5 festivals in the same region within the same 2-3 week window</CheckItem>
            <CheckItem>Regional burns (Burning Man regionals) are some of the best networking events — most have performer applications</CheckItem>
            <CheckItem>Music festivals, arts festivals, yoga festivals, and Renaissance faires all hire flow artists</CheckItem>
            <CheckItem>Keep a database of every festival you apply to with dates, contacts, and application status</CheckItem>
            <Tip>
              The Southeast circuit (Florida → Georgia → Carolinas → Tennessee) and the West Coast circuit (SoCal → NorCal → Oregon → Washington) are the most active for flow arts. Build your route around these corridors.
            </Tip>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card accent="magenta">
            <SectionTitle accent="magenta">2. Budgeting for the Road</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Travel gigs only work if you&apos;re not losing money. Every trip needs a rough P&L so you know your break-even point.
            </p>
            <CheckItem>Calculate your costs: gas/flights, accommodation, food, equipment transport, and incidentals</CheckItem>
            <CheckItem>Set a minimum rate for travel gigs that covers costs + your hourly rate + travel time</CheckItem>
            <CheckItem>Stack gigs: if you&apos;re traveling 4 hours for one gig, find 2-3 more in that area for the same trip</CheckItem>
            <CheckItem>Camp at festivals when possible — saves $100-200/night on hotels</CheckItem>
            <CheckItem>Connect with other traveling artists for ride shares and shared accommodations</CheckItem>
            <CheckItem>Track every expense — at tax time, travel for performances is deductible</CheckItem>
            <Tip>
              Rule of thumb: a travel gig should pay at least 2x what a local gig pays to account for travel costs and lost time. If a local gig pays $200, don&apos;t travel for less than $400.
            </Tip>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>3. Building Your Touring Network</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Your network is your net worth on the road. Every city should have at least one connection who can offer a couch, a gig lead, or an introduction.
            </p>
            <CheckItem>Exchange contacts with every performer and organizer you meet at events</CheckItem>
            <CheckItem>Join flow arts Facebook groups for every region you tour through</CheckItem>
            <CheckItem>Offer to host traveling artists in your city — reciprocity builds the strongest networks</CheckItem>
            <CheckItem>Connect with local flow communities before you arrive — offer to lead a free jam or workshop</CheckItem>
            <CheckItem>Build relationships with venue owners in multiple cities — become their go-to booking when you&apos;re in town</CheckItem>
            <Tip>
              The flow arts community is small and deeply connected. Your reputation travels faster than you do. Be generous, reliable, and professional everywhere you go.
            </Tip>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card accent="magenta">
            <SectionTitle accent="magenta">4. Equipment & Transport</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Getting your gear from A to B without damage is a skill in itself. Plan ahead to avoid surprises.
            </p>
            <CheckItem>Invest in quality hard cases for LED props — they&apos;re expensive to replace when they break in transit</CheckItem>
            <CheckItem>For flights: check airline policies on lithium batteries (LED props) and fuel (fire props) before you book</CheckItem>
            <CheckItem>Fire fuel cannot fly — ship it ahead via ground freight or buy locally at your destination</CheckItem>
            <CheckItem>Keep a travel kit checklist: props, batteries, chargers, fuel, wicks, safety gear, costumes, music/speakers</CheckItem>
            <CheckItem>Bring backup props — if your main hoop breaks at a festival, the show must go on</CheckItem>
            <Tip>
              Driving is almost always better than flying for flow artists. You can carry unlimited gear, stop at gigs along the way, and don&apos;t have to deal with TSA questions about your LED staffs.
            </Tip>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>5. Making Every Trip Count</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Don&apos;t just perform and leave. Maximize every trip by creating content, building relationships, and planting seeds for return bookings.
            </p>
            <CheckItem>Film every performance — even phone footage becomes social content and portfolio material</CheckItem>
            <CheckItem>Sell merch at events: stickers, patches, tutorials, or your own props if you make them</CheckItem>
            <CheckItem>Offer private lessons in cities you visit — advertise on local flow groups before you arrive</CheckItem>
            <CheckItem>Get testimonials from organizers after every gig — add them to your press kit</CheckItem>
            <CheckItem>Upload your best clips to Flow Arts Professional — we post them as YouTube Shorts and credit you</CheckItem>
            <CheckItem>Before you leave, confirm interest for your next visit — &quot;I&apos;ll be back in 3 months, want to book again?&quot;</CheckItem>
            <Tip>
              The artists who build sustainable touring careers aren&apos;t necessarily the most skilled — they&apos;re the most organized. Treat every trip like a business trip with clear goals and follow-up.
            </Tip>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: "100%", maxWidth: 300, height: 2,
              background: "linear-gradient(90deg, transparent, #FF00FF, #00FF00, transparent)",
              margin: "0 auto 24px",
              boxShadow: "0 0 15px rgba(255,0,255,0.4)",
            }} />
            <p style={{
              color: "rgba(255,255,255,0.5)", fontSize: "clamp(11px, 3vw, 13px)",
              lineHeight: 1.7, marginBottom: 20,
            }}>
              Create your professional materials before hitting the road. Your press kit and booking sheet make all the difference.
            </p>
            <a href="/success" style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "linear-gradient(135deg, #00FF00, #00DD00)",
              color: "#000",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 12,
              boxShadow: "0 0 20px rgba(0,255,0,0.4)",
            }}>
              Back to Dashboard
            </a>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
