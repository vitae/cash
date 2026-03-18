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

export default function HowToBeAProPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      fontFamily: "Inter, -apple-system, sans-serif",
      padding: "40px 20px 80px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
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
            How To Be A Flow Arts Professional
          </h1>
          <p style={{
            fontSize: "clamp(13px, 3vw, 15px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}>
            The complete playbook for turning your flow practice into a sustainable career. From finding local gigs to landing brand deals — this is everything you need.
          </p>
          <div style={{
            width: "100%", maxWidth: 300, height: 2,
            background: "linear-gradient(90deg, transparent, #00FF00, #FF00FF, transparent)",
            margin: "0 auto 40px",
            boxShadow: "0 0 15px rgba(0,255,0,0.4)",
          }} />
        </Reveal>

        {/* Section 1: Know Your Market */}
        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>1. Know Your Local Market</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Before you can get booked, you need to know who&apos;s booking. Every city has event producers, venue owners, and festival organizers who hire live entertainment. Your job is to find them.
            </p>
            <CheckItem>Search Instagram and Facebook for local event producers, nightlife promoters, and festival pages in your city</CheckItem>
            <CheckItem>Attend local events as a guest first — introduce yourself to organizers and other performers</CheckItem>
            <CheckItem>Build a spreadsheet of every venue, event series, and producer within a 2-hour drive</CheckItem>
            <CheckItem>Follow their social accounts, engage with their content, and build genuine relationships before pitching</CheckItem>
            <CheckItem>Look for open mic nights, art walks, farmers markets, and community events that welcome live performance</CheckItem>
            <Tip>
              Start with smaller events and free gigs to build a local reputation. One great performance at a 200-person event leads to three paid bookings. Word of mouth is everything in this industry.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 2: Reach Out to Event Producers */}
        <Reveal delay={0.05}>
          <Card accent="magenta">
            <SectionTitle accent="magenta">2. Reach Out to Event Producers</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Cold outreach works — if you do it right. Event producers are always looking for fresh talent, but they get flooded with DMs. Stand out with a professional approach.
            </p>
            <CheckItem>Lead with a 30-second highlight reel — not a long message about yourself</CheckItem>
            <CheckItem>Include your rates, availability, and what you bring (LED props, fire, ambient, high-energy performance)</CheckItem>
            <CheckItem>Mention specific events they&apos;ve produced and explain why you&apos;d be a good fit for their audience</CheckItem>
            <CheckItem>Use the <strong style={{ color: "#00FF00" }}>Artist EPK Generator</strong> on your dashboard to create a professional press kit to attach</CheckItem>
            <CheckItem>Follow up once after 5-7 days if you don&apos;t hear back — then move on to the next producer</CheckItem>
            <Tip>
              DMs get lost. Email is better for professional inquiries. Use the Event Booking Sheet generator to create a one-page PDF with your tech rider, rates, and contact info.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 3: Brand Sponsorships */}
        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>3. Land Brand Sponsorships</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Flow arts brands — hoop companies, poi manufacturers, LED prop makers — are actively looking for ambassadors and sponsored artists. You don&apos;t need 100K followers. You need consistency and quality content.
            </p>
            <CheckItem>Identify 10-20 brands whose products you already use and love (hoops, poi, levitation wands, fans, staffs)</CheckItem>
            <CheckItem>Tag them consistently in your content — show them you&apos;re already promoting their products organically</CheckItem>
            <CheckItem>Use the <strong style={{ color: "#00FF00" }}>Custom Sponsor Pitch Generator</strong> to craft personalized outreach to each brand</CheckItem>
            <CheckItem>Offer specific deliverables: monthly posts, event appearances with their gear, tutorial content featuring their products</CheckItem>
            <CheckItem>Start with product-for-content deals and work up to paid sponsorships as your audience grows</CheckItem>
            <CheckItem>Check out the <strong style={{ color: "#FF00FF" }}>Contact 50 Brands</strong> guide for a curated list of companies to reach out to</CheckItem>
            <Tip>
              Brands care more about engagement rate than follower count. An artist with 2,000 engaged followers who gets 300+ likes per post is more valuable than someone with 50K followers and 200 likes.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 4: Contact Regional Festivals */}
        <Reveal delay={0.05}>
          <Card accent="magenta">
            <SectionTitle accent="magenta">4. Contact Regional Festivals</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Festivals are the bread and butter of a flow arts career. Most festivals book performers 3-6 months in advance, and many have open application processes.
            </p>
            <CheckItem>Research every festival within a 500-mile radius — music, arts, transformational, burning man regionals, EDM events</CheckItem>
            <CheckItem>Follow their artist/performer application timelines (usually opens 4-6 months before the event)</CheckItem>
            <CheckItem>Apply early — many festivals fill performer rosters on a rolling basis</CheckItem>
            <CheckItem>Offer to teach a workshop in addition to performing — this doubles your value to festival organizers</CheckItem>
            <CheckItem>Network with other performers at festivals — they&apos;ll recommend you for gigs you didn&apos;t even know about</CheckItem>
            <CheckItem>Document your festival performances and share them — this becomes your portfolio for future bookings</CheckItem>
            <Tip>
              Check our <strong style={{ color: "#00FF00" }}>Traveling for Gigs</strong> guide for logistics on making festival circuits financially viable.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 5: Practice & Document */}
        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>5. Practice & Document Everything</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Your practice sessions are content. Your progress is your story. The flow arts community loves watching artists grow — document the journey.
            </p>
            <CheckItem>Set a weekly practice schedule and stick to it — treat it like a job, because it is one</CheckItem>
            <CheckItem>Film your practice sessions, even the messy ones — progress reels get massive engagement</CheckItem>
            <CheckItem>Learn new props and techniques regularly — versatility makes you more bookable</CheckItem>
            <CheckItem>Post before/after progress videos showing your improvement over weeks or months</CheckItem>
            <CheckItem>Create tutorial content for moves you&apos;ve mastered — teaching builds authority</CheckItem>
            <CheckItem>Upload your best clips to Flow Arts Professional — we&apos;ll post them as YouTube Shorts with EDM music and tag you</CheckItem>
            <Tip>
              Consistency beats perfection. Posting 3 decent clips per week builds your audience faster than one perfect video per month. The algorithm rewards frequency.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 6: Teach Playshops */}
        <Reveal delay={0.05}>
          <Card accent="magenta">
            <SectionTitle accent="magenta">6. Teach Playshops & Build Community</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Teaching is one of the most powerful ways to build your reputation, earn income, and grow the flow arts community. Every expert was once a beginner — share what you know.
            </p>
            <CheckItem>Host free community jams in local parks — bring extra props for beginners to try</CheckItem>
            <CheckItem>Offer paid workshops at yoga studios, dance studios, community centers, and co-working spaces</CheckItem>
            <CheckItem>Create a beginner, intermediate, and advanced curriculum for your primary prop</CheckItem>
            <CheckItem>Teach at festivals — most festivals provide a stipend, free admission, and camping for workshop leaders</CheckItem>
            <CheckItem>Film your workshops and share clips — this attracts students and demonstrates your teaching style</CheckItem>
            <CheckItem>Build a mailing list of students — they become your audience, your supporters, and your community</CheckItem>
            <Tip>
              Playshops (play + workshop) are the flow arts way. Keep it fun, inclusive, and judgment-free. The best teachers create a space where people feel safe to fail and try again.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 7: Sustain & Give Back */}
        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>7. Sustain Yourself, Then Help Others</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              The ultimate goal isn&apos;t just to make a living from flow — it&apos;s to build a career that lets you elevate others. When you&apos;re financially stable, you can mentor the next generation.
            </p>
            <CheckItem>Diversify your income: performances, workshops, sponsorships, content creation, and private lessons</CheckItem>
            <CheckItem>Set financial goals — track your monthly income from flow and identify which streams to grow</CheckItem>
            <CheckItem>Mentor younger or newer artists — share gig leads, introduce them to producers, help them build their kits</CheckItem>
            <CheckItem>Organize community events — flow jams, showcases, and meetups that give newer artists a platform</CheckItem>
            <CheckItem>Collaborate with other artists on content and performances — rising tides lift all boats</CheckItem>
            <CheckItem>Use your platform to advocate for fair pay, safe performance conditions, and artist rights</CheckItem>
            <Tip>
              You don&apos;t have to be famous to be professional. A sustainable flow career might mean $2-5K/month from a mix of gigs, workshops, and sponsorships in your local market. That&apos;s the goal.
            </Tip>
          </Card>
        </Reveal>

        {/* CTA */}
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
              Ready to take the next step? Use the tools on your dashboard to create your press kit, booking sheet, and sponsor pitches.
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
