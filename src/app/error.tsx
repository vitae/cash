"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      fontFamily: "Inter, -apple-system, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: "#FF00FF",
          textShadow: "0 0 20px rgba(255,0,255,0.5)",
          marginBottom: 16,
        }}>
          Oops
        </div>
        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 32,
        }}>
          Something went wrong. The flow was interrupted.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #00FF00, #00DD00)",
            color: "#000",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0,255,0,0.4)",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
