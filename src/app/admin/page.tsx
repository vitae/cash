"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Types ─── */
interface PublishDetails {
  youtube?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  threads?: string;
  processed_url?: string;
  artist_handle?: string;
  music_track?: string;
  youtube_error?: string;
  instagram_error?: string;
  facebook_error?: string;
  tiktok_error?: string;
  threads_error?: string;
}

interface Submission {
  id: string;
  artist_name: string;
  email: string | null;
  video_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  youtube_url: string | null;
  error_message: string | null;
  retry_count: number;
  publish_details: PublishDetails | null;
}

interface Counts {
  pending: number;
  processing: number;
  processed: number;
  posted: number;
  failed: number;
  partial: number;
  queued: number;
}

interface ApiResponse {
  submissions: Submission[];
  counts: Counts;
  total: number;
}

/* ─── Constants ─── */
const PLATFORMS = ["youtube", "instagram", "facebook", "threads", "tiktok"] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
  tiktok: "TikTok",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "#FF0000",
  instagram: "#E1306C",
  facebook: "#1877F2",
  threads: "#ffffff",
  tiktok: "#00F2EA",
};

const STATUS_CONFIG: Record<string, { color: string; label: string; symbol: string }> = {
  pending: { color: "#FFD700", label: "PENDING", symbol: "..." },
  processing: { color: "#00BFFF", label: "PROCESSING", symbol: ">>>" },
  processed: { color: "#FF00FF", label: "PROCESSED", symbol: "RDY" },
  posted: { color: "#00FF00", label: "POSTED", symbol: "OK" },
  failed: { color: "#FF4444", label: "FAILED", symbol: "ERR" },
  partial: { color: "#FFA500", label: "PARTIAL", symbol: "!!!" },
  queued: { color: "#9966FF", label: "QUEUED", symbol: "QUE" },
};

const ALL_STATUSES = ["pending", "processing", "processed", "posted", "failed", "partial", "queued"] as const;

const MONO = "'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace";

/* ─── Helpers ─── */
function getArtistHandle(s: Submission): string {
  return s.publish_details?.artist_handle || s.artist_name || "unknown";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getProcessingDuration(s: Submission): string | null {
  if (!s.updated_at || !s.created_at) return null;
  const diff = new Date(s.updated_at).getTime() - new Date(s.created_at).getTime();
  if (diff < 0) return null;
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getPlatformCount(s: Submission): { posted: number; failed: number; total: number } {
  const details = s.publish_details;
  if (!details) return { posted: 0, failed: 0, total: 0 };
  let posted = 0;
  let failed = 0;
  for (const p of PLATFORMS) {
    if (details[p]) posted++;
    else if (details[`${p}_error` as keyof PublishDetails]) failed++;
  }
  return { posted, failed, total: posted + failed };
}

/* ─── Styles ─── */
const term = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: MONO,
    fontSize: 13,
    color: "#b0b0b0",
    padding: "0 0 60px",
    position: "relative" as const,
    overflow: "hidden",
  },
  scanline: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: "rgba(0, 255, 0, 0.08)",
    zIndex: 100,
    pointerEvents: "none" as const,
    animation: "scanline 8s linear infinite",
  },
  header: {
    borderBottom: "1px solid #1a1a1a",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(12px)",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px 24px",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: "#444",
    marginBottom: 10,
  },
  green: { color: "#00FF00" },
  dim: { color: "#555" },
  cyan: { color: "#00BFFF" },
  magenta: { color: "#FF00FF" },
};

/* ─── Components ─── */

function TermClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const est = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      setTime(
        est.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ color: "#00FF00", fontWeight: 700 }}>
      {time} <span style={{ color: "#555", fontWeight: 400 }}>EST</span>
    </span>
  );
}

function StatusBar({ counts, total }: { counts: Counts; total: number }) {
  return (
    <div style={{ display: "flex", gap: 1, height: 4, borderRadius: 2, overflow: "hidden", background: "#111" }}>
      {ALL_STATUSES.map((s) => {
        const c = counts[s] ?? 0;
        if (c === 0) return null;
        return (
          <div
            key={s}
            style={{
              flex: c,
              background: STATUS_CONFIG[s]?.color ?? "#333",
              transition: "flex 0.6s ease",
            }}
            title={`${STATUS_CONFIG[s]?.label}: ${c}`}
          />
        );
      })}
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid #1a1a1a",
        borderRadius: 4,
        padding: "14px 16px",
        minWidth: 100,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, fontFamily: MONO }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function FilterTabs({
  counts,
  filter,
  onFilter,
}: {
  counts: Counts;
  filter: string;
  onFilter: (f: string) => void;
}) {
  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "ALL", count: Object.values(counts).reduce((a, b) => a + b, 0) },
    ...ALL_STATUSES.map((s) => ({ key: s, label: STATUS_CONFIG[s].label, count: counts[s] ?? 0 })),
  ];

  return (
    <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const active = filter === t.key;
        const cfg = STATUS_CONFIG[t.key];
        const color = cfg?.color ?? "#00FF00";
        return (
          <button
            key={t.key}
            onClick={() => onFilter(t.key)}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              padding: "6px 12px",
              border: `1px solid ${active ? color + "60" : "#1a1a1a"}`,
              borderRadius: 3,
              background: active ? color + "12" : "transparent",
              color: active ? color : "#555",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t.label}
            <span style={{ marginLeft: 6, opacity: 0.6 }}>{t.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function PlatformLink({ platform, url, error }: { platform: Platform; url?: string; error?: string }) {
  const hasUrl = !!url;
  const hasError = !!error;
  const color = PLATFORM_COLORS[platform];

  if (hasUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={url}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 3,
          fontSize: 11,
          fontFamily: MONO,
          fontWeight: 600,
          textDecoration: "none",
          background: color + "15",
          color,
          border: `1px solid ${color}30`,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = color + "25";
          e.currentTarget.style.boxShadow = `0 0 12px ${color}30`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = color + "15";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {PLATFORM_LABELS[platform]}
        <span style={{ opacity: 0.5 }}>↗</span>
      </a>
    );
  }

  if (hasError) {
    return (
      <span
        title={`Error: ${error}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 3,
          fontSize: 11,
          fontFamily: MONO,
          fontWeight: 500,
          background: "rgba(255,68,68,0.08)",
          color: "#FF4444",
          border: "1px solid rgba(255,68,68,0.2)",
          cursor: "help",
        }}
      >
        {PLATFORM_LABELS[platform]}
        <span>✗</span>
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 3,
        fontSize: 11,
        fontFamily: MONO,
        color: "#333",
        border: "1px solid #1a1a1a",
      }}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  );
}

function SubmissionRow({
  s,
  expanded,
  onToggle,
}: {
  s: Submission;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
  const handle = getArtistHandle(s);
  const details = s.publish_details ?? {};
  const thumb = details.processed_url || s.video_url || "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const platformStats = getPlatformCount(s);
  const duration = getProcessingDuration(s);

  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = 1;
  }, [thumb]);

  return (
    <div
      style={{
        background: expanded ? "#0f0f0f" : "#0a0a0a",
        border: `1px solid ${expanded ? cfg.color + "30" : "#151515"}`,
        borderRadius: 4,
        transition: "all 0.2s",
        overflow: "hidden",
      }}
    >
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "60px 1fr auto",
          gap: 14,
          padding: "12px 16px",
          cursor: "pointer",
          alignItems: "start",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#111";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 56,
            height: 80,
            borderRadius: 4,
            overflow: "hidden",
            background: "#111",
            border: `1px solid ${cfg.color}25`,
            flexShrink: 0,
            position: "relative",
          }}
        >
          {thumb ? (
            <video
              ref={videoRef}
              src={thumb}
              muted
              preload="metadata"
              onLoadedData={() => setLoaded(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: loaded ? 1 : 0,
                transition: "opacity 0.3s",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#222",
                fontSize: 20,
              }}
            >
              ▶
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ minWidth: 0 }}>
          {/* Line 1: handle + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>@{handle}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: MONO,
                padding: "2px 8px",
                borderRadius: 2,
                background: cfg.color + "15",
                color: cfg.color,
                border: `1px solid ${cfg.color}30`,
                letterSpacing: 1,
              }}
            >
              [{cfg.symbol}] {cfg.label}
            </span>
            {s.retry_count > 0 && (
              <span style={{ fontSize: 10, color: "#FFA500" }}>
                retry:{s.retry_count}
              </span>
            )}
          </div>

          {/* Line 2: description */}
          {s.description && (
            <div
              style={{
                fontSize: 12,
                color: "#666",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: expanded ? "normal" : "nowrap",
                maxWidth: expanded ? "none" : 500,
                marginBottom: 4,
              }}
            >
              {s.description}
            </div>
          )}

          {/* Line 3: music track */}
          {details.music_track && (
            <div style={{ fontSize: 11, color: "#444", marginBottom: 4 }}>
              <span style={{ color: "#FF00FF" }}>♫</span> {details.music_track}
            </div>
          )}

          {/* Line 4: platform links (always show for posted/partial) */}
          {(s.status === "posted" || s.status === "partial") && (
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}
              onClick={(e) => e.stopPropagation()}
            >
              {PLATFORMS.map((p) => (
                <PlatformLink
                  key={p}
                  platform={p}
                  url={details[p] as string | undefined}
                  error={details[`${p}_error` as keyof PublishDetails] as string | undefined}
                />
              ))}
            </div>
          )}

          {/* Error preview */}
          {s.error_message && !expanded && (
            <div
              style={{
                fontSize: 11,
                color: "#FF4444",
                marginTop: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 500,
              }}
            >
              ERR: {s.error_message}
            </div>
          )}
        </div>

        {/* Right side: meta */}
        <div style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 11 }}>
          <div style={{ color: "#555" }}>{timeAgo(s.created_at)}</div>
          {duration && <div style={{ color: "#333", marginTop: 2 }}>{duration}</div>}
          {platformStats.posted > 0 && (
            <div style={{ color: "#00FF00", marginTop: 4, fontSize: 10 }}>
              {platformStats.posted}/{PLATFORMS.length} live
            </div>
          )}
        </div>
      </div>

      {/* Expanded details panel */}
      {expanded && (
        <div
          style={{
            borderTop: `1px solid ${cfg.color}15`,
            padding: "14px 16px",
            background: "#080808",
          }}
        >
          {/* Terminal-style detail grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 24px",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            <TermField label="ID" value={s.id} />
            <TermField label="EMAIL" value={s.email || "—"} />
            <TermField label="CREATED" value={formatTimestamp(s.created_at)} />
            <TermField label="UPDATED" value={formatTimestamp(s.updated_at)} />
            <TermField label="RETRIES" value={String(s.retry_count ?? 0)} />
            <TermField label="DURATION" value={duration || "—"} />
          </div>

          {/* URLs section */}
          <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            <TermLink label="SOURCE" url={s.video_url} />
            {details.processed_url && <TermLink label="PROCESSED" url={details.processed_url} />}
            {s.youtube_url && <TermLink label="YOUTUBE" url={s.youtube_url} />}
          </div>

          {/* Platform breakdown */}
          {(s.status === "posted" || s.status === "partial" || s.status === "failed") && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 1.5, marginBottom: 6 }}>
                PLATFORM STATUS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {PLATFORMS.map((p) => {
                  const url = details[p] as string | undefined;
                  const err = details[`${p}_error` as keyof PublishDetails] as string | undefined;
                  return (
                    <div
                      key={p}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 2,
                        background: "#0d0d0d",
                      }}
                    >
                      <span style={{ width: 70, color: PLATFORM_COLORS[p], fontWeight: 600 }}>
                        {PLATFORM_LABELS[p]}
                      </span>
                      {url ? (
                        <>
                          <span style={{ color: "#00FF00", fontWeight: 700, width: 24 }}>OK</span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#00FF00",
                              textDecoration: "underline",
                              textDecorationColor: "#00FF0040",
                              textUnderlineOffset: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {url}
                          </a>
                        </>
                      ) : err ? (
                        <>
                          <span style={{ color: "#FF4444", fontWeight: 700, width: 24 }}>ERR</span>
                          <span style={{ color: "#FF4444", opacity: 0.7 }}>{err}</span>
                        </>
                      ) : (
                        <span style={{ color: "#333" }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error detail */}
          {s.error_message && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 3,
                background: "rgba(255,68,68,0.06)",
                border: "1px solid rgba(255,68,68,0.15)",
                fontSize: 11,
                color: "#FF4444",
                fontFamily: MONO,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              <span style={{ color: "#FF444480", marginRight: 6 }}>ERROR:</span>
              {s.error_message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TermField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
      <span style={{ color: "#444", fontSize: 10, letterSpacing: 1, minWidth: 70 }}>{label}</span>
      <span style={{ color: "#999", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function TermLink({ label, url }: { label: string; url: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
      <span style={{ color: "#444", fontSize: 10, letterSpacing: 1, minWidth: 70 }}>{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#00FF00",
          textDecoration: "underline",
          textDecorationColor: "#00FF0030",
          textUnderlineOffset: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          wordBreak: "break-all",
        }}
      >
        {url.length > 80 ? url.slice(0, 80) + "..." : url}
      </a>
    </div>
  );
}

function ActionButton({
  label,
  loadingLabel,
  isLoading,
  color,
  onClick,
}: {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: 700,
        padding: "8px 18px",
        borderRadius: 3,
        border: `1px solid ${color}40`,
        background: isLoading ? color + "08" : color + "10",
        color,
        cursor: isLoading ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        letterSpacing: 0.5,
      }}
    >
      {isLoading ? loadingLabel : label}
    </button>
  );
}

/* ─── Main Page ─── */

export default function AdminPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/submissions");
      if (!res.ok) throw new Error("Failed to fetch");
      const json: ApiResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const triggerSweep = async () => {
    setSweeping(true);
    setSweepResult(null);
    try {
      const res = await fetch("/api/admin/sweep", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSweepResult({ ok: false, message: body.error || "Publish failed" });
      } else {
        setSweepResult({ ok: true, message: body.message || "Publish triggered" });
        await fetchData();
      }
    } catch (err) {
      setSweepResult({ ok: false, message: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setSweeping(false);
      setTimeout(() => setSweepResult(null), 5000);
    }
  };

  const triggerPurgeMusic = async () => {
    if (!confirm("Purge all music tracks and repopulate with fresh dubstep/bass EDM?")) return;
    setPurging(true);
    setPurgeResult(null);
    try {
      const res = await fetch("/api/admin/purge-music", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPurgeResult({ ok: false, message: body.error || "Purge failed" });
      } else {
        setPurgeResult({ ok: true, message: body.message || "Music refreshed" });
      }
    } catch (err) {
      setPurgeResult({ ok: false, message: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setPurging(false);
      setTimeout(() => setPurgeResult(null), 8000);
    }
  };

  /* ─── Loading state ─── */
  if (loading && !data) {
    return (
      <div style={{ ...term.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: MONO }}>
          <div style={{ color: "#00FF00", fontSize: 14, animation: "pulse 1.5s ease-in-out infinite" }}>
            <span style={{ color: "#555" }}>[</span> LOADING PIPELINE DATA <span style={{ color: "#555" }}>]</span>
          </div>
          <div style={{ color: "#333", fontSize: 11, marginTop: 8 }}>Connecting to database...</div>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (error && !data) {
    return (
      <div style={{ ...term.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: MONO }}>
          <div style={{ color: "#FF4444", fontSize: 14, marginBottom: 12 }}>
            [ERR] {error}
          </div>
          <button
            onClick={() => { setError(null); fetchData(); }}
            style={{
              fontFamily: MONO,
              fontSize: 12,
              padding: "8px 20px",
              borderRadius: 3,
              border: "1px solid #FF444440",
              background: "#FF444410",
              color: "#FF4444",
              cursor: "pointer",
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  const counts = data?.counts ?? { pending: 0, processing: 0, processed: 0, posted: 0, failed: 0, partial: 0, queued: 0 };
  const total = data?.total ?? 0;
  const readyToPublish = counts.processed + counts.partial + counts.queued;

  const filtered =
    filter === "all"
      ? data?.submissions ?? []
      : (data?.submissions ?? []).filter((s) => s.status === filter);

  return (
    <div style={term.page}>
      {/* Scanline effect */}
      <div style={term.scanline} />

      {/* ─── Header bar ─── */}
      <div style={term.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              fontFamily: MONO,
              color: "#00FF00",
              textShadow: "0 0 10px #00FF0040",
              letterSpacing: -0.5,
            }}
          >
            REEL_PIPELINE
          </span>
          <span style={{ color: "#333", fontSize: 11 }}>v2.0</span>
          <span style={{ width: 1, height: 16, background: "#1a1a1a" }} />
          <TermClock />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {sweepResult && (
            <span style={{ fontSize: 11, color: sweepResult.ok ? "#00FF00" : "#FF4444" }}>
              {sweepResult.ok ? "[OK]" : "[ERR]"} {sweepResult.message}
            </span>
          )}
          {purgeResult && (
            <span style={{ fontSize: 11, color: purgeResult.ok ? "#FFA500" : "#FF4444" }}>
              {purgeResult.ok ? "[OK]" : "[ERR]"} {purgeResult.message}
            </span>
          )}
          <ActionButton
            label="$ publish-now"
            loadingLabel="publishing..."
            isLoading={sweeping}
            color="#00FF00"
            onClick={triggerSweep}
          />
          <ActionButton
            label="$ refresh-music"
            loadingLabel="refreshing..."
            isLoading={purging}
            color="#FFA500"
            onClick={triggerPurgeMusic}
          />
        </div>
      </div>

      <div style={term.content}>
        {/* ─── Stats row ─── */}
        <div style={{ ...term.sectionLabel }}>SYSTEM STATUS</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <StatBlock label="Total" value={total} color="#ffffff" />
          <StatBlock label="Posted" value={counts.posted} color="#00FF00" />
          <StatBlock label="Ready" value={readyToPublish} color="#FF00FF" />
          <StatBlock label="Processing" value={counts.processing} color="#00BFFF" />
          <StatBlock label="Pending" value={counts.pending} color="#FFD700" />
          <StatBlock label="Failed" value={counts.failed} color="#FF4444" />
        </div>

        {/* ─── Progress bar ─── */}
        <StatusBar counts={counts} total={total} />

        {/* ─── Filters ─── */}
        <div style={{ margin: "20px 0 16px" }}>
          <div style={{ ...term.sectionLabel }}>FILTER</div>
          <FilterTabs counts={counts} filter={filter} onFilter={(f) => setFilter(f === filter ? "all" : f)} />
        </div>

        {/* ─── Submissions ─── */}
        <div style={{ ...term.sectionLabel, marginTop: 24 }}>
          SUBMISSIONS
          <span style={{ color: "#333", marginLeft: 8 }}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: "#333",
                fontFamily: MONO,
                fontSize: 12,
              }}
            >
              <div style={{ marginBottom: 8 }}>NO RECORDS MATCH FILTER</div>
              <button
                onClick={() => setFilter("all")}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  padding: "4px 12px",
                  border: "1px solid #222",
                  borderRadius: 2,
                  background: "transparent",
                  color: "#555",
                  cursor: "pointer",
                }}
              >
                CLEAR FILTER
              </button>
            </div>
          ) : (
            filtered.map((s) => (
              <SubmissionRow
                key={s.id}
                s={s}
                expanded={expandedId === s.id}
                onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
              />
            ))
          )}
        </div>

        {/* ─── Footer ─── */}
        <div
          style={{
            textAlign: "center",
            marginTop: 40,
            fontSize: 10,
            color: "#222",
            fontFamily: MONO,
            letterSpacing: 1,
          }}
        >
          FLOW ARTS PROFESSIONAL // REEL PIPELINE TERMINAL // {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
