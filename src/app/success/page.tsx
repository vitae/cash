"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

const PROGRESS_MESSAGES = [
  "Analyzing your flow profile...",
  "Crafting personalized content...",
  "Adding professional polish...",
  "Almost ready to shine...",
];

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="page-wrap" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 16, fontSize: 13 }}>Loading...</p>
        </div>
      </main>
    }>
      <SuccessPageInner />
    </Suspense>
  );
}

function SuccessPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [currentFlow, setCurrentFlow] = useState<FlowType | null>(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);
  const [fadeClass, setFadeClass] = useState("fi");
  const mainRef = useRef<HTMLElement>(null);

  // Verify payment on mount
  useEffect(() => {
    const sid = searchParams.get("session_id");
    if (!sid) { router.replace("/"); return; }
    setSessionId(sid);
    fetch(`/api/verify?session_id=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.verified) {
          setVerified(true);
          setUserEmail(data.email || null);
          localStorage.setItem("fa_session_id", sid);
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"))
      .finally(() => setVerifying(false));
  }, [searchParams, router]);

  // Progress message rotation during generation
  useEffect(() => {
    if (!generating) return;
    setProgressIdx(0);
    const iv = setInterval(() => setProgressIdx((i) => (i + 1) % PROGRESS_MESSAGES.length), 3000);
    return () => clearInterval(iv);
  }, [generating]);

  // Entrance animation trigger
  useEffect(() => {
    setFadeClass("");
    const t = requestAnimationFrame(() => setFadeClass("fi"));
    return () => cancelAnimationFrame(t);
  }, [currentFlow, step, result, generating]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const toggleMulti = (fid: string, val: string) => {
    const current = (formData[fid] as string[]) || [];
    const idx = current.indexOf(val);
    const next = idx > -1 ? current.filter((v) => v !== val) : [...current, val];
    setFormData({ ...formData, [fid]: next });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: currentFlow, formData, session_id: sessionId }),
      });
      const data = await res.json();
      setResult(data.content || "Generation complete. Check your email for the full output.");
    } catch {
      setResult("Something went wrong. Please try again.");
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    showToast("Copied to clipboard!");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    if (!currentFlow || result || generating) return;
    e.preventDefault();
    const flow = flows[currentFlow];
    const isLast = step === flow.steps.length - 1;
    if (isLast) handleGenerate();
    else setStep(step + 1);
  };

  const resetAll = () => {
    setResult(null);
    setCurrentFlow(null);
    setStep(0);
    setFormData({});
  };

  // ─── Styles ───────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');

    * { box-sizing: border-box; }

    body {
      background: #000;
      font-family: 'Montserrat', sans-serif;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }

    @keyframes pulse { 0%,100%{width:20%} 50%{width:90%} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes dotPulse { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes glowPulse { 0%,100%{text-shadow:0 0 10px rgba(0,255,0,0.4)} 50%{text-shadow:0 0 25px rgba(0,255,0,0.7),0 0 50px rgba(0,255,0,0.3)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes toastIn { from{opacity:0;transform:translate(-50%,12px)} to{opacity:1;transform:translate(-50%,0)} }
    @keyframes toastOut { from{opacity:1;transform:translate(-50%,0)} to{opacity:0;transform:translate(-50%,12px)} }

    .fi { animation: fadeInUp 0.45s ease-out both; }

    .glow-green { text-shadow: 0 0 12px rgba(0,255,0,0.5), 0 0 30px rgba(0,255,0,0.2); }
    .glow-magenta { text-shadow: 0 0 12px rgba(255,0,255,0.5), 0 0 30px rgba(255,0,255,0.2); }
    .glow-green-anim { animation: glowPulse 3s ease-in-out infinite; }

    .gen-card {
      background: rgba(0,255,0,0.03);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid rgba(0,255,0,0.12);
      border-radius: 20px;
      padding: 28px 22px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .gen-card:hover {
      border-color: rgba(0,255,0,0.35);
      background: rgba(0,255,0,0.06);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0,255,0,0.08);
    }
    .gen-card-m {
      background: rgba(255,0,255,0.03);
      border: 1px solid rgba(255,0,255,0.12);
    }
    .gen-card-m:hover {
      border-color: rgba(255,0,255,0.35);
      background: rgba(255,0,255,0.06);
      box-shadow: 0 8px 32px rgba(255,0,255,0.08);
    }

    .field-input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      color: #fff;
      padding: 15px 18px;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      font-weight: 300;
      outline: none;
      -webkit-appearance: none;
      transition: border-color 0.25s, box-shadow 0.25s;
    }
    .field-input:focus {
      border-color: rgba(0,255,0,0.4);
      box-shadow: 0 0 0 3px rgba(0,255,0,0.08), 0 0 20px rgba(0,255,0,0.06);
    }
    .field-input::placeholder { color: rgba(255,255,255,0.25); }
    .field-input-m:focus {
      border-color: rgba(255,0,255,0.4);
      box-shadow: 0 0 0 3px rgba(255,0,255,0.08), 0 0 20px rgba(255,0,255,0.06);
    }

    .multi-btn {
      padding: 9px 16px;
      font-size: 12px;
      font-weight: 500;
      font-family: 'Montserrat', sans-serif;
      cursor: pointer;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: rgba(255,255,255,0.4);
      transition: all 0.2s ease;
      -webkit-appearance: none;
    }
    .multi-btn:hover {
      border-color: rgba(0,255,0,0.25);
      color: rgba(0,255,0,0.6);
    }
    .multi-btn-active {
      border-color: rgba(0,255,0,0.4) !important;
      background: rgba(0,255,0,0.1) !important;
      color: #00FF00 !important;
      box-shadow: 0 0 12px rgba(0,255,0,0.1);
    }
    .multi-btn-active-m {
      border-color: rgba(255,0,255,0.4) !important;
      background: rgba(255,0,255,0.1) !important;
      color: #FF00FF !important;
      box-shadow: 0 0 12px rgba(255,0,255,0.1);
    }

    .btn-primary {
      padding: 16px 40px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      width: 100%;
      background: rgba(0,255,0,0.12);
      border: 1px solid rgba(0,255,0,0.3);
      border-radius: 16px;
      color: #00FF00;
      font-family: 'Montserrat', sans-serif;
      cursor: pointer;
      -webkit-appearance: none;
      transition: all 0.25s ease;
    }
    .btn-primary:hover {
      background: rgba(0,255,0,0.18);
      border-color: rgba(0,255,0,0.5);
      box-shadow: 0 0 24px rgba(0,255,0,0.12);
      transform: translateY(-1px);
    }

    .btn-secondary {
      padding: 14px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,0,255,0.15);
      border-radius: 14px;
      color: rgba(255,0,255,0.5);
      font-family: 'Montserrat', sans-serif;
      cursor: pointer;
      -webkit-appearance: none;
      transition: all 0.25s ease;
    }
    .btn-secondary:hover {
      background: rgba(255,0,255,0.08);
      border-color: rgba(255,0,255,0.3);
    }

    .btn-back {
      font-size: 12px;
      color: rgba(255,0,255,0.6);
      cursor: pointer;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 500;
      border: none;
      background: none;
      font-family: 'Montserrat', sans-serif;
      padding: 8px 0;
      transition: color 0.2s;
    }
    .btn-back:hover { color: #FF00FF; }

    .progress-bar { width: 100%; height: 5px; border-radius: 3px; transition: all 0.5s ease; }
    .progress-bar-done { background: linear-gradient(90deg, rgba(255,0,255,0.6), rgba(255,0,255,0.4)); }
    .progress-bar-active {
      background: linear-gradient(90deg, rgba(0,255,0,0.7), rgba(0,255,0,0.4));
      box-shadow: 0 0 8px rgba(0,255,0,0.3);
    }
    .progress-bar-pending { background: rgba(255,255,255,0.06); }

    .result-block {
      border-radius: 20px;
      padding: 24px;
      background: rgba(0,255,0,0.02);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid rgba(0,255,0,0.1);
      white-space: pre-wrap;
      font-size: 13px;
      color: rgba(255,255,255,0.75);
      line-height: 1.9;
      font-weight: 300;
    }
    .result-block strong, .result-block b { color: #00FF00; font-weight: 600; }

    .toast {
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translate(-50%, 0);
      padding: 12px 28px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: rgba(0,255,0,0.15);
      border: 1px solid rgba(0,255,0,0.3);
      border-radius: 100px;
      color: #00FF00;
      font-family: 'Montserrat', sans-serif;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 1000;
      pointer-events: none;
      animation: toastIn 0.3s ease-out;
    }
    .toast-exit { animation: toastOut 0.3s ease-in forwards; }

    .dots span {
      display: inline-block;
      width: 8px; height: 8px;
      margin: 0 3px;
      border-radius: 50%;
      background: #00FF00;
      animation: dotPulse 1.4s infinite ease-in-out both;
    }
    .dots span:nth-child(1) { animation-delay: -0.32s; }
    .dots span:nth-child(2) { animation-delay: -0.16s; }
    .dots span:nth-child(3) { animation-delay: 0s; }

    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(0,255,0,0.15);
      border-top-color: #00FF00;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }

    @media (min-width: 640px) {
      .page-wrap { max-width: 800px !important; padding: 48px 40px !important; }
      .gen-grid { display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 16px !important; }
      .result-block { padding: 32px; font-size: 14px; }
    }
  `;

  // ─── Loading / verifying ──────────────────────────────────────────────
  if (verifying || !verified) {
    return (
      <>
        <style>{css}</style>
        <main className="page-wrap" style={{ padding: "28px 16px", maxWidth: 480, margin: "0 auto", color: "#fff" }}>
          <div style={{ textAlign: "center", paddingTop: 100 }}>
            <div className="spinner" />
            <div style={{ fontSize: 13, color: "rgba(255,0,255,0.5)", fontWeight: 500, letterSpacing: 1 }}>
              Verifying your purchase...
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─── Generator selection ──────────────────────────────────────────────
  if (!currentFlow) {
    return (
      <>
        <style>{css}</style>
        <main ref={mainRef} className={`page-wrap ${fadeClass}`} style={{ padding: "28px 16px", maxWidth: 480, margin: "0 auto", color: "#fff" }}>
          <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,0,255,0.5)", marginBottom: 16 }}>Glow Wit Da Flow</div>
            <h1 className="glow-green glow-green-anim" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, textTransform: "uppercase", color: "#00FF00", margin: 0, lineHeight: 1.1 }}>Flow Arts</h1>
            <h2 className="glow-magenta" style={{ fontSize: 16, fontWeight: 400, letterSpacing: 8, textTransform: "uppercase", color: "rgba(255,0,255,0.6)", margin: "4px 0 0" }}>Professional</h2>
            <div style={{ width: "100%", maxWidth: 200, height: 1.5, background: "rgba(0,255,0,0.3)", margin: "14px auto", borderRadius: 1 }} />
            <div style={{ display: "inline-block", padding: "6px 18px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 10, color: "#00FF00" }}>Unlocked</div>
            {userEmail && (
              <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>
                Welcome, <span style={{ color: "rgba(0,255,0,0.7)", fontWeight: 500 }}>{userEmail}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,0,255,0.5)", fontWeight: 500, textAlign: "center", marginBottom: 6 }}>The Thinking Has Already Been Done, So You Can Create!</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300, textAlign: "center", marginBottom: 24 }}>Choose A Generator Below To Get Started.</p>

          <div className="gen-grid" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            <div className="gen-card" onClick={() => setCurrentFlow("sponsor")}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#00FF00", marginBottom: 4 }}>Custom Sponsor Pitch</div>
              <div style={{ width: "100%", maxWidth: 240, height: 1.5, background: "rgba(255,0,255,0.3)", margin: "0 auto 10px", borderRadius: 1 }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300, margin: 0 }}>Personalized pitch for 50 of the best brand companies.</p>
            </div>
            <div className="gen-card gen-card-m" onClick={() => setCurrentFlow("booking")}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#FF00FF", marginBottom: 4 }}>Event Booking Sheet</div>
              <div style={{ width: "100%", maxWidth: 220, height: 1.5, background: "rgba(0,255,0,0.3)", margin: "0 auto 10px", borderRadius: 1 }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300, margin: 0 }}>Tech rider, rates, and availability for event producers.</p>
            </div>
            <div className="gen-card" onClick={() => setCurrentFlow("epk")}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#00FF00", marginBottom: 4 }}>Artist Press Kit</div>
              <div style={{ width: "100%", maxWidth: 170, height: 1.5, background: "rgba(255,0,255,0.3)", margin: "0 auto 10px", borderRadius: 1 }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300, margin: 0 }}>Full EPK with bio, reels, testimonials, and socials.</p>
            </div>
          </div>

          <div style={{ textAlign: "center", paddingTop: 16 }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,0,255,0.25)", margin: "0 0 4px" }}>Your Vibe Attracts Your Tribe.</p>
            <div style={{ width: "100%", maxWidth: 220, height: 1, background: "rgba(0,255,0,0.15)", margin: "0 auto 4px" }} />
            <p style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "rgba(0,255,0,0.2)", margin: 0 }}>Glow Wit Da Flow</p>
          </div>
        </main>
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  const flow = flows[currentFlow];
  const currentStep = flow.steps[step];
  const isLast = step === flow.steps.length - 1;
  const isMagenta = flow.color === "#FF00FF";
  const focusClass = isMagenta ? "field-input field-input-m" : "field-input";
  const multiActiveClass = isMagenta ? "multi-btn multi-btn-active-m" : "multi-btn multi-btn-active";

  // ─── Result view ──────────────────────────────────────────────────────
  if (result) {
    return (
      <>
        <style>{css}</style>
        <main className={`page-wrap ${fadeClass}`} style={{ padding: "28px 16px", maxWidth: 480, margin: "0 auto", color: "#fff" }}>
          <button className="btn-back" onClick={resetAll}>&larr; Back</button>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "inline-block", padding: "5px 14px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(255,0,255,0.15)", border: "1px solid rgba(255,0,255,0.25)", borderRadius: 10, color: "#FF00FF", marginBottom: 14 }}>Generated</div>
            <div className={isMagenta ? "glow-magenta" : "glow-green"} style={{ fontSize: 22, fontWeight: 600, color: flow.color }}>{flow.title}</div>
            <div style={{ width: "100%", maxWidth: 240, height: 1.5, background: flow.accent, opacity: 0.3, margin: "8px auto", borderRadius: 1 }} />
            <p style={{ fontSize: 12, color: "rgba(255,0,255,0.45)", fontWeight: 500, margin: "0 0 6px" }}>The Thinking Has Already Been Done, So You Can Create!</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Personalized For {(formData.name as string) || "You"}. Edit, Copy, And Send.</p>
          </div>
          <div className="result-block">{result}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleCopy}>Copy</button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={resetAll}>New</button>
          </div>
        </main>
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  // ─── Generating view ──────────────────────────────────────────────────
  if (generating) {
    return (
      <>
        <style>{css}</style>
        <main className={`page-wrap ${fadeClass}`} style={{ padding: "28px 16px", maxWidth: 480, margin: "0 auto", color: "#fff" }}>
          <div style={{ textAlign: "center", padding: "60px 16px" }}>
            <div style={{ display: "inline-block", padding: "5px 14px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(255,0,255,0.15)", border: "1px solid rgba(255,0,255,0.25)", borderRadius: 10, color: "#FF00FF", marginBottom: 14 }}>Generating</div>
            <div className={isMagenta ? "glow-magenta" : "glow-green"} style={{ fontSize: 22, fontWeight: 600, color: flow.color, marginBottom: 6 }}>{flow.title}</div>
            <div className="dots" style={{ margin: "20px 0" }}>
              <span /><span /><span />
            </div>
            <p style={{ fontSize: 13, color: "rgba(0,255,0,0.6)", fontWeight: 400, margin: "0 0 24px", minHeight: 20, transition: "opacity 0.3s" }}>
              {PROGRESS_MESSAGES[progressIdx]}
            </p>
            <div style={{ width: 240, height: 5, background: "rgba(255,255,255,0.04)", borderRadius: 3, margin: "0 auto", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #00FF00, rgba(0,255,0,0.3))", borderRadius: 3, animation: "pulse 2s ease-in-out infinite" }} />
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─── Form view ────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <main
        className={`page-wrap ${fadeClass}`}
        style={{ padding: "28px 16px", maxWidth: 480, margin: "0 auto", color: "#fff" }}
        onKeyDown={handleKeyDown}
      >
        <button className="btn-back" onClick={() => step === 0 ? resetAll() : setStep(step - 1)}>
          &larr; {step === 0 ? "Back" : "Previous"}
        </button>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: flow.accent, opacity: 0.5, marginBottom: 6 }}>{flow.title}</div>
          <div className={isMagenta ? "glow-magenta" : "glow-green"} style={{ fontSize: 24, fontWeight: 600, color: flow.color }}>{currentStep.title}</div>
          <div style={{ width: "100%", maxWidth: 180, height: 1.5, background: flow.accent, opacity: 0.3, margin: "8px auto 4px", borderRadius: 1 }} />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Step {step + 1} Of {flow.steps.length}</div>
        </div>

        {/* Animated progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {flow.steps.map((_, i) => (
            <div
              key={i}
              className={`progress-bar ${i < step ? "progress-bar-done" : i === step ? "progress-bar-active" : "progress-bar-pending"}`}
            />
          ))}
        </div>

        {/* Fields */}
        {currentStep.fields.map((f) => (
          <div key={f.id} style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: isMagenta ? "#FF00FF" : "#00FF00", marginBottom: 8, display: "block", letterSpacing: 0.3 }}>{f.label}</label>

            {(f.type === "text" || f.type === "url" || f.type === "number") && (
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(formData[f.id] as string) || ""}
                onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                className={focusClass}
              />
            )}

            {f.type === "textarea" && (
              <textarea
                placeholder={f.placeholder}
                value={(formData[f.id] as string) || ""}
                onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                className={focusClass}
                style={{ resize: "vertical", minHeight: 90 }}
              />
            )}

            {f.type === "select" && (
              <select
                value={(formData[f.id] as string) || ""}
                onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                className={focusClass}
                style={{ cursor: "pointer", color: formData[f.id] ? "#fff" : "rgba(255,255,255,0.25)" }}
              >
                <option value="">Select...</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            {f.type === "multiselect" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {f.options?.map((o) => {
                  const active = ((formData[f.id] as string[]) || []).includes(o);
                  return (
                    <button
                      key={o}
                      onClick={() => toggleMulti(f.id, o)}
                      className={active ? multiActiveClass : "multi-btn"}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 24, marginBottom: 40 }}>
          {isLast ? (
            <button className="btn-primary" onClick={handleGenerate}>Generate</button>
          ) : (
            <button className="btn-primary" onClick={() => setStep(step + 1)}>Next Step &rarr;</button>
          )}
        </div>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
