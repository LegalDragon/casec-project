import { useState, useEffect } from "react";
import { Loader2, Rocket, GitCommit, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import api from "../services/api";

export default function DeploymentHistory() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeployments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/deployments?limit=50");
      setDeployments(response.data || []);
    } catch (err) {
      setError("Failed to load deployment history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "Z"); // UTC
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  };

  const timeSince = (dateStr) => {
    const now = new Date();
    const d = new Date(dateStr + "Z");
    const seconds = Math.floor((now - d) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
        color: "#e0e0e0",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Rocket size={28} color="#4fc3f7" />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: "#fff", fontWeight: 700 }}>
              Deployment History
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#888", marginTop: 2 }}>
              CASEC Florida — CI/CD Pipeline
            </p>
          </div>
        </div>
        <button
          onClick={fetchDeployments}
          disabled={loading}
          style={{
            background: "rgba(79,195,247,0.15)",
            border: "1px solid rgba(79,195,247,0.3)",
            borderRadius: 8,
            color: "#4fc3f7",
            padding: "8px 16px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
          }}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {loading && deployments.length === 0 && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Loader2 size={40} color="#4fc3f7" className="spin" />
            <p style={{ color: "#888", marginTop: 16 }}>Loading deployments...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(244,67,54,0.1)",
              border: "1px solid rgba(244,67,54,0.3)",
              borderRadius: 8,
              padding: 16,
              color: "#ef5350",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {!loading && deployments.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
            <Rocket size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>No deployments yet. Run your first deploy!</p>
          </div>
        )}

        {deployments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {deployments.map((d, i) => (
              <div
                key={d.deploymentId}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    d.status === "success"
                      ? "rgba(76,175,80,0.2)"
                      : d.status === "failed"
                      ? "rgba(244,67,54,0.2)"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.07)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                }
              >
                {/* Status icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      d.status === "success"
                        ? "rgba(76,175,80,0.15)"
                        : "rgba(244,67,54,0.15)",
                    flexShrink: 0,
                  }}
                >
                  {d.status === "success" ? (
                    <CheckCircle size={20} color="#4caf50" />
                  ) : (
                    <XCircle size={20} color="#f44336" />
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#fff",
                      fontSize: 15,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {d.summary}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginTop: 6,
                      fontSize: 13,
                      color: "#888",
                      flexWrap: "wrap",
                    }}
                  >
                    {d.commitHash && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <GitCommit size={13} />
                        <code style={{ color: "#4fc3f7" }}>{d.commitHash.slice(0, 7)}</code>
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={13} />
                      {formatDate(d.deployedAt)}
                    </span>
                    {d.durationSeconds && (
                      <span>{d.durationSeconds}s</span>
                    )}
                    <span style={{ color: "#666" }}>{d.deployedBy}</span>
                  </div>
                </div>

                {/* Time ago badge */}
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {timeSince(d.deployedAt)}
                </div>

                {/* Deploy number */}
                <div
                  style={{
                    fontSize: 12,
                    color: "#555",
                    fontFamily: "monospace",
                    flexShrink: 0,
                  }}
                >
                  #{i === 0 ? deployments.length : deployments.length - i}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
