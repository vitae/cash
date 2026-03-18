"use client";

import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "none", border: "none", color: copied ? "#00FF00" : "rgba(255,255,255,0.5)",
        fontSize: 11, fontWeight: 600, cursor: "pointer", padding: "2px 6px",
        letterSpacing: 1, textTransform: "uppercase", flexShrink: 0,
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function ShortcutPage() {
  const PIPELINE_URL = "https://cash-production-680c.up.railway.app/quick-upload";

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
          iPhone Shortcut
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
          Share flow videos <strong style={{ color: "#00FF00" }}>from your camera roll</strong> straight to our YouTube Shorts. No browser needed.
        </p>

        {/* Setup */}
        <div style={{
          background: "rgba(0,255,0,0.04)", border: "1px solid rgba(0,255,0,0.3)",
          borderRadius: 20, padding: "28px 20px", marginBottom: 20, textAlign: "left",
        }}>
          <h2 style={{
            color: "#00FF00", fontSize: 16, fontWeight: 700, marginBottom: 16,
            textShadow: "0 0 8px rgba(0,255,0,0.4)",
          }}>
            Setup (1 min)
          </h2>

          {[
            { text: 'Open <strong>Shortcuts</strong> app → tap <strong>+</strong> → name it <strong>"FlowArtsPro"</strong>' },
            { text: 'Tap <strong>(i)</strong> at the bottom → enable <strong>Show in Share Sheet</strong> → select <strong>Videos</strong> only' },
            { text: 'Add these 4 actions in order:', actions: [
              { label: 'Ask for Input', detail: 'Type: Text, Prompt: "@instagram handle"' },
              { label: 'URL', detail: 'Paste the URL below, then tap it and add the "Provided Input" variable at the end' },
              { label: 'Get Contents of URL', detail: 'Method: POST, Body: File, File: Shortcut Input' },
              { label: 'Show Notification', detail: 'Title: "Reel Submitted!"' },
            ], code: `${PIPELINE_URL}?handle=` },
            { text: 'Tap <strong>Done</strong> — you\'re all set!' },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "flex-start" }}>
              <div style={{
                background: "#00FF00", color: "#000", width: 24, height: 24,
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.6 }}
                   dangerouslySetInnerHTML={{ __html: step.text }}
                />
                {step.actions && (
                  <div style={{ marginTop: 8 }}>
                    {step.actions.map((action, j) => (
                      <div key={j} style={{
                        padding: "6px 10px", marginBottom: 4,
                        background: "rgba(0,0,0,0.4)", borderRadius: 8,
                        borderLeft: "2px solid #00FF00",
                      }}>
                        <span style={{ color: "#FF00FF", fontWeight: 600, fontSize: 12 }}>{action.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}> — {action.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
                {step.code && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4, marginTop: 8,
                    background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,255,0,0.2)",
                    borderRadius: 8, padding: "8px 12px",
                  }}>
                    <code style={{
                      flex: 1, fontSize: 11, color: "#00FF00",
                      wordBreak: "break-all", fontFamily: "monospace",
                    }}>
                      {step.code}
                    </code>
                    <CopyButton text={step.code} />
                  </div>
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
            "Open Photos → select your flow video",
            'Tap Share → scroll down → tap "FlowArtsPro"',
            "Enter your @instagram handle when prompted",
            "Your video uploads, gets EDM music, and posts to YouTube Shorts",
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
