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

type Artist = { name: string; ig: string; followers: string; props: string; notable: string };

function ArtistRow({ name, ig, followers, props, notable, accent }: Artist & { accent: "green" | "magenta" }) {
  const c = accent === "green" ? "0,255,0" : "255,0,255";
  const color = accent === "green" ? "#00FF00" : "#FF00FF";
  return (
    <a
      href={`https://instagram.com/${ig.replace("@", "")}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", flexDirection: "column", gap: 3,
        padding: "10px 14px", borderRadius: 12,
        textDecoration: "none",
        transition: "all 0.2s ease",
        border: "1px solid transparent",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `rgba(${c},0.08)`; e.currentTarget.style.borderColor = `rgba(${c},0.3)`; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ color, fontWeight: 700, fontSize: "clamp(13px, 3vw, 15px)" }}>{name}</span>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, flexShrink: 0 }}>{followers}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: `rgba(${c},0.7)`, fontSize: 11, fontWeight: 500 }}>{ig}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>•</span>
        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>{props}</span>
      </div>
      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(10px, 2.5vw, 11px)", lineHeight: 1.5 }}>{notable}</span>
    </a>
  );
}

function CategorySection({ title, accent, artists }: { title: string; accent: "green" | "magenta"; artists: Artist[] }) {
  const c = accent === "green" ? "0,255,0" : "255,0,255";
  const color = accent === "green" ? "#00FF00" : "#FF00FF";
  return (
    <div style={{
      background: `rgba(${c},0.03)`,
      border: `1px solid rgba(${c},0.2)`,
      borderRadius: 20,
      padding: "24px 16px",
      marginBottom: 16,
      backdropFilter: "blur(20px)",
    }}>
      <h2 style={{
        color,
        fontSize: "clamp(16px, 4vw, 20px)",
        fontWeight: 700,
        marginBottom: 4,
        textShadow: `0 0 10px ${color}, 0 0 30px ${color}40`,
      }}>
        {title}
      </h2>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 12 }}>{artists.length} artists • tap to view on Instagram</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {artists.map((a, i) => (
          <ArtistRow key={i} {...a} accent={accent} />
        ))}
      </div>
    </div>
  );
}

const HOOPERS: Artist[] = [
  { name: "Hoopsy Daisy", ig: "@hoopsydaisy2.0", followers: "808K", props: "Hula Hoop, LED Hoop", notable: "Viral sensation with 14M+ views. Professional acrobat blending circus and dance" },
  { name: "Eshna Kutty", ig: "@eshnakutty", followers: "289K", props: "Hula Hoop, LED Hoop", notable: "Founder of Hoop Flo. Pioneered #SareeFlow movement in India" },
  { name: "Hulahoop.tina", ig: "@hulahoop.tina", followers: "176K", props: "Hula Hoop, LED Hoop", notable: "Afrovibes Ambassador. Huladancercise Master Trainer" },
  { name: "Aerial Hoop Tricks", ig: "@aerialhooptricks", followers: "130K", props: "Aerial Hoop, Lyra", notable: "Major community aggregator reposting aerial and dance hoop content" },
  { name: "Moodhoops", ig: "@moodhoops", followers: "66K", props: "LED Hoop, Fire Hoop", notable: "High-end LED props manufacturer. Fire and silk daytime flow props" },
  { name: "Marawa Ibrahim", ig: "@marawatheamazing", followers: "50K+", props: "Multi-Hoop", notable: "12x Guinness World Record holder. Spun 200 hoops simultaneously" },
  { name: "Deanne Love", ig: "@deannelovexo", followers: "48.6K", props: "Hula Hoop, LED, Fire", notable: "Founder of Hooplovers.tv. 800K+ YouTube views on beginner tutorial" },
  { name: "Jasmine Kienne", ig: "@hothoopdancemama", followers: "21K", props: "Hula Hoop, LED Hoop", notable: "Austin-based hooper and flutist. 13 years teaching and performing" },
  { name: "Andrea M.", ig: "@hulamyhoop", followers: "17K", props: "Multi-body Hoop", notable: "14x Guinness World Record holder. Former PhD scientist turned performer" },
  { name: "Hula Dancercise", ig: "@huladancercise", followers: "12K", props: "Hula Hoop", notable: "Founded by Rachel J.B. Jones. Fitness-focused instructor training" },
  { name: "Buket Rin", ig: "@buket_rin", followers: "12K+", props: "Hula Hoop, Fire Hoop", notable: "Stockholm-based. Sufi dance and circus acts. European tour artist" },
  { name: "Hoop Flo", ig: "@hoop.flo", followers: "10K", props: "Hula Hoop, LED Hoop", notable: "Community and education platform by Eshna Kutty" },
  { name: "Hannah", ig: "@hulahoopinghannah", followers: "9K", props: "Hula Hoop, LED Hoop", notable: "Performer, artist, instructor. Beginner to advanced tutorials" },
  { name: "Nuria Luna Llena", ig: "@nuria.luna.llena", followers: "8K+", props: "Hula Hoop, LED Hoop", notable: "Buenos Aires-based professional hoop artist" },
  { name: "Mishie Hoops", ig: "@mishie_hoops", followers: "7K+", props: "Hula Hoop", notable: "Founder of The Hula Hoop Institute. Free tutorial creator" },
  { name: "Hoop Therapist", ig: "@hoop_therapist", followers: "7K+", props: "Hula Hoop", notable: "Wellness-focused hoop instructor. Therapy and movement education" },
  { name: "Porscha Durham", ig: "@porscha.hoops", followers: "6K+", props: "Hula Hoop, Fire Hoop", notable: "New Orleans-based. Discovered hooping at music festival 2015" },
  { name: "Taylor Flows", ig: "@taylor_flows", followers: "6K+", props: "Hula Hoop, LED Hoop", notable: "Tutorial creator. Comprehensive hoop education content" },
  { name: "Ellen", ig: "@hoop_instructor", followers: "5K+", props: "Hula Hoop, LED Hoop", notable: "International instructor. 15+ years experience at major retreats" },
  { name: "Hoop With Cait", ig: "@hoop_with_cait", followers: "5K+", props: "Hula Hoop, LED Hoop", notable: "Beginner-friendly tutorial creator and instructor" },
  { name: "Galavanting Bee", ig: "@galavanting_bee", followers: "5K+", props: "Hula Hoop", notable: "Traveling hoop performer and instructor" },
  { name: "Ka Whoops", ig: "@kawhoops", followers: "3.6K", props: "LED, Fire, UV Hoop", notable: "LED, UV, fire and circus shows. Hula hoop instruction" },
  { name: "Dallys Newton", ig: "@dallys.circus", followers: "3.6K", props: "Hula Hoop, Fire, Stilts", notable: "Professional circus entertainer 14+ years. Multi-talented" },
  { name: "Brecken Rivara", ig: "@breckenrivara", followers: "3.4K", props: "Hula Hoop, LED Hoop", notable: "Original modern flowart hooping practitioner. Worldwide touring" },
  { name: "Rhiannon Rose", ig: "@the.flow.arts.fairy", followers: "3K", props: "Hoop, Poi, Fire Fans", notable: "Chicago-area LED and fire performer. Multi-prop specialist" },
];

const POI_ARTISTS: Artist[] = [
  { name: "POI Sithiprasasana", ig: "@poiploy_s", followers: "52K", props: "Poi", notable: "Thai performer with substantial Asian following. Lifestyle and flow content" },
  { name: "Ben Drexler", ig: "@drexfactor", followers: "44K", props: "Poi, Staff, Double Staff", notable: "World-renowned movement artist. 6M+ YouTube views. Founded DrexFactor" },
  { name: "Katya", ig: "@one_day_spin", followers: "15K+", props: "Poi, Contact Poi", notable: "Opened world of Russian poi spinning. Original and inspiring tutorials" },
  { name: "Noel Yee", ig: "@noelyee", followers: "12K+", props: "Poi, Staff, Fire, Buugeng", notable: "Most important figure in modern flow arts. Founded Flow Arts Institute" },
  { name: "poi.ka", ig: "@poi.ka", followers: "10K", props: "Poi", notable: "Active poi artist with growing community" },
  { name: "Home of Poi", ig: "@homeofpoi", followers: "9K", props: "Poi, Fire Poi, Contact Poi", notable: "Premier poi equipment supplier. Community hub and competition platform" },
  { name: "Isa Isaacs", ig: "@poipriestess", followers: "8K+", props: "Poi, Fire Poi, LED Poi", notable: "Founder of Temple of Poi. Highly sought-after fire poi instructor" },
  { name: "Vojta Stolbenko", ig: "@vojta_poi", followers: "8K+", props: "Poi, LED Poi", notable: "Young talented artist. Musician, filmmaker, and poi retreat instructor" },
  { name: "MCP", ig: "@mcp_staff", followers: "8K+", props: "Poi, Staff, Double Staff", notable: "Well-known staff spinner and teacher. Contact staff innovator" },
  { name: "Ronan McLoughlin", ig: "@ronan_poi", followers: "7K+", props: "Poi, Contact Poi", notable: "Developer of contact poi technique. Influential in modern contact poi" },
  { name: "Teddy", ig: "@teddy_poi", followers: "6K+", props: "Poi, Contact Poi", notable: "Rising star of American tech poi. Widest movement vocabulary of newcomers" },
  { name: "Justin Benson", ig: "@justin_contact_poi", followers: "5K+", props: "Poi, Contact Poi", notable: "15 years contact poi experience. Pioneer of the art form" },
  { name: "Liz Knights", ig: "@lizknights", followers: "5K+", props: "Poi, Buugeng, Hoop", notable: "Tech poi specialist. Organized Ladies of Tech Poi collaboration" },
  { name: "French Poi Artist", ig: "@young_poi_artist", followers: "5K+", props: "Poi, Contact Poi", notable: "Incredibly talented young artist. Multi-level tutorials. Rising star" },
  { name: "Keely Majewski", ig: "@poiandkeely", followers: "4K+", props: "Poi, LED Poi", notable: "Poi and flow artist. Instructor and performer" },
  { name: "Yacobeh", ig: "@yacobeh", followers: "3.5K", props: "Poi, Fire, Staff, Leviwand", notable: "Founder and design head of Indie.flow. Multi-prop specialist" },
  { name: "Firechill", ig: "@firechill", followers: "3K+", props: "Leviwand, Fire Props", notable: "Unique levitation wand specialist and fire performer" },
  { name: "Spaaaaces", ig: "@spaaaaces_", followers: "3K+", props: "Leviwand, Poi", notable: "Levitation wand artist with TikTok presence" },
  { name: "Vanna GoGo", ig: "@vanna.gogo", followers: "2.5K", props: "Leviwand", notable: "Florida-based levitation wand performer" },
  { name: "Chelsea Cooper", ig: "@chelseapcooper", followers: "2.4K", props: "Poi, Fire Poi", notable: "New Orleans-based flow artist. Active since 2013" },
  { name: "Schlebbzz", ig: "@schlebbzz", followers: "2K+", props: "Leviwand", notable: "Wisconsin-based leviwand artist. Multi-platform presence" },
];

const JUGGLING_ARTISTS: Artist[] = [
  { name: "Michelle C. Smith", ig: "@michelle.c.smith", followers: "788K", props: "Staff, Batons, Juggling", notable: "World Champion Baton Twirler. Stunt performer in Deadpool and Supergirl" },
  { name: "Freestyle Staff Academy", ig: "@freestyle.staff", followers: "18K", props: "Staff, Double Staff", notable: "Teaching hub for freestyle staff spinning. Educational content" },
  { name: "Kris Juggling", ig: "@krisjuggling", followers: "16K", props: "Juggling, Contact Juggling", notable: "Contact juggler with substantial following. Tutorials and performances" },
  { name: "Michael Moschen", ig: "@michael_moschen", followers: "15K+", props: "Contact Juggling", notable: "Popularised contact juggling in 1990s. Legendary performer" },
  { name: "Aileen Lawlor", ig: "@aileen.lawlor", followers: "8.8K", props: "Contact Staff, Fire Staff", notable: "Highly sought-after contact staff instructor. Worldwide workshops" },
  { name: "Gora", ig: "@gora_staff", followers: "8K+", props: "Dragon Staff, Fire Props", notable: "Creator of modern Dragon Staff. Pioneer of fire prop design" },
  { name: "Alex", ig: "@alex_staff", followers: "7K+", props: "Contact Staff, Double Staff", notable: "UK-based. One of most innovative contact staffers spinning today" },
  { name: "KC Allen", ig: "@kc_allen", followers: "6K+", props: "Contact Staff, Fire Staff", notable: "Built much of US contact staff community. Analytical approach" },
  { name: "Oscar", ig: "@oscar_staff", followers: "6K+", props: "Contact Staff", notable: "Very clean staff work with impressive sequencing" },
  { name: "Dawn", ig: "@dawn_contact", followers: "6K+", props: "Contact Juggling", notable: "Contact juggling instructor. Known worldwide from YouTube" },
  { name: "DiANNA DAVID", ig: "@dianna_david_art", followers: "5K+", props: "Contact Juggling, Hip Hop", notable: "Award-winning artist fusing hip hop dance with contact juggling" },
  { name: "Daniel Dragonstaff", ig: "@danieldragonstaff", followers: "5K+", props: "Dragon Staff, Double Staff", notable: "Dragon staff and yoga specialist. Patreon tutorial creator" },
  { name: "Marnie", ig: "@marnie_staff", followers: "5K+", props: "Contact Staff", notable: "Australia-based. One of major contact staff origin locations" },
  { name: "Jed Fowler", ig: "@jed_flow", followers: "5K+", props: "Dragon Staff, Staff", notable: "Dragon staff popularizer. Performer and instructor" },
  { name: "Chris Smith", ig: "@chrissmithwho", followers: "4.9K", props: "Juggling", notable: "Juggler of things. Creative juggling artist" },
  { name: "Rise", ig: "@rise_juggling", followers: "4K+", props: "Contact Juggling", notable: "Contact juggling artist and teacher" },
  { name: "Anna", ig: "@anna_staff", followers: "4K+", props: "Contact Staff, Double Fishtail", notable: "Hungary-based. Lineage of double fishtails. Subtle innovation" },
  { name: "Arlene Smith", ig: "@arlene_flow", followers: "4K+", props: "Poi, Hoops, Juggling", notable: "Executive Director of Seattle Flow Arts Collective" },
  { name: "Chris Mullen", ig: "@printkeg", followers: "3K+", props: "Juggling, Contact Juggling", notable: "Juggling and contact juggling artist" },
];

const MULTI_ARTISTS: Artist[] = [
  { name: "ARFlowArts", ig: "@arflowarts", followers: "40K", props: "All Props (FX App)", notable: "San Diego-based FX app for flow artists. Visual effects for videos" },
  { name: "Neo Flow Art", ig: "@neoflowart", followers: "37K", props: "Poi, Fans, Staff, Hoops", notable: "High-end LED props manufacturer. Artist showcase platform" },
  { name: "Amazing Flow Arts", ig: "@amazing_flow_arts", followers: "29K", props: "All Props, Fire, LED", notable: "Major reposting hub with thousands of flow arts posts" },
  { name: "Flow Arts Institute", ig: "@flowartsinstitute", followers: "22K", props: "Poi, Staff, Hoops, Fire", notable: "Premier flow arts education and workshop organization" },
  { name: "Flow Artists Community", ig: "@flow.artists", followers: "19K", props: "All Props", notable: "Global community aggregator. Features artists worldwide" },
  { name: "Flowtoys", ig: "@flowtoys", followers: "18K+", props: "All Props", notable: "World-favorite LED props manufacturer. Artist spotlight features" },
  { name: "Noel Yee (Foreways)", ig: "@noelyee", followers: "12K+", props: "Staff, Poi, Buugeng, Fire", notable: "Visionary performance troupe founder. Multi-prop expertise" },
  { name: "Fire Performers", ig: "@fire.performers", followers: "8K+", props: "Fire Props, All Props", notable: "Fire and flow arts community hub. Festival aggregator" },
  { name: "Burning Dan", ig: "@burning_dan", followers: "8K+", props: "Fire Props, All Props", notable: "Legendary LA fire dancer. Pioneer with philosophical approach" },
  { name: "Vulcan Crew", ig: "@vulcan_crew", followers: "7K+", props: "Fire Props, All Props", notable: "Six-person fire troupe. SF Bay Area. Emotive performances" },
  { name: "Synergy FlowArts", ig: "@synergyflowarts", followers: "6K+", props: "All Props", notable: "Festival organizer and community platform. Artist network" },
  { name: "SpinCo", ig: "@spinco", followers: "6K+", props: "All Props", notable: "Performance collective with multiple skilled practitioners" },
  { name: "Sacred Flow Art", ig: "@sacredflowart", followers: "6K+", props: "All Props", notable: "Premier flow arts shop and community hub" },
  { name: "Brettdstar Schmerl", ig: "@brettdstar", followers: "5K+", props: "Dragon Staff, Staff, Fire", notable: "Dragon staff popularizer. Multi-prop performer and instructor" },
  { name: "Threeworlds", ig: "@threeworlds", followers: "6K+", props: "Dragon Staff, Staff, Fire", notable: "Dragon staff popularizer and performer" },
  { name: "Kate McCoy", ig: "@kate_mccoy", followers: "5K+", props: "Poi, Staff, Fire", notable: "Foreways Project member. Choreographer and multi-prop performer" },
  { name: "Kinetic Fire", ig: "@kinetic_fire", followers: "5K+", props: "Fire Props, All Props", notable: "4-day fire arts festival and community. Retreats for performers" },
  { name: "Fire Arts Center", ig: "@fireartscenter", followers: "5K+", props: "Fire Props, All Props", notable: "Chicago-based fire arts education and community center" },
  { name: "Bonobo Flow", ig: "@bonoboflow", followers: "5K+", props: "All Props", notable: "Flow props supplier and educational content provider" },
  { name: "Squiggly McPickins", ig: "@squiggly_mcpickins", followers: "4K+", props: "Leviwand, Flow Props", notable: "Wand flow artist with YouTube channel. Tutorials and performance" },
  { name: "Flow Tribe", ig: "@flowtribe", followers: "4K+", props: "All Props", notable: "New Orleans-based flow arts community and social group" },
  { name: "Adam Lobo", ig: "@adam_lobo", followers: "4K+", props: "Dragon Staff, Staff", notable: "Dragon staff performer with innovative techniques" },
  { name: "Gina McGrath", ig: "@gina_mcgrath", followers: "4K+", props: "Poi, Staff, Fire", notable: "Foreways Project member. Emotive choreography specialist" },
  { name: "Mustafa Anwar", ig: "@mustafa_flow", followers: "3K+", props: "Leviwand, Poi, Staff", notable: "Chicago-based flow artist. Leviwand specialist" },
];

export default function Top100ArtistsPage() {
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
          <a href="/success" style={{
            color: "#00FF00", fontSize: 12, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, opacity: 0.7,
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
            Top 100 Flow Artists
          </h1>
          <p style={{
            fontSize: "clamp(13px, 3vw, 15px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}>
            The most influential flow artists on Instagram. Follow them, study their content, collaborate, and build your network. Organized by prop specialty.
          </p>
          <div style={{
            width: "100%", maxWidth: 300, height: 2,
            background: "linear-gradient(90deg, transparent, #00FF00, #FF00FF, transparent)",
            margin: "0 auto 32px",
            boxShadow: "0 0 15px rgba(0,255,0,0.4)",
          }} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Hoops" accent="green" artists={HOOPERS} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Poi & Leviwand" accent="magenta" artists={POI_ARTISTS} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Juggling, Staff & Props" accent="green" artists={JUGGLING_ARTISTS} />
        </Reveal>

        <Reveal delay={0.05}>
          <CategorySection title="Multi-Prop & Community" accent="magenta" artists={MULTI_ARTISTS} />
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
              Follow these artists, engage with their content, and build genuine relationships. Upload your best clips to Flow Arts Professional and we&apos;ll post them as YouTube Shorts.
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
