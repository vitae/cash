"use client";
import { useState } from "react";

type FlowType = "sponsor" | "booking" | "epk";
type Step = { title: string; fields: Field[] };
type Field = { id: string; label: string; type: string; placeholder?: string; options?: string[] };

const flows: Record<FlowType, { title: string; color: string; accent: string; steps: Step[] }> = {
  sponsor: { title: "Custom Sponsor Pitch", color: "#00FF00", accent: "#FF00FF", steps: [
    { title: "About You", fields: [
      { id: "name", label: "Stage Name Or Artist Name", type: "text", placeholder: "e.g. FlowMaster Kai" },
      { id: "location", label: "Where Are You Based?", type: "text", placeholder: "e.g. Oahu, Hawaii" },
      { id: "years", label: "Years Of Flow Experience", type: "number", placeholder: "e.g. 5" },
      { id: "props", label: "What Props Do You Flow With?", type: "text", placeholder: "e.g. Poi, hoops, staff" },
      { id: "style", label: "Describe Your Flow Style.", type: "textarea", placeholder: "e.g. I blend liquid poi with LED visuals." },
    ]},
    { title: "Your Reach", fields: [
      { id: "ig_handle", label: "Instagram Handle", type: "text", placeholder: "@yourhandle" },
      { id: "ig_followers", label: "Instagram Followers", type: "number", placeholder: "e.g. 2500" },
      { id: "tiktok_handle", label: "TikTok Handle (Optional)", type: "text", placeholder: "@yourhandle" },
      { id: "events", label: "Notable Events Or Festivals", type: "textarea", placeholder: "e.g. Electric Forest, Burning Man." },
    ]},
    { title: "Target Brands", fields: [
      { id: "brands", label: "Which Brands Do You Want To Pitch?", type: "multiselect", options: ["Flowtoys","UltraPoi","Moodhoops","SpinFX","Pyroterra","Flow DNA","Dark Monk","Emazing Lights","GloFX","Futuristic Lights","Other"] },
      { id: "ask", label: "What Are You Asking For?", type: "multiselect", options: ["Free Product To Review","Ambassador Program","Paid Sponsorship","Content Collab","Discount Code","Event Sponsorship"] },
      { id: "unique", label: "What Makes You Valuable To These Brands?", type: "textarea", placeholder: "e.g. I teach weekly workshops with 20+ students." },
    ]},
  ]},
  booking: { title: "Event Booking Sheet", color: "#FF00FF", accent: "#00FF00", steps: [
    { title: "Artist Info", fields: [
      { id: "name", label: "Stage Name Or Artist Name", type: "text", placeholder: "e.g. FlowMaster Kai" },
      { id: "location", label: "Where Are You Based?", type: "text", placeholder: "e.g. Oahu, Hawaii" },
      { id: "travel", label: "Willing To Travel?", type: "select", options: ["Local Only","Regional","National","International"] },
      { id: "props", label: "Performance Props", type: "text", placeholder: "e.g. LED poi, fire staff" },
      { id: "act_types", label: "Types Of Performance", type: "multiselect", options: ["LED / Glow","Fire","UV / Blacklight","Ambient Roaming","Stage Show","Interactive","Workshop","Other"] },
    ]},
    { title: "Tech Rider", fields: [
      { id: "set_length", label: "Standard Set Length (Minutes)", type: "number", placeholder: "e.g. 20" },
      { id: "space", label: "Minimum Performance Space", type: "text", placeholder: "e.g. 10 ft. x 10 ft." },
      { id: "fire_needs", label: "Fire Requirements (If Applicable)", type: "textarea", placeholder: "e.g. Safety officer, extinguisher." },
      { id: "music", label: "Music Requirements", type: "select", options: ["I Bring My Own","Need PA / Aux Input","Work With DJ","No Music Needed"] },
    ]},
    { title: "Rates And Availability", fields: [
      { id: "rate_solo", label: "Solo Rate (Per Hour)", type: "text", placeholder: "e.g. $150-$250" },
      { id: "rate_group", label: "Group Rate (Optional)", type: "text", placeholder: "e.g. $400-$600" },
      { id: "availability", label: "General Availability", type: "multiselect", options: ["Weekday Evenings","Weekend Nights","Daytime Events","Festivals","Corporate","Private Parties","Weddings"] },
    ]},
  ]},
  epk: { title: "Artist Press Kit", color: "#00FF00", accent: "#FF00FF", steps: [
    { title: "Your Story", fields: [
      { id: "name", label: "Artist Or Stage Name", type: "text", placeholder: "e.g. FlowMaster Kai" },
      { id: "location", label: "Where Are You From?", type: "text", placeholder: "e.g. Born in Portland, based in Oahu." },
      { id: "years", label: "Years In Flow Arts", type: "number", placeholder: "e.g. 7" },
      { id: "origin", label: "How Did You Get Into Flow Arts?", type: "textarea", placeholder: "e.g. Saw a fire spinner at a bonfire." },
      { id: "fav_toy", label: "Favorite Flow Toy And Why.", type: "textarea", placeholder: "e.g. Flowtoys podpoi." },
    ]},
    { title: "Social Proof", fields: [
      { id: "testimonial1", label: "Testimonial #1", type: "textarea", placeholder: "\"Best fire show ever.\" — Producer" },
      { id: "notable", label: "Notable Achievements", type: "textarea", placeholder: "e.g. Featured in Honolulu Magazine." },
    ]},
    { title: "Socials And Contact", fields: [
      { id: "ig", label: "Instagram", type: "text", placeholder: "@yourhandle" },
      { id: "tiktok", label: "TikTok", type: "text", placeholder: "@yourhandle" },
      { id: "youtube", label: "YouTube", type: "text", placeholder: "youtube.com/@channel" },
      { id: "email", label: "Booking Email", type: "text", placeholder: "bookings@yoursite.com" },
      { id: "website", label: "Website", type: "text", placeholder: "https://yoursite.com" },
    ]},
  ]},
};

export default function SuccessPage() {
  const [currentFlow, setCurrentFlow] = useState<FlowType | null>(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const g = { background: "rgba(0,255,0,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(0,255,0,0.12)", borderRadius: 20, padding: "24px 20px", textAlign: "center" as const, cursor: "pointer", transition: "all 0.25s" };
  const m = { ...g, background: "rgba(255,0,255,0.03)", border: "1px solid rgba(255,0,255,0.12)" };
  const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", padding: "14px 16px", fontFamily: "Montserrat, sans-serif", fontSize: 14, fontWeight: 300, outline: "none", WebkitAppearance: "none" as const };

  if (!currentFlow) {
    return (
      <main style={{ padding: "28px 16px", maxWidth: 430, margin: "0 auto", color: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,0,255,0.5)", marginBottom: 16 }}>Glow Wit Da Flow</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, textTransform: "uppercase", color: "#00FF00", margin: 0, lineHeight: 1.1 }}>Flow Arts</h1>
          <h2 style={{ fontSize: 16, fontWeight: 400, letterSpacing: 8, textTransform: "uppercase", color: "rgba(255,0,255,0.6)", margin: "4px 0 0" }}>Professional</h2>
          <div style={{ width: "100%", maxWidth: 200, height: 1.5, background: "rgba(0,255,0,0.3)", margin: "14px auto", borderRadius: 1 }} />
          <div style={{ display: "inline-block", padding: "6px 18px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 10, color: "#00FF00" }}>Unlocked</div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,0,255,0.5)", fontWeight: 500, textAlign: "center", marginBottom: 6 }}>The Thinking Has Already Been Done, So You Can Create!</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300, textAlign: "center", marginBottom: 24 }}>Choose A Generator Below To Get Started.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          <div style={g} onClick={() => setCurrentFlow("sponsor")}><div style={{ fontSize: 18, fontWeight: 600, color: "#00FF00", marginBottom: 4 }}>Custom Sponsor Pitch</div><div style={{ width: "100%", maxWidth: 240, height: 1.5, background: "rgba(255,0,255,0.3)", margin: "0 auto 10px", borderRadius: 1 }} /><p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>Personalized pitch for 50 of the best brand companies.</p></div>
          <div style={m} onClick={() => setCurrentFlow("booking")}><div style={{ fontSize: 18, fontWeight: 600, color: "#FF00FF", marginBottom: 4 }}>Event Booking Sheet</div><div style={{ width: "100%", maxWidth: 220, height: 1.5, background: "rgba(0,255,0,0.3)", margin: "0 auto 10px", borderRadius: 1 }} /><p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>Tech rider, rates, and availability for event producers.</p></div>
          <div style={g} onClick={() => setCurrentFlow("epk")}><div style={{ fontSize: 18, fontWeight: 600, color: "#00FF00", marginBottom: 4 }}>Artist Press Kit</div><div style={{ width: "100%", maxWidth: 170, height: 1.5, background: "rgba(255,0,255,0.3)", margin: "0 auto 10px", borderRadius: 1 }} /><p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>Full EPK with bio, reels, testimonials, and socials.</p></div>
        </div>
        <div style={{ textAlign: "center", paddingTop: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,0,255,0.25)", margin: "0 0 4px" }}>Your Vibe Attracts Your Tribe.</p>
          <div style={{ width: "100%", maxWidth: 220, height: 1, background: "rgba(0,255,0,0.15)", margin: "0 auto 4px" }} />
          <p style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "rgba(0,255,0,0.2)", margin: 0 }}>Glow Wit Da Flow</p>
        </div>
      </main>
    );
  }

  const flow = flows[currentFlow];
  const currentStep = flow.steps[step];
  const isLast = step === flow.steps.length - 1;

  if (result) {
    return (
      <main style={{ padding: "28px 16px", maxWidth: 430, margin: "0 auto", color: "#fff" }}>
        <button onClick={() => { setResult(null); setCurrentFlow(null); setStep(0); setFormData({}); }} style={{ fontSize: 12, color: "rgba(255,0,255,0.6)", cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontWeight: 500, border: "none", background: "none", fontFamily: "Montserrat, sans-serif", marginBottom: 20, display: "inline-block", padding: "8px 0" }}>&larr; Back</button>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "inline-block", padding: "5px 14px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(255,0,255,0.15)", border: "1px solid rgba(255,0,255,0.25)", borderRadius: 10, color: "#FF00FF", marginBottom: 14 }}>Generated</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: flow.color }}>{flow.title}</div>
          <div style={{ width: "100%", maxWidth: 240, height: 1.5, background: flow.accent, opacity: 0.3, margin: "8px auto", borderRadius: 1 }} />
          <p style={{ fontSize: 12, color: "rgba(255,0,255,0.45)", fontWeight: 500, margin: "0 0 6px" }}>The Thinking Has Already Been Done, So You Can Create!</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Personalized For {(formData.name as string) || "You"}. Edit, Copy, And Send.</p>
        </div>
        <div style={{ borderRadius: 20, padding: 20, background: "rgba(0,255,0,0.02)", backdropFilter: "blur(40px)", border: "1px solid rgba(0,255,0,0.1)", whiteSpace: "pre-wrap", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontWeight: 300 }}>{result}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ flex: 1, padding: 14, fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", background: "rgba(0,255,0,0.15)", border: "1px solid rgba(0,255,0,0.3)", borderRadius: 16, color: "#00FF00", fontFamily: "Montserrat, sans-serif", cursor: "pointer", WebkitAppearance: "none" as const }}>{copied ? "Copied!" : "Copy"}</button>
          <button onClick={() => { setResult(null); setCurrentFlow(null); setStep(0); setFormData({}); }} style={{ flex: 1, padding: 14, fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,0,255,0.15)", borderRadius: 14, color: "rgba(255,0,255,0.5)", fontFamily: "Montserrat, sans-serif", cursor: "pointer", WebkitAppearance: "none" as const }}>New</button>
        </div>
      </main>
    );
  }

  if (generating) {
    return (
      <main style={{ padding: "28px 16px", maxWidth: 430, margin: "0 auto", color: "#fff" }}>
        <div style={{ textAlign: "center", padding: "60px 16px" }}>
          <div style={{ display: "inline-block", padding: "5px 14px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(255,0,255,0.15)", border: "1px solid rgba(255,0,255,0.25)", borderRadius: 10, color: "#FF00FF", marginBottom: 14 }}>Generating</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: flow.color, marginBottom: 6 }}>{flow.title}</div>
          <p style={{ fontSize: 12, color: "rgba(255,0,255,0.45)", fontWeight: 500, margin: "0 0 24px" }}>The Thinking Has Already Been Done, So You Can Create!</p>
          <div style={{ width: 200, height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, margin: "0 auto", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", background: "rgba(0,255,0,0.5)", borderRadius: 2, animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
          <style>{`@keyframes pulse{0%,100%{width:30%}50%{width:80%}}`}</style>
        </div>
      </main>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: currentFlow, formData }),
      });
      const data = await res.json();
      setResult(data.content || "Generation complete. Check your email for the full output.");
    } catch {
      setResult("Something went wrong. Please try again.");
    }
    setGenerating(false);
  };

  const toggleMulti = (fid: string, val: string) => {
    const current = (formData[fid] as string[]) || [];
    const idx = current.indexOf(val);
    const next = idx > -1 ? current.filter((v) => v !== val) : [...current, val];
    setFormData({ ...formData, [fid]: next });
  };

  return (
    <main style={{ padding: "28px 16px", maxWidth: 430, margin: "0 auto", color: "#fff" }}>
      <button onClick={() => step === 0 ? (setCurrentFlow(null), setStep(0), setFormData({})) : setStep(step - 1)} style={{ fontSize: 12, color: "rgba(255,0,255,0.6)", cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontWeight: 500, border: "none", background: "none", fontFamily: "Montserrat, sans-serif", marginBottom: 20, display: "inline-block", padding: "8px 0" }}>&larr; {step === 0 ? "Back" : "Previous"}</button>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: flow.accent, opacity: 0.5, marginBottom: 6 }}>{flow.title}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: flow.color }}>{currentStep.title}</div>
        <div style={{ width: "100%", maxWidth: 180, height: 1.5, background: flow.accent, opacity: 0.3, margin: "8px auto 4px", borderRadius: 1 }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Step {step + 1} Of {flow.steps.length}</div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {flow.steps.map((_, i) => <div key={i} style={{ width: "100%", height: 4, background: i < step ? "rgba(255,0,255,0.5)" : i === step ? "rgba(0,255,0,0.5)" : "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
      </div>
      {currentStep.fields.map((f) => (
        <div key={f.id} style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: flow.color === "#FF00FF" ? "#FF00FF" : "#00FF00", marginBottom: 8, display: "block" }}>{f.label}</label>
          {(f.type === "text" || f.type === "url" || f.type === "number") && <input type={f.type} placeholder={f.placeholder} value={(formData[f.id] as string) || ""} onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })} style={inputStyle} />}
          {f.type === "textarea" && <textarea placeholder={f.placeholder} value={(formData[f.id] as string) || ""} onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })} style={{ ...inputStyle, resize: "vertical" as const, minHeight: 90 }} />}
          {f.type === "select" && <select value={(formData[f.id] as string) || ""} onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })} style={{ ...inputStyle, cursor: "pointer", color: formData[f.id] ? "#fff" : "rgba(255,255,255,0.5)" }}><option value="">Select...</option>{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>}
          {f.type === "multiselect" && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>{f.options?.map((o) => { const a = ((formData[f.id] as string[]) || []).includes(o); return <button key={o} onClick={() => toggleMulti(f.id, o)} style={{ padding: "8px 14px", fontSize: 12, fontWeight: 500, fontFamily: "Montserrat, sans-serif", cursor: "pointer", borderRadius: 12, border: `1px solid ${a ? "rgba(0,255,0,0.3)" : "rgba(255,255,255,0.08)"}`, background: a ? "rgba(0,255,0,0.1)" : "rgba(255,255,255,0.03)", color: a ? "#00FF00" : "rgba(255,255,255,0.35)", WebkitAppearance: "none" as const }}>{o}</button>; })}</div>}
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        {isLast ? (
          <button onClick={handleGenerate} style={{ padding: "16px 40px", fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", width: "100%", background: "rgba(0,255,0,0.15)", border: "1px solid rgba(0,255,0,0.3)", borderRadius: 16, color: "#00FF00", fontFamily: "Montserrat, sans-serif", cursor: "pointer", WebkitAppearance: "none" as const }}>Generate</button>
        ) : (
          <button onClick={() => setStep(step + 1)} style={{ padding: "16px 40px", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", width: "100%", background: "rgba(0,255,0,0.15)", border: "1px solid rgba(0,255,0,0.3)", borderRadius: 16, color: "#00FF00", fontFamily: "Montserrat, sans-serif", cursor: "pointer", WebkitAppearance: "none" as const }}>Next Step &rarr;</button>
        )}
      </div>
    </main>
  );
}
