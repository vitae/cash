import Link from "next/link";

export default function NotFound() {
  return (
    <div style={container}>
      <div style={glitchWrapper}>
        <h1 style={code}>404</h1>
        <div style={scanline} />
      </div>
      <p style={message}>Signal lost in the void.</p>
      <p style={sub}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" style={button}>
        Return Home
      </Link>
    </div>
  );
}

const container: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: "2rem",
  textAlign: "center",
  background: "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 70%)",
};

const glitchWrapper: React.CSSProperties = {
  position: "relative",
  marginBottom: "1.5rem",
};

const code: React.CSSProperties = {
  fontSize: "clamp(6rem, 20vw, 12rem)",
  fontWeight: 900,
  letterSpacing: "0.05em",
  background: "linear-gradient(180deg, #00FF00 0%, #00cc00 50%, #009900 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
  filter: "drop-shadow(0 0 30px rgba(0,255,0,0.4))",
  lineHeight: 1,
};

const scanline: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
  pointerEvents: "none",
};

const message: React.CSSProperties = {
  fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
  fontWeight: 600,
  color: "#FF00FF",
  marginBottom: "0.5rem",
  textShadow: "0 0 20px rgba(255,0,255,0.4)",
};

const sub: React.CSSProperties = {
  fontSize: "1rem",
  color: "rgba(255,255,255,0.5)",
  maxWidth: "28rem",
  marginBottom: "2.5rem",
  lineHeight: 1.6,
};

const button: React.CSSProperties = {
  display: "inline-block",
  padding: "0.85rem 2.5rem",
  border: "1px solid #00FF00",
  borderRadius: "4px",
  color: "#00FF00",
  fontSize: "0.95rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  transition: "all 0.3s ease",
  background: "rgba(0,255,0,0.05)",
  boxShadow: "0 0 20px rgba(0,255,0,0.15)",
};
