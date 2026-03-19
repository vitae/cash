export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "3px solid rgba(0,255,0,0.15)",
        borderTopColor: "#00FF00",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
