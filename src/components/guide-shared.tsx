"use client";

import { useState, useEffect, useRef, ReactNode } from "react";

// ─── Intersection Observer Hook ──────────────────────────────────────
export function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Reveal Animation Wrapper ────────────────────────────────────────
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
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

// ─── Glassmorphism Card ──────────────────────────────────────────────
export function Card({ children, accent = "green" }: { children: ReactNode; accent?: "green" | "magenta" }) {
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

// ─── Section Title ───────────────────────────────────────────────────
export function SectionTitle({ children, accent = "green" }: { children: ReactNode; accent?: "green" | "magenta" }) {
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

// ─── Pro Tip Block ───────────────────────────────────────────────────
export function Tip({ children }: { children: ReactNode }) {
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

// ─── Checklist Item ──────────────────────────────────────────────────
export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <div role="listitem" style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
      <div aria-hidden="true" style={{
        width: 20, height: 20, borderRadius: 6,
        background: "rgba(0,255,0,0.12)", border: "1px solid rgba(0,255,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <polyline points="2,5.5 4,7.5 8,3" stroke="#00FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Guide Page Layout ──────────────────────────────────────────────
export function GuideLayout({
  title,
  subtitle,
  description,
  children,
}: {
  title: string;
  subtitle?: string;
  description: string;
  children: ReactNode;
}) {
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
          {subtitle && (
            <p style={{
              color: "#FF00FF", fontSize: 10, letterSpacing: 4, textTransform: "uppercase",
              textShadow: "0 0 10px #FF00FF", marginBottom: 8,
            }}>
              {subtitle}
            </p>
          )}
          <h1 style={{
            fontSize: "clamp(26px, 6vw, 38px)",
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 12,
            background: "linear-gradient(135deg, #00FF00 0%, #FF00FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: "clamp(13px, 3vw, 15px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}>
            {description}
          </p>
          <div style={{
            width: "100%", maxWidth: 300, height: 2,
            background: "linear-gradient(90deg, transparent, #00FF00, #FF00FF, transparent)",
            margin: "0 auto 40px",
            boxShadow: "0 0 15px rgba(0,255,0,0.4)",
          }} />
        </Reveal>
        {children}
        <Reveal delay={0.05}>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: "100%", maxWidth: 300, height: 2,
              background: "linear-gradient(90deg, transparent, #FF00FF, #00FF00, transparent)",
              margin: "0 auto 24px",
              boxShadow: "0 0 15px rgba(255,0,255,0.4)",
            }} />
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

// ─── Gradient Divider ────────────────────────────────────────────────
export function GradientLine({ color = "green" }: { color?: "green" | "magenta" }) {
  const primary = color === "green" ? "#00FF00" : "#FF00FF";
  const secondary = color === "green" ? "#FF00FF" : "#00FF00";
  return (
    <div style={{
      width: "100%", maxWidth: 300, height: 2,
      background: `linear-gradient(90deg, transparent, ${primary}, ${secondary}, transparent)`,
      margin: "0 auto",
      boxShadow: `0 0 15px ${primary}66`,
    }} />
  );
}
