"use client";

export default function ShortcutPage() {
  const PIPELINE_URL = "https://cash-production-680c.up.railway.app/quick-upload";

  // shortcuts://import-shortcut URL scheme with our hosted shortcut
  const importUrl = `shortcuts://import-shortcut?url=${encodeURIComponent("https://flowarts.pro/api/shortcut")}&name=FlowArtsPro`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      fontFamily: "Inter, -apple-system, sans-serif",
      padding: "40px 20px 60px",
    }}>
      <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          color: "#FF00FF", fontSize: 11, letterSpacing: 4, textTransform: "uppercase",
          textShadow: "0 0 10px #FF00FF", marginBottom: 24,
        }}>
          Glow Wit Da Flow
        </div>

        <h1 style={{
          color: "#00FF00", fontSize: 28, fontWeight: 900, letterSpacing: 3,
          textTransform: "uppercase", marginBottom: 8,
          textShadow: "0 0 10px #00FF00, 0 0 40px rgba(0,255,0,0.4)",
        }}>
          FlowArtsPro
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7,
          marginBottom: 32,
        }}>
          Share flow arts videos <strong style={{ color: "#00FF00" }}>directly from your iPhone</strong> camera roll to our YouTube Shorts channel. One tap. No browser needed.
        </p>

        {/* Install Button - uses shortcuts:// URL scheme */}
        <a
          href={importUrl}
          style={{
            display: "inline-block",
            width: "100%",
            maxWidth: 340,
            padding: "18px 32px",
            background: "linear-gradient(135deg, #00FF00 0%, #00DD00 30%, #FF00FF 70%, #00FF00 100%)",
            backgroundSize: "300% 300%",
            animation: "gradientShift 3s ease infinite",
            color: "#000",
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            textDecoration: "none",
            borderRadius: 16,
            boxShadow: "0 0 30px rgba(0,255,0,0.5), 0 0 80px rgba(0,255,0,0.2)",
            marginBottom: 12,
          }}
        >
          Add Shortcut
        </a>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 8 }}>
          Opens Shortcuts app automatically. Tap &quot;Add Shortcut&quot; to install.
        </p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginBottom: 28 }}>
          If the button above doesn&apos;t work, follow the manual setup below.
        </p>

        <style>{`@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>

        {/* Manual Setup Instructions */}
        <div style={{
          background: "rgba(0,255,0,0.04)", border: "1px solid rgba(0,255,0,0.3)",
          borderRadius: 20, padding: "28px 20px", marginBottom: 20, textAlign: "left",
        }}>
          <h2 style={{
            color: "#00FF00", fontSize: 16, fontWeight: 700, marginBottom: 16,
            textShadow: "0 0 8px rgba(0,255,0,0.4)",
          }}>
            Manual Setup (2 min)
          </h2>

          {[
            { text: 'Open Shortcuts app → tap + → name it "FlowArtsPro"' },
            { text: 'Tap (i) → enable "Show in Share Sheet" → select Videos only' },
            { text: 'Add: Ask for Input → Text → "@instagram handle"' },
            {
              text: "Add: URL →",
              code: `${PIPELINE_URL}?handle=`,
              extra: 'Tap URL, add "Provided Input" variable at the end',
            },
            { text: 'Add: Get Contents of URL → Method: POST → Body: File → Shortcut Input' },
            { text: 'Add: Show Notification → "Reel Submitted!"' },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
              <div style={{
                background: "#00FF00", color: "#000", width: 24, height: 24,
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.6 }}
                   dangerouslySetInnerHTML={{ __html: step.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
                {step.code && (
                  <code style={{
                    display: "block", marginTop: 6, padding: "8px 12px",
                    background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,255,0,0.2)",
                    borderRadius: 8, fontSize: 11, color: "#00FF00",
                    wordBreak: "break-all", fontFamily: "monospace",
                  }}>
                    {step.code}
                  </code>
                )}
                {step.extra && (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 }}>{step.extra}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* How to Use */}
        <div style={{
          background: "rgba(255,0,255,0.04)", border: "1px solid rgba(255,0,255,0.3)",
          borderRadius: 20, padding: "28px 20px", textAlign: "left",
        }}>
          <h2 style={{
            color: "#FF00FF", fontSize: 16, fontWeight: 700, marginBottom: 16,
            textShadow: "0 0 8px rgba(255,0,255,0.4)",
          }}>
            How to Use
          </h2>

          {[
            "Open Photos, select your flow video",
            'Tap Share → "FlowArtsPro"',
            "Type your @instagram handle",
            "Video uploads → gets EDM music → posts to YouTube Shorts",
          ].map((text, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
              <div style={{
                background: "#FF00FF", color: "#000", width: 24, height: 24,
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>

        <div style={{
          height: 1, background: "linear-gradient(90deg, transparent, #FF00FF, transparent)",
          margin: "32px 0", boxShadow: "0 0 8px rgba(255,0,255,0.3)",
        }} />

        <a href="/" style={{
          display: "inline-block", padding: "14px 32px",
          background: "rgba(255,0,255,0.15)", border: "1px solid #FF00FF",
          borderRadius: 12, color: "#FF00FF", fontSize: 12, fontWeight: 700,
          letterSpacing: 2, textTransform: "uppercase", textDecoration: "none",
          textShadow: "0 0 10px rgba(255,0,255,0.4)",
        }}>
          Back to FlowArts.Pro
        </a>

        <div style={{
          marginTop: 32, fontSize: 10, color: "#FF00FF", letterSpacing: 3,
          textTransform: "uppercase", textShadow: "0 0 8px rgba(255,0,255,0.4)",
        }}>
          flowarts.pro
        </div>
      </div>
    </div>
  );
}
