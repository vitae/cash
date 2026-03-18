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

export default function BuildYourBrandPage() {
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
            Build Your Brand Online
          </h1>
          <p style={{
            fontSize: "clamp(13px, 3vw, 15px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}>
            Your social media is your resume, your portfolio, and your storefront. Here&apos;s how to build an audience that gets you booked, sponsored, and paid.
          </p>
          <div style={{
            width: "100%", maxWidth: 300, height: 2,
            background: "linear-gradient(90deg, transparent, #00FF00, #FF00FF, transparent)",
            margin: "0 auto 40px",
            boxShadow: "0 0 15px rgba(0,255,0,0.4)",
          }} />
        </Reveal>

        {/* Section 1 */}
        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>1. The Algorithm Cheat Code</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Instagram Reels and TikTok don&apos;t care how many followers you have. They care about watch time and shares. A 15-second flow clip with the right music can reach 500K people from an account with 200 followers.
            </p>
            <CheckItem>Post Reels/TikToks 4-5 times per week minimum — consistency trains the algorithm to push your content</CheckItem>
            <CheckItem>Hook viewers in the first 0.5 seconds — start with your most visually stunning move, not a slow build</CheckItem>
            <CheckItem>Use trending audio — check the Reels audio library daily for songs that are spiking in use</CheckItem>
            <CheckItem>Keep clips 7-15 seconds for maximum completion rate — the algorithm prioritizes videos people watch to the end</CheckItem>
            <CheckItem>Film in golden hour or with LED props at night — high contrast + movement = scroll-stopping content</CheckItem>
            <CheckItem>Upload your best clips to Flow Arts Professional — we add trending EDM and post as YouTube Shorts</CheckItem>
            <Tip>
              The best-performing flow arts content isn&apos;t the most technically impressive — it&apos;s the most visually mesmerizing to non-flow people. Think about what makes a random person stop scrolling.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 2 */}
        <Reveal delay={0.05}>
          <Card accent="magenta">
            <SectionTitle accent="magenta">2. Your Content Pillars</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Don&apos;t just post random flow clips. Build a content strategy around 4 pillars that keep your audience engaged and attract new followers.
            </p>
            <CheckItem><strong style={{ color: "#FF00FF" }}>Performance clips</strong> (40%) — Your best moves, choreography, and LED/fire content. This is what goes viral</CheckItem>
            <CheckItem><strong style={{ color: "#FF00FF" }}>Behind the scenes</strong> (25%) — Practice fails, prop maintenance, packing for gigs, festival prep. This builds connection</CheckItem>
            <CheckItem><strong style={{ color: "#FF00FF" }}>Tutorials</strong> (20%) — Teach one move per video. This builds authority and gets saved/shared</CheckItem>
            <CheckItem><strong style={{ color: "#FF00FF" }}>Lifestyle & personality</strong> (15%) — Your story, your vibe, your community. This turns followers into fans</CheckItem>
            <Tip>
              Save rate is the most important metric on Instagram. Tutorial content gets saved 10x more than performance content. One &quot;How to do a weave&quot; tutorial can outperform your best flow clip.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 3 */}
        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>3. Film Like a Pro (With Just a Phone)</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              You don&apos;t need a RED camera. You need good light, a tripod, and intentional framing. 95% of viral flow content is shot on an iPhone.
            </p>
            <CheckItem>Shoot in 4K 60fps — slow motion at 240fps for hero shots that make jaws drop</CheckItem>
            <CheckItem>Use a $20 phone tripod with remote shutter — eliminates shaky footage instantly</CheckItem>
            <CheckItem>Film against clean backgrounds — dark backgrounds for LED, open sky for fire, urban for day sessions</CheckItem>
            <CheckItem>Shoot vertical (9:16) for Reels/TikTok/Shorts — this is where 80% of your audience lives</CheckItem>
            <CheckItem>Golden hour (sunset) and blue hour (post-sunset) make everything cinematic with zero effort</CheckItem>
            <CheckItem>For LED: shoot in manual exposure mode with ISO 400-800 and 1/60 shutter for light trails</CheckItem>
            <Tip>
              Film every practice session even if you don&apos;t post it. Review the footage to improve your technique. Your phone camera is the best coaching tool you have.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 4 */}
        <Reveal delay={0.05}>
          <Card accent="magenta">
            <SectionTitle accent="magenta">4. Hashtags & Captions That Convert</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Hashtags are search terms. Captions are conversation starters. Both drive discovery when used strategically.
            </p>
            <CheckItem>Use 8-15 hashtags per post — mix large (#flowarts 2M), medium (#hooping 500K), and niche (#ledpoi 50K)</CheckItem>
            <CheckItem>Core flow tags: #flowarts #flowartist #hooping #poi #staff #leviwand #firespinner #rave #edm #festival</CheckItem>
            <CheckItem>Add location tags — #austinflowarts gets you found by local producers and communities</CheckItem>
            <CheckItem>Write captions that ask questions — &quot;Which move should I learn next?&quot; drives comments which boost reach</CheckItem>
            <CheckItem>Tag prop brands in every post — they track these and reach out to consistent taggers</CheckItem>
            <CheckItem>Add a call-to-action: &quot;Save this for your next flow session&quot; or &quot;Tag someone who should try this&quot;</CheckItem>
            <Tip>
              Create a note on your phone with your go-to hashtag sets. Have one for LED content, one for fire, one for tutorials, and one for festivals. Copy-paste and customize per post.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 5 */}
        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>5. Collaborations & Cross-Pollination</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              The fastest way to grow is to tap into someone else&apos;s audience. Collaborations expose you to entirely new groups of potential fans.
            </p>
            <CheckItem>Film duo/group flow sessions with other artists and tag each other — both audiences see both artists</CheckItem>
            <CheckItem>Go live together on Instagram — the algorithm pushes live content and notifies both follower bases</CheckItem>
            <CheckItem>Collaborate with non-flow creators: dancers, DJs, photographers, videographers, fashion creators</CheckItem>
            <CheckItem>Create &quot;stitch&quot; and &quot;duet&quot; content on TikTok with viral flow clips — piggyback on existing reach</CheckItem>
            <CheckItem>Guest-teach at other artists&apos; workshops — their students become your followers</CheckItem>
            <Tip>
              The flow arts community is collaborative, not competitive. The artists who grow fastest are the ones who lift others up publicly. Share other artists&apos; content, comment genuinely, and build real relationships.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 6 */}
        <Reveal delay={0.05}>
          <Card accent="magenta">
            <SectionTitle accent="magenta">6. Monetize Your Audience</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Followers don&apos;t pay bills. But an engaged audience is the foundation for every revenue stream in flow arts.
            </p>
            <CheckItem>Link in bio → booking page, workshop sign-ups, or merch store. Never leave your link empty</CheckItem>
            <CheckItem>Build an email list from day one — Instagram can throttle you, but email is yours forever</CheckItem>
            <CheckItem>Offer online tutorials or courses via Patreon, Gumroad, or your own site ($5-25/month)</CheckItem>
            <CheckItem>Sell branded merch: stickers, patches, phone cases with your logo or signature move name</CheckItem>
            <CheckItem>Once you hit 1K followers, apply to brand ambassador programs using the <strong style={{ color: "#00FF00" }}>Contact 50 Brands</strong> guide</CheckItem>
            <CheckItem>At 10K followers, you can charge $50-200 per sponsored post or story mention</CheckItem>
            <Tip>
              Don&apos;t wait until you&apos;re &quot;big enough.&quot; Start monetizing at 500 followers with private lessons and small workshops. The artists who wait for permission never start. The artists who start small build empires.
            </Tip>
          </Card>
        </Reveal>

        {/* Section 7 */}
        <Reveal delay={0.05}>
          <Card accent="green">
            <SectionTitle>7. The 90-Day Launch Plan</SectionTitle>
            <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 16 }}>
              Stop overthinking and start executing. Here&apos;s your 90-day plan to go from invisible to undeniable.
            </p>
            <CheckItem><strong style={{ color: "#00FF00" }}>Days 1-30:</strong> Post 5 Reels per week. Film 3 practice sessions. Follow 50 flow artists. Comment genuinely on 10 posts per day</CheckItem>
            <CheckItem><strong style={{ color: "#00FF00" }}>Days 31-60:</strong> Launch tutorials. Collab with 2 artists. DM 10 local event producers. Apply to 5 festivals. Start an email list</CheckItem>
            <CheckItem><strong style={{ color: "#00FF00" }}>Days 61-90:</strong> Pitch 10 brands (use the Sponsor Pitch Generator). Host your first workshop. Create your EPK. Book your first paid gig</CheckItem>
            <Tip>
              Track your numbers weekly: followers, reach, saves, shares, DMs from producers. What you measure improves. Screenshot your insights every Sunday and note what content performed best.
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
              Your brand is your business. Use the generators on your dashboard to create the materials that turn your audience into income.
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
