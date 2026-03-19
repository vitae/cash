"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type FlowType = "sponsor" | "booking" | "epk" | "festival";
type Step = { title: string; fields: Field[] };
type Field = { id: string; label: string; type: string; placeholder?: string; options?: string[] };

const flows: Record<FlowType, { title: string; color: string; accent: string; steps: Step[] }> = {
  sponsor: { title: "Custom Sponsor Pitch", color: "#00FF00", accent: "#FF00FF", steps: [
    { title: "About You", fields: [
      { id: "name", label: "Stage Name", type: "text", placeholder: "e.g. FlowMaster Kai" },
      { id: "ig_handle", label: "@Instagram", type: "text", placeholder: "@yourhandle" },
      { id: "location", label: "Location", type: "text", placeholder: "e.g. Oahu, Hawaii" },
      { id: "years", label: "Years Flowing", type: "number", placeholder: "e.g. 5" },
      { id: "props", label: "Props", type: "text", placeholder: "e.g. Poi, hoops, staff" },
      { id: "style", label: "Your Style", type: "text", placeholder: "e.g. Liquid poi + LED visuals" },
      { id: "ig_followers", label: "Followers", type: "number", placeholder: "e.g. 2500" },
      { id: "events", label: "Events / Festivals", type: "text", placeholder: "e.g. Electric Forest, Burning Man" },
    ]},
    { title: "Your Pitch", fields: [
      { id: "brands", label: "Brands To Pitch", type: "multiselect", options: ["Flowtoys","UltraPoi","Moodhoops","SpinFX","Pyroterra","Flow DNA","Dark Monk","Emazing Lights","GloFX","Futuristic Lights","Other"] },
      { id: "ask", label: "What You Want", type: "multiselect", options: ["Free Product","Ambassador Program","Paid Sponsorship","Content Collab","Discount Code","Event Sponsorship"] },
      { id: "unique", label: "Why You? (Optional)", type: "textarea", placeholder: "e.g. I teach workshops, 50k video views" },
    ]},
  ]},
  booking: { title: "Event Booking Sheet", color: "#FF00FF", accent: "#00FF00", steps: [
    { title: "Artist Info", fields: [
      { id: "name", label: "Stage Name", type: "text", placeholder: "e.g. FlowMaster Kai" },
      { id: "location", label: "Based In", type: "text", placeholder: "e.g. Oahu, Hawaii" },
      { id: "props", label: "Performance Props", type: "text", placeholder: "e.g. LED poi, fire staff" },
      { id: "act_types", label: "Performance Types", type: "multiselect", options: ["LED / Glow","Fire","UV / Blacklight","Stage Show","Ambient Roaming","Interactive","Workshop"] },
    ]},
    { title: "Rates & Details", fields: [
      { id: "rate_solo", label: "Your Rate", type: "text", placeholder: "e.g. $150-$250/hr" },
      { id: "set_length", label: "Set Length (Minutes)", type: "number", placeholder: "e.g. 20" },
      { id: "travel", label: "Travel Range", type: "select", options: ["Local Only","Regional","National","International"] },
      { id: "availability", label: "Availability", type: "multiselect", options: ["Weekday Evenings","Weekend Nights","Festivals","Corporate","Private Parties","Weddings"] },
    ]},
  ]},
  epk: { title: "Artist Press Kit", color: "#00FF00", accent: "#FF00FF", steps: [
    { title: "Your Story", fields: [
      { id: "name", label: "Stage Name", type: "text", placeholder: "e.g. FlowMaster Kai" },
      { id: "ig", label: "@Instagram", type: "text", placeholder: "@yourhandle" },
      { id: "props", label: "Flow Props", type: "text", placeholder: "e.g. Poi, hoops, fire staff" },
      { id: "origin", label: "Your Flow Story", type: "textarea", placeholder: "How did you get into flow arts?" },
    ]},
    { title: "Proof & Contact", fields: [
      { id: "notable", label: "Achievements / Events", type: "textarea", placeholder: "e.g. Electric Forest, 100k views" },
      { id: "email", label: "Booking Email", type: "text", placeholder: "bookings@yoursite.com" },
      { id: "website", label: "Website (Optional)", type: "text", placeholder: "https://yoursite.com" },
    ]},
  ]},
  festival: { title: "Festival Application", color: "#00FF00", accent: "#FF00FF", steps: [
    { title: "About You", fields: [
      { id: "name", label: "Stage Name", type: "text", placeholder: "e.g. FlowMaster Kai" },
      { id: "ig_handle", label: "@Instagram", type: "text", placeholder: "@yourhandle" },
      { id: "location", label: "Based In", type: "text", placeholder: "e.g. Austin, Texas" },
      { id: "props", label: "Performance Props", type: "text", placeholder: "e.g. LED poi, fire hoop, staff" },
      { id: "experience", label: "Years Performing", type: "number", placeholder: "e.g. 4" },
      { id: "past_festivals", label: "Past Festivals", type: "textarea", placeholder: "e.g. Burning Man, Lightning in a Bottle, Envision" },
    ]},
    { title: "Your Application", fields: [
      { id: "festival_name", label: "Festival Applying To", type: "text", placeholder: "e.g. Electric Forest 2026" },
      { id: "act_style", label: "Performance Style", type: "multiselect", options: ["LED / Glow Show", "Fire Performance", "Ambient Roaming", "Stage Show", "Workshop / Playshop", "Interactive Installation"] },
      { id: "what_you_bring", label: "What Makes You Unique", type: "textarea", placeholder: "e.g. Custom LED choreography synced to music, 10-person fire circle" },
    ]},
  ]},
};

const VALID_FLOWS: FlowType[] = ["sponsor", "booking", "epk", "festival"];

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

  // Auto-select generator from URL param
  useEffect(() => {
    const gen = searchParams.get("gen");
    if (gen && VALID_FLOWS.includes(gen as FlowType)) {
      setCurrentFlow(gen as FlowType);
    }
  }, [searchParams]);

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

      // Handle SSE streaming response
      if (res.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const payload = line.slice(6);
                if (payload === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(payload);
                  if (parsed.text) {
                    fullText += parsed.text;
                    setResult(fullText);
                  }
                  if (parsed.error) {
                    fullText += `\n\n[Error: ${parsed.error}]`;
                  }
                } catch { /* skip malformed chunks */ }
              }
            }
          }
        }
        if (!fullText) setResult("Generation complete but no content was returned.");
      } else {
        // Fallback for JSON response
        const data = await res.json();
        if (data.error) {
          setResult(`Error: ${data.error}`);
        } else {
          setResult(data.content || "Generation complete.");
        }
      }
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
    * { box-sizing: border-box; }

    body {
      background: #000;
      font-family: 'Inter', sans-serif;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Noise texture overlay ── */
    .page-wrap::before {
      content: '';
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 180px 180px;
    }

    @keyframes pulse { 0%,100%{width:20%} 50%{width:90%} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes dotPulse { 0%,80%,100%{opacity:.15;transform:scale(0.7)} 40%{opacity:1;transform:scale(1.3)} }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes glowPulse { 0%,100%{text-shadow:0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5)} 50%{text-shadow:0 0 20px #00FF00, 0 0 60px #00FF00, 0 0 120px rgba(0,255,0,0.6)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes toastIn { from{opacity:0;transform:translate(-50%,12px)} to{opacity:1;transform:translate(-50%,0)} }
    @keyframes toastOut { from{opacity:1;transform:translate(-50%,0)} to{opacity:0;transform:translate(-50%,12px)} }
    @keyframes borderGlow {
      0%,100% { box-shadow: 0 0 8px rgba(0,255,0,0.3), 0 0 24px rgba(0,255,0,0.15), inset 0 0 8px rgba(0,255,0,0.05); }
      50% { box-shadow: 0 0 16px rgba(0,255,0,0.5), 0 0 48px rgba(0,255,0,0.25), inset 0 0 16px rgba(0,255,0,0.08); }
    }
    @keyframes borderGlowM {
      0%,100% { box-shadow: 0 0 8px rgba(255,0,255,0.3), 0 0 24px rgba(255,0,255,0.15), inset 0 0 8px rgba(255,0,255,0.05); }
      50% { box-shadow: 0 0 16px rgba(255,0,255,0.5), 0 0 48px rgba(255,0,255,0.25), inset 0 0 16px rgba(255,0,255,0.08); }
    }
    @keyframes neonSpinner {
      0% { border-top-color: #00FF00; filter: drop-shadow(0 0 6px #00FF00); }
      50% { border-top-color: #FF00FF; filter: drop-shadow(0 0 6px #FF00FF); }
      100% { border-top-color: #00FF00; filter: drop-shadow(0 0 6px #00FF00); }
    }
    @keyframes progressGlow {
      0%,100% { box-shadow: 0 0 8px #00FF00, 0 0 20px rgba(0,255,0,0.4); }
      50% { box-shadow: 0 0 14px #00FF00, 0 0 36px rgba(0,255,0,0.6); }
    }

    .fi { animation: fadeInUp 0.45s ease-out both; }

    .glow-green { color: #00FF00; text-shadow: 0 0 10px #00FF00, 0 0 40px #00FF00, 0 0 80px rgba(0,255,0,0.5); }
    .glow-magenta { color: #FF00FF; text-shadow: 0 0 10px #FF00FF, 0 0 40px #FF00FF, 0 0 80px rgba(255,0,255,0.5); }
    .glow-green-anim { animation: glowPulse 3s ease-in-out infinite; }

    .gen-card {
      background: rgba(0,255,0,0.04);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid rgba(0,255,0,0.3);
      border-radius: 20px;
      padding: 28px 22px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: borderGlow 3s ease-in-out infinite;
    }
    .gen-card:hover {
      border-color: #00FF00;
      background: rgba(0,255,0,0.1);
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 0 20px rgba(0,255,0,0.4), 0 0 60px rgba(0,255,0,0.2), 0 8px 32px rgba(0,255,0,0.15);
    }
    .gen-card-m {
      background: rgba(255,0,255,0.04);
      border: 1px solid rgba(255,0,255,0.3);
      animation: borderGlowM 3s ease-in-out infinite;
    }
    .gen-card-m:hover {
      border-color: #FF00FF;
      background: rgba(255,0,255,0.1);
      box-shadow: 0 0 20px rgba(255,0,255,0.4), 0 0 60px rgba(255,0,255,0.2), 0 8px 32px rgba(255,0,255,0.15);
    }

    .field-input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(0,255,0,0.25);
      border-radius: 14px;
      color: #fff;
      padding: 15px 18px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 300;
      outline: none;
      -webkit-appearance: none;
      transition: border-color 0.25s, box-shadow 0.25s;
    }
    .field-input:focus {
      border-color: #00FF00;
      box-shadow: 0 0 8px rgba(0,255,0,0.4), 0 0 24px rgba(0,255,0,0.2), 0 0 0 3px rgba(0,255,0,0.1);
    }
    .field-input::placeholder { color: rgba(255,255,255,0.3); }
    select.field-input {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300FF00' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
      padding-right: 40px;
    }
    select.field-input option {
      background: #0a0a0a;
      color: #fff;
      font-family: 'Inter', sans-serif;
      padding: 12px;
    }
    select.field-input option:checked {
      background: rgba(0,255,0,0.2);
      color: #00FF00;
    }
    select.field-input-m {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23FF00FF' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    }
    .field-input-m { border-color: rgba(255,0,255,0.25); }
    .field-input-m:focus {
      border-color: #FF00FF;
      box-shadow: 0 0 8px rgba(255,0,255,0.4), 0 0 24px rgba(255,0,255,0.2), 0 0 0 3px rgba(255,0,255,0.1);
    }

    .multi-btn {
      padding: 9px 16px;
      font-size: 12px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.5);
      transition: all 0.2s ease;
      -webkit-appearance: none;
    }
    .multi-btn:hover {
      border-color: rgba(0,255,0,0.5);
      color: #00FF00;
      box-shadow: 0 0 12px rgba(0,255,0,0.15);
    }
    .multi-btn-active {
      border-color: #00FF00 !important;
      background: rgba(0,255,0,0.15) !important;
      color: #00FF00 !important;
      box-shadow: 0 0 12px rgba(0,255,0,0.3), 0 0 24px rgba(0,255,0,0.15);
      text-shadow: 0 0 8px rgba(0,255,0,0.5);
    }
    .multi-btn-active-m {
      border-color: #FF00FF !important;
      background: rgba(255,0,255,0.15) !important;
      color: #FF00FF !important;
      box-shadow: 0 0 12px rgba(255,0,255,0.3), 0 0 24px rgba(255,0,255,0.15);
      text-shadow: 0 0 8px rgba(255,0,255,0.5);
    }

    .btn-primary {
      padding: 16px 40px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      width: 100%;
      background: rgba(0,255,0,0.12);
      border: 1px solid #00FF00;
      border-radius: 16px;
      color: #00FF00;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      -webkit-appearance: none;
      transition: all 0.25s ease;
      text-shadow: 0 0 10px #00FF00, 0 0 30px rgba(0,255,0,0.4);
      box-shadow: 0 0 12px rgba(0,255,0,0.2), 0 0 30px rgba(0,255,0,0.1);
    }
    .btn-primary:hover {
      background: rgba(0,255,0,0.22);
      box-shadow: 0 0 20px rgba(0,255,0,0.4), 0 0 50px rgba(0,255,0,0.2);
      transform: translateY(-2px);
    }

    .btn-secondary {
      padding: 14px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      background: rgba(255,0,255,0.1);
      border: 1px solid #FF00FF;
      border-radius: 14px;
      color: #FF00FF;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      -webkit-appearance: none;
      transition: all 0.25s ease;
      text-shadow: 0 0 10px #FF00FF, 0 0 30px rgba(255,0,255,0.4);
      box-shadow: 0 0 10px rgba(255,0,255,0.15);
    }
    .btn-secondary:hover {
      background: rgba(255,0,255,0.18);
      box-shadow: 0 0 18px rgba(255,0,255,0.35), 0 0 40px rgba(255,0,255,0.15);
      transform: translateY(-1px);
    }

    .btn-back {
      font-size: 12px;
      color: #FF00FF;
      cursor: pointer;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 500;
      border: none;
      background: none;
      font-family: 'Inter', sans-serif;
      padding: 8px 0;
      transition: all 0.2s;
      text-shadow: 0 0 8px rgba(255,0,255,0.4);
    }
    .btn-back:hover { color: #FF00FF; text-shadow: 0 0 12px #FF00FF, 0 0 30px rgba(255,0,255,0.5); }

    .progress-bar { width: 100%; height: 5px; border-radius: 3px; transition: all 0.5s ease; }
    .progress-bar-done {
      background: linear-gradient(90deg, #FF00FF, rgba(255,0,255,0.7));
      box-shadow: 0 0 8px rgba(255,0,255,0.5);
    }
    .progress-bar-active {
      background: linear-gradient(90deg, #00FF00, rgba(0,255,0,0.7));
      box-shadow: 0 0 10px rgba(0,255,0,0.5), 0 0 20px rgba(0,255,0,0.25);
      animation: progressGlow 2s ease-in-out infinite;
    }
    .progress-bar-pending { background: rgba(255,255,255,0.08); }

    .result-block {
      border-radius: 20px;
      padding: 24px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid rgba(0,255,0,0.35);
      white-space: pre-wrap;
      font-size: 13px;
      color: rgba(255,255,255,0.9);
      line-height: 1.9;
      font-weight: 300;
      box-shadow: 0 0 16px rgba(0,255,0,0.15), 0 0 40px rgba(0,255,0,0.08), inset 0 0 20px rgba(0,255,0,0.03);
    }
    .result-block strong, .result-block b { color: #00FF00; font-weight: 600; text-shadow: 0 0 8px rgba(0,255,0,0.4); }

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
      background: rgba(0,0,0,0.8);
      border: 1px solid #00FF00;
      border-radius: 100px;
      color: #00FF00;
      font-family: 'Inter', sans-serif;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 1000;
      pointer-events: none;
      animation: toastIn 0.3s ease-out;
      text-shadow: 0 0 10px #00FF00;
      box-shadow: 0 0 16px rgba(0,255,0,0.3), 0 0 40px rgba(0,255,0,0.15);
    }
    .toast-exit { animation: toastOut 0.3s ease-in forwards; }

    .dots span {
      display: inline-block;
      width: 10px; height: 10px;
      margin: 0 5px;
      border-radius: 50%;
      background: #00FF00;
      box-shadow: 0 0 10px #00FF00, 0 0 24px rgba(0,255,0,0.5);
      animation: dotPulse 1.4s infinite ease-in-out both;
    }
    .dots span:nth-child(1) { animation-delay: -0.32s; }
    .dots span:nth-child(2) { animation-delay: -0.16s; background: #FF00FF; box-shadow: 0 0 10px #FF00FF, 0 0 24px rgba(255,0,255,0.5); }
    .dots span:nth-child(3) { animation-delay: 0s; }

    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(0,255,0,0.2);
      border-top-color: #00FF00;
      border-radius: 50%;
      animation: spin 0.8s linear infinite, neonSpinner 2s ease-in-out infinite;
      margin: 0 auto 20px;
      filter: drop-shadow(0 0 8px #00FF00);
    }

    @media (min-width: 640px) {
      .page-wrap { max-width: 800px !important; padding: 48px 40px !important; }
      .gen-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 12px !important; justify-items: center; }
      .gen-grid-label { grid-column: 1 / -1; }
      .gen-grid .gen-card, .gen-grid .gen-card-m { width: 100%; }
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
            <div className="spinner" role="status" aria-label="Loading" />
            <div className="glow-magenta" style={{ fontSize: 13, color: "#FF00FF", fontWeight: 500, letterSpacing: 1 }}>
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
            <div className="glow-magenta" style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#FF00FF", marginBottom: 16 }}>Glow Wit Da Flow</div>
            <h1 className="glow-green glow-green-anim" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, textTransform: "uppercase", color: "#00FF00", margin: 0, lineHeight: 1.1 }}>Flow Arts</h1>
            <h2 className="glow-magenta" style={{ fontSize: 16, fontWeight: 400, letterSpacing: 8, textTransform: "uppercase", color: "#FF00FF", margin: "4px 0 0" }}>Professional</h2>
            <div style={{ width: "100%", maxWidth: 200, height: 1.5, background: "#00FF00", boxShadow: "0 0 8px #00FF00, 0 0 20px rgba(0,255,0,0.4)", margin: "14px auto", borderRadius: 1 }} />
            <div style={{ display: "inline-block", padding: "6px 18px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(0,255,0,0.12)", border: "1px solid #00FF00", borderRadius: 10, color: "#00FF00", textShadow: "0 0 10px #00FF00", boxShadow: "0 0 12px rgba(0,255,0,0.25)" }}>Unlocked</div>
            {userEmail && (
              <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 300 }}>
                Welcome, <span className="glow-green" style={{ color: "#00FF00", fontWeight: 500 }}>{userEmail}</span>
              </div>
            )}
          </div>
          <p className="glow-magenta" style={{ fontSize: 13, color: "#FF00FF", fontWeight: 500, textAlign: "center", marginBottom: 6 }}>The Thinking Has Already Been Done, So You Can Create!</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 300, textAlign: "center", marginBottom: 24 }}>Choose A Generator Below To Get Started.</p>

          <div className="gen-grid" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            <div className="gen-grid-label" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#00FF00", textShadow: "0 0 8px rgba(0,255,0,0.4)", marginBottom: -4, textAlign: "center" }}>AI Generators</div>
            <div className="gen-card" role="button" tabIndex={0} aria-label="Open Sponsor Pitch generator" onClick={() => setCurrentFlow("sponsor")} onKeyDown={e => e.key === "Enter" && setCurrentFlow("sponsor")}>
              <div className="glow-green" style={{ fontSize: 16, fontWeight: 600, color: "#00FF00", marginBottom: 4 }}>Sponsor Pitch</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>Personalized pitch for brand companies</p>
            </div>
            <div className="gen-card" role="button" tabIndex={0} aria-label="Open Booking Sheet generator" onClick={() => setCurrentFlow("booking")} onKeyDown={e => e.key === "Enter" && setCurrentFlow("booking")}>
              <div className="glow-green" style={{ fontSize: 16, fontWeight: 600, color: "#00FF00", marginBottom: 4 }}>Booking Sheet</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>Tech rider, rates & availability</p>
            </div>
            <div className="gen-card" role="button" tabIndex={0} aria-label="Open Artist Press Kit generator" onClick={() => setCurrentFlow("epk")} onKeyDown={e => e.key === "Enter" && setCurrentFlow("epk")}>
              <div className="glow-green" style={{ fontSize: 16, fontWeight: 600, color: "#00FF00", marginBottom: 4 }}>Artist Press Kit</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>Full EPK with bio, reels & socials</p>
            </div>
            <div className="gen-card" role="button" tabIndex={0} aria-label="Open Festival Application generator" onClick={() => setCurrentFlow("festival")} onKeyDown={e => e.key === "Enter" && setCurrentFlow("festival")}>
              <div className="glow-green" style={{ fontSize: 16, fontWeight: 600, color: "#00FF00", marginBottom: 4 }}>Festival Application</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>Stand-out performer applications</p>
            </div>

            <div className="gen-grid-label" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#FF00FF", textShadow: "0 0 8px rgba(255,0,255,0.4)", marginTop: 4, marginBottom: -4, textAlign: "center" }}>Guides</div>
            <a href="/guides/how-to-be-a-pro" className="gen-card gen-card-m" style={{ textDecoration: "none" }}>
              <div className="glow-magenta" style={{ fontSize: 16, fontWeight: 600, color: "#FF00FF", marginBottom: 4 }}>How To Go Pro</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>The complete playbook for your career</p>
            </a>
            <a href="/guides/traveling-for-gigs" className="gen-card gen-card-m" style={{ textDecoration: "none" }}>
              <div className="glow-magenta" style={{ fontSize: 16, fontWeight: 600, color: "#FF00FF", marginBottom: 4 }}>Traveling for Gigs</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>Build a touring circuit that pays</p>
            </a>
            <a href="/guides/contact-50-brands" className="gen-card gen-card-m" style={{ textDecoration: "none" }}>
              <div className="glow-magenta" style={{ fontSize: 16, fontWeight: 600, color: "#FF00FF", marginBottom: 4 }}>Contact 50 Brands</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>Top companies to pitch for sponsorship</p>
            </a>
            <a href="/guides/build-your-brand" className="gen-card gen-card-m" style={{ textDecoration: "none" }}>
              <div className="glow-magenta" style={{ fontSize: 16, fontWeight: 600, color: "#FF00FF", marginBottom: 4 }}>Build Your Brand</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>Grow your audience & go viral</p>
            </a>
            <a href="/guides/top-100-artists" className="gen-card gen-card-m" style={{ textDecoration: "none" }}>
              <div className="glow-magenta" style={{ fontSize: 16, fontWeight: 600, color: "#FF00FF", marginBottom: 4 }}>Top 100 Artists</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>Follow, study & collaborate</p>
            </a>
          </div>

          <div style={{ textAlign: "center", paddingTop: 16 }}>
            <p className="glow-magenta" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#FF00FF", margin: "0 0 4px" }}>Your Vibe Attracts Your Tribe</p>
            <div style={{ width: "100%", maxWidth: 220, height: 1, background: "#00FF00", boxShadow: "0 0 6px rgba(0,255,0,0.5)", margin: "0 auto 4px" }} />
            <p className="glow-green" style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#00FF00", margin: 0 }}>Glow Wit Da Flow</p>
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
            <div className="glow-magenta" style={{ display: "inline-block", padding: "5px 14px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(255,0,255,0.15)", border: "1px solid #FF00FF", borderRadius: 10, color: "#FF00FF", marginBottom: 14, boxShadow: "0 0 12px rgba(255,0,255,0.25)", textShadow: "0 0 10px #FF00FF" }}>Generated</div>
            <div className={isMagenta ? "glow-magenta" : "glow-green"} style={{ fontSize: 22, fontWeight: 600, color: flow.color }}>{flow.title}</div>
            <div style={{ width: "100%", maxWidth: 240, height: 1.5, background: flow.accent, boxShadow: `0 0 8px ${flow.accent}`, margin: "8px auto", borderRadius: 1 }} />
            <p className="glow-magenta" style={{ fontSize: 12, color: "#FF00FF", fontWeight: 500, margin: "0 0 6px" }}>The Thinking Has Already Been Done, So You Can Create!</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 300 }}>Personalized For {(formData.name as string) || "You"}. Edit, Copy, And Send.</p>
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
            <div className="glow-magenta" style={{ display: "inline-block", padding: "5px 14px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(255,0,255,0.15)", border: "1px solid #FF00FF", borderRadius: 10, color: "#FF00FF", marginBottom: 14, boxShadow: "0 0 12px rgba(255,0,255,0.25)", textShadow: "0 0 10px #FF00FF" }}>Generating</div>
            <div className={isMagenta ? "glow-magenta" : "glow-green"} style={{ fontSize: 22, fontWeight: 600, color: flow.color, marginBottom: 6 }}>{flow.title}</div>
            <div className="dots" style={{ margin: "20px 0" }}>
              <span /><span /><span />
            </div>
            <p className="glow-green" style={{ fontSize: 13, color: "#00FF00", fontWeight: 400, margin: "0 0 24px", minHeight: 20, transition: "opacity 0.3s" }}>
              {PROGRESS_MESSAGES[progressIdx]}
            </p>
            <div style={{ width: 240, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, margin: "0 auto", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #00FF00, #FF00FF, #00FF00)", backgroundSize: "200% 100%", borderRadius: 3, animation: "pulse 2s ease-in-out infinite, shimmer 2s linear infinite", boxShadow: "0 0 12px #00FF00, 0 0 24px rgba(0,255,0,0.4)" }} />
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
          <div className={isMagenta ? "glow-magenta" : "glow-green"} style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: flow.accent, marginBottom: 6 }}>{flow.title}</div>
          <div className={isMagenta ? "glow-magenta" : "glow-green"} style={{ fontSize: 24, fontWeight: 600, color: flow.color }}>{currentStep.title}</div>
          <div style={{ width: "100%", maxWidth: 180, height: 1.5, background: flow.accent, boxShadow: `0 0 8px ${flow.accent}`, margin: "8px auto 4px", borderRadius: 1 }} />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 300 }}>Step {step + 1} Of {flow.steps.length}</div>
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
            <label className={isMagenta ? "glow-magenta" : "glow-green"} style={{ fontSize: 13, fontWeight: 600, color: isMagenta ? "#FF00FF" : "#00FF00", marginBottom: 8, display: "block", letterSpacing: 0.3 }}>{f.label}</label>

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
                style={{ cursor: "pointer", color: formData[f.id] ? "#fff" : "rgba(255,255,255,0.3)" }}
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
