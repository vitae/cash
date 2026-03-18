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

type Brand = { name: string; makes: string; why: string; web?: string; ig?: string; email?: string };

function CategorySection({ title, accent, brands }: {
  title: string;
  accent: "green" | "magenta";
  brands: Brand[];
}) {
  const c = accent === "green" ? "0,255,0" : "255,0,255";
  const color = accent === "green" ? "#00FF00" : "#FF00FF";
  return (
    <div style={{
      background: `rgba(${c},0.03)`,
      border: `1px solid rgba(${c},0.2)`,
      borderRadius: 20,
      padding: "24px 20px",
      marginBottom: 16,
      backdropFilter: "blur(20px)",
    }}>
      <h2 style={{
        color,
        fontSize: "clamp(16px, 4vw, 20px)",
        fontWeight: 700,
        marginBottom: 16,
        textShadow: `0 0 10px ${color}, 0 0 30px ${color}40`,
      }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {brands.map((b, i) => (
          <BrandRow key={i} {...b} accent={accent} />
        ))}
      </div>
    </div>
  );
}

function BrandRow({ name, makes, why, web, ig, email, accent }: Brand & { accent: "green" | "magenta" }) {
  const [hovered, setHovered] = useState(false);
  const c = accent === "green" ? "0,255,0" : "255,0,255";
  const color = accent === "green" ? "#00FF00" : "#FF00FF";
  const linkStyle = { color: "rgba(255,255,255,0.5)", fontSize: 10, textDecoration: "none", transition: "color 0.2s" };
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 3,
        padding: "12px 14px", borderRadius: 12,
        background: hovered ? `rgba(${c},0.08)` : "transparent",
        border: `1px solid ${hovered ? `rgba(${c},0.3)` : "transparent"}`,
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ color, fontWeight: 700, fontSize: "clamp(13px, 3vw, 15px)" }}>{name}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, flexShrink: 0 }}>{makes}</span>
      </div>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(11px, 2.5vw, 12px)", lineHeight: 1.5 }}>{why}</span>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 2 }}>
        {web && <a href={web} target="_blank" rel="noopener noreferrer" style={linkStyle}>🌐 {web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>}
        {ig && <a href={`https://instagram.com/${ig.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: "rgba(255,0,255,0.6)" }}>{ig}</a>}
        {email && <a href={`mailto:${email}`} style={{ ...linkStyle, color: "rgba(0,255,0,0.6)" }}>✉ {email}</a>}
      </div>
    </div>
  );
}

const HOOP_BRANDS: Brand[] = [
  { name: "Mood Hoops", makes: "LED Smart Hoops", why: "Industry leader in LED hoops. Large ambassador program with product + commission.", web: "https://moodhoops.com", ig: "@moodhoops", email: "info@moodhoops.com" },
  { name: "Astral Hoops", makes: "LED & Poly Hoops", why: "Premium smart hoops with app control. Known for artist collaborations.", web: "https://astralhoops.com", ig: "@astralhoops", email: "support@astralhoops.com" },
  { name: "Hyperion Hoops", makes: "LED Hoops", why: "High-end LED hoops with custom patterns. Growing brand seeking visibility.", web: "https://hyperionhoops.com", ig: "@hyperionhoops", email: "info@hyperionhoops.com" },
  { name: "The Spinsterz", makes: "Hoops & Flow Props", why: "Massive catalog of hoops and accessories. Active sponsorship program.", web: "https://thespinsterz.com", ig: "@thespinsterz", email: "info@thespinsterz.com" },
  { name: "Ruby Hooping", makes: "Handmade Hoops", why: "Artisan hoop maker. Great for micro-influencer partnerships.", web: "https://rubyhooping.com", ig: "@rubyhooping", email: "hello@rubyhooping.com" },
  { name: "Hoop Mamas", makes: "Custom Hoops", why: "Community-focused brand. Values authentic representation.", web: "https://hoopmamas.com", ig: "@hoopmamas", email: "info@hoopmamas.com" },
  { name: "Cosmic Hoops", makes: "LED & Polypro Hoops", why: "Budget-friendly LEDs with growing market share. Needs content creators.", web: "https://cosmichoops.com", ig: "@cosmichoops" },
  { name: "Sacred Flow Art", makes: "Hoops & Props", why: "Multi-prop brand with strong festival presence.", web: "https://sacredflowart.com", ig: "@sacredflowart", email: "info@sacredflowart.com" },
];

const POI_BRANDS: Brand[] = [
  { name: "Flowtoys", makes: "LED Poi, Staffs, Clubs", why: "The gold standard in flow props. Highly selective ambassador program — prestigious to land.", web: "https://flowtoys.com", ig: "@flowtoys", email: "info@flowtoys.com" },
  { name: "Home of Poi", makes: "Poi & Fire Props", why: "New Zealand-based, global reach. Extensive product line and educational content.", web: "https://homeofpoi.com", ig: "@homeofpoi", email: "info@homeofpoi.com" },
  { name: "Dark Monk", makes: "Fire Poi & Props", why: "Premium fire props. Seeking artists who perform fire at festivals.", web: "https://darkmonk.com", ig: "@darkmonkdesign", email: "info@darkmonk.com" },
  { name: "Pyroterra", makes: "Fire & LED Props", why: "European brand expanding globally. Open to international partnerships.", web: "https://pyroterra.cz", ig: "@pyroterra", email: "info@pyroterra.cz" },
  { name: "Trick Concepts", makes: "Contact Poi & Props", why: "Innovation-focused brand. Values technical skill in content.", web: "https://trickconcepts.com", ig: "@trickconcepts", email: "info@trickconcepts.com" },
  { name: "Spinballs", makes: "LED Poi & Accessories", why: "Affordable LED poi. High volume brand that sponsors many artists.", web: "https://spinballs.com", ig: "@spinballs", email: "hello@spinballs.com" },
  { name: "Flow on Fire", makes: "Fire Props", why: "Artisan fire prop maker. Values quality content over follower count.", web: "https://flowonfire.co.uk", ig: "@flowonfire" },
  { name: "UltraPoi", makes: "LED Poi", why: "Feature-rich LED poi with phone app control. Tech-forward brand.", web: "https://ultrapoi.com", ig: "@ultrapoi", email: "support@ultrapoi.com" },
];

const LED_BRANDS: Brand[] = [
  { name: "Emazing Lights", makes: "LED Gloves & Orbits", why: "Dominant in the gloving scene. Massive ambassador network and team program.", web: "https://emazinglights.com", ig: "@eaborig", email: "team@emazinglights.com" },
  { name: "Future Crew", makes: "LED Gloves", why: "Premium gloving brand. Sponsors competitive glovers.", web: "https://futurecrew.com", ig: "@futurecrewlights", email: "info@futurecrew.com" },
  { name: "GloFX", makes: "LED Glasses & Accessories", why: "EDM accessories brand. High-volume partnership opportunities.", web: "https://glofx.com", ig: "@glofx", email: "info@glofx.com" },
  { name: "Lux LED", makes: "LED Flow Props", why: "Boutique LED manufacturer. Values creativity in content partnerships.", web: "https://luxledlights.com", ig: "@luxledlights" },
  { name: "Neon Nightlife", makes: "LED Party Supplies", why: "Broad LED product line. Good for event-based sponsorships.", web: "https://neonnightlife.com", ig: "@neonnightlife", email: "support@neonnightlife.com" },
  { name: "Electro Glow", makes: "LED Wearables", why: "Growing brand in LED fashion. Seeking festival ambassadors.", web: "https://electroglow.com", ig: "@electroglow" },
];

const FLOW_TOY_BRANDS: Brand[] = [
  { name: "Flow DNA", makes: "Contact Staffs & Wands", why: "Premium contact props. Values technical artistry in ambassadors.", web: "https://flowdna.co.uk", ig: "@flowdna" },
  { name: "Flames N Games", makes: "Juggling & Flow Props", why: "UK-based with global distribution. Wide product range.", web: "https://flamesnagames.co.uk", ig: "@flamesnagames", email: "info@flamesnagames.co.uk" },
  { name: "Wizard Props", makes: "Levitation Wands", why: "Specialized levi wand maker. Niche but dedicated community.", ig: "@wizardprops" },
  { name: "Crystal Levity", makes: "Crystal Balls & Contact", why: "Contact juggling specialists. Growing brand with ambassador openings.", web: "https://crystallevity.com", ig: "@crystallevity" },
  { name: "Moodhoops (Fans)", makes: "LED Fans", why: "Expanding into fan dance market. Seeking fan dance content creators.", web: "https://moodhoops.com/fans", ig: "@moodhoops", email: "info@moodhoops.com" },
  { name: "Ignis Pixel", makes: "LED Visual Poi", why: "Pixel poi with custom images. Premium product seeking creative showcases.", web: "https://ignispixel.com", ig: "@ignispixel", email: "info@ignispixel.com" },
  { name: "DrexFactor", makes: "Instructional Content", why: "Not a product brand but a key influencer. Collaboration builds credibility.", web: "https://drexfactor.com", ig: "@drexfactor", email: "drex@drexfactor.com" },
  { name: "Play Juggling", makes: "European Flow Props", why: "Italian brand with high-quality props. Growing US market presence.", web: "https://playjuggling.com", ig: "@playjuggling", email: "info@playjuggling.com" },
];

const FESTIVAL_BRANDS: Brand[] = [
  { name: "iHeartRaves", makes: "Festival Fashion", why: "Major festival clothing brand. Large influencer program with commission.", web: "https://iheartraves.com", ig: "@iheartraves", email: "ambassadors@iheartraves.com" },
  { name: "INTO THE AM", makes: "Festival Apparel", why: "EDM-focused clothing. Active ambassador program with free gear + commissions.", web: "https://intotheam.com", ig: "@intotheam", email: "ambassadors@intotheam.com" },
  { name: "Rave Wonderland", makes: "Rave Accessories", why: "Accessories and costumes. High-volume sponsorship program.", web: "https://ravewonderland.com", ig: "@ravewonderland", email: "info@ravewonderland.com" },
  { name: "Freedom Rave Wear", makes: "Festival Outfits", why: "Body-positive rave fashion. Values diversity in ambassadors.", web: "https://freedomravewear.com", ig: "@freedomravewear", email: "info@freedomravewear.com" },
  { name: "Lunafide", makes: "Festival Clothing", why: "Premium festival fashion. Selective but high-value partnerships.", web: "https://lunafide.com", ig: "@lunafide", email: "hello@lunafide.com" },
  { name: "Electric Family", makes: "Bracelets & Apparel", why: "Community-driven brand. Charity partnerships add social impact angle.", web: "https://electricfamily.com", ig: "@electricfamily", email: "info@electricfamily.com" },
  { name: "SoJourner Bags", makes: "Festival Hydration Packs", why: "Practical festival gear. Easy partnership — they sponsor lots of creators.", web: "https://sojournersbags.com", ig: "@sojournerbags", email: "hello@sojournersbags.com" },
  { name: "Lunchbox Packs", makes: "Hydration Packs", why: "LED hydration packs. Perfect crossover with flow arts aesthetic.", web: "https://lunchboxpacks.com", ig: "@lunchboxpacks" },
];

const WELLNESS_BRANDS: Brand[] = [
  { name: "Manduka", makes: "Yoga Mats & Gear", why: "Premium yoga brand. Flow-yoga crossover content is underserved.", web: "https://manduka.com", ig: "@manduka", email: "ambassadors@manduka.com" },
  { name: "Vuori", makes: "Performance Apparel", why: "Athleisure brand. Values movement arts content creators.", web: "https://vuoriclothing.com", ig: "@vuoriclothing", email: "ambassadors@vuoriclothing.com" },
  { name: "Liquid IV", makes: "Hydration Products", why: "Festival staple. Sponsors creators who attend events regularly.", web: "https://liquid-iv.com", ig: "@liquidiv", email: "partnerships@liquid-iv.com" },
  { name: "CLIF Bar", makes: "Energy Bars", why: "Active lifestyle brand. Open to diverse athlete sponsorships.", web: "https://clifbar.com", ig: "@clifbar", email: "ambassadors@clifbar.com" },
  { name: "Hydro Flask", makes: "Water Bottles", why: "Festival essential. Lifestyle ambassador program.", web: "https://hydroflask.com", ig: "@hydroflask", email: "partnerships@hydroflask.com" },
  { name: "Blenders Eyewear", makes: "Sunglasses", why: "Festival-friendly sunglasses brand. Active influencer program with good commissions.", web: "https://blenderseyewear.com", ig: "@blaborig", email: "ambassadors@blenderseyewear.com" },
];

export default function Contact50BrandsPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      fontFamily: "Inter, -apple-system, sans-serif",
      padding: "40px 20px 80px",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <Reveal>
          <a href="/success?gen=sponsor" style={{
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
            Contact 50 Brands
          </h1>
          <p style={{
            fontSize: "clamp(13px, 3vw, 15px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            marginBottom: 16,
          }}>
            The ultimate list of flow arts, LED, festival, and lifestyle brands that sponsor artists. Use the <strong style={{ color: "#00FF00" }}>Sponsor Pitch Generator</strong> on your dashboard to craft personalized outreach to each one.
          </p>

          {/* CTA */}
          <a href="/success?gen=sponsor" style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "linear-gradient(135deg, #00FF00, #00DD00)",
            color: "#000",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            textDecoration: "none",
            borderRadius: 10,
            boxShadow: "0 0 20px rgba(0,255,0,0.4)",
            marginBottom: 32,
          }}>
            Open Sponsor Pitch Generator →
          </a>

          <div style={{
            width: "100%", maxWidth: 300, height: 2,
            background: "linear-gradient(90deg, transparent, #00FF00, #FF00FF, transparent)",
            margin: "24px auto 32px",
            boxShadow: "0 0 15px rgba(0,255,0,0.4)",
          }} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Hoop Companies (8)" accent="green" brands={HOOP_BRANDS} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Poi & Staff Companies (8)" accent="magenta" brands={POI_BRANDS} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="LED & Gloving Brands (6)" accent="green" brands={LED_BRANDS} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Flow Toy & Props Brands (8)" accent="magenta" brands={FLOW_TOY_BRANDS} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Festival Fashion & Accessories (8)" accent="green" brands={FESTIVAL_BRANDS} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Wellness & Lifestyle Brands (6)" accent="magenta" brands={WELLNESS_BRANDS} />
        </Reveal>

        {/* Bottom CTA */}
        <Reveal delay={0.05}>
          <div style={{
            textAlign: "center",
            padding: "32px 20px",
            background: "rgba(0,255,0,0.04)",
            border: "1px solid rgba(0,255,0,0.2)",
            borderRadius: 20,
            marginTop: 8,
          }}>
            <h3 style={{
              color: "#00FF00",
              fontSize: "clamp(16px, 4vw, 20px)",
              fontWeight: 700,
              marginBottom: 12,
              textShadow: "0 0 10px rgba(0,255,0,0.4)",
            }}>
              Ready to Reach Out?
            </h3>
            <p style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "clamp(12px, 3vw, 14px)",
              lineHeight: 1.7,
              marginBottom: 20,
              maxWidth: 480,
              margin: "0 auto 20px",
            }}>
              Use the <strong style={{ color: "#00FF00" }}>Sponsor Pitch Generator</strong> to create personalized outreach emails for each brand. Include your stats, your story, and what you bring to the table.
            </p>
            <a href="/success?gen=sponsor" style={{
              display: "inline-block",
              padding: "16px 36px",
              background: "linear-gradient(135deg, #00FF00, #00DD00)",
              color: "#000",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 12,
              boxShadow: "0 0 25px rgba(0,255,0,0.5)",
            }}>
              Open Sponsor Pitch Generator
            </a>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
