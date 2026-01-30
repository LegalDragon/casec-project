import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Star, BarChart3, Users } from "lucide-react";
import { pollsAPI } from "../services/api";

const POLL_INTERVAL = 3000;

// Simple QR code generator using SVG (no external deps)
function QRCodePlaceholder({ url }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center p-2 font-mono break-all">
          {url}
        </div>
      </div>
      <p className="text-gold text-xl font-bold tracking-wide animate-pulse">
        扫码投票 / Scan to Vote!
      </p>
    </div>
  );
}

// Confetti particle effect
function Confetti({ active }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) return;
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1,
      color: ["#FFD700", "#DC2626", "#F59E0B", "#EF4444", "#FBBF24"][
        Math.floor(Math.random() * 5)
      ],
      size: 6 + Math.random() * 8,
    }));
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Animated bar component
function AnimatedBar({ label, count, percentage, maxPercentage, index, prevCount }) {
  const changed = prevCount !== undefined && prevCount !== count;

  return (
    <div className="flex items-center gap-6 group">
      {/* Option label */}
      <div className="w-64 text-right flex-shrink-0">
        <span className="text-2xl xl:text-3xl font-bold text-white leading-tight">
          {label}
        </span>
      </div>

      {/* Bar */}
      <div className="flex-1 relative">
        <div className="h-16 xl:h-20 bg-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div
            className="h-full rounded-xl flex items-center justify-end pr-6 transition-all duration-1000 ease-out"
            style={{
              width: `${Math.max(percentage, 2)}%`,
              background: `linear-gradient(90deg, #DC2626, #F59E0B)`,
              boxShadow: changed ? "0 0 30px rgba(255, 215, 0, 0.6)" : "none",
            }}
          >
            {percentage > 15 && (
              <span className="text-xl xl:text-2xl font-bold text-white drop-shadow-lg">
                {percentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        {percentage <= 15 && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl xl:text-2xl font-bold text-gold">
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Vote count */}
      <div className="w-28 text-left flex-shrink-0">
        <span
          className={`text-3xl xl:text-4xl font-black transition-all duration-300 ${
            changed ? "text-gold scale-125" : "text-white/80"
          }`}
        >
          {count}
        </span>
      </div>
    </div>
  );
}

// Star rating display
function StarDisplay({ average, max = 5 }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = average >= starValue;
        const partial = !filled && average > starValue - 1;
        return (
          <Star
            key={i}
            className={`w-16 h-16 xl:w-20 xl:h-20 transition-all duration-500 ${
              filled
                ? "text-gold fill-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                : partial
                ? "text-gold/50 fill-gold/30"
                : "text-white/20"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function LivePoll() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const prevCountsRef = useRef({});
  const intervalRef = useRef(null);

  const loadPoll = useCallback(async () => {
    try {
      const response = await pollsAPI.getById(pollId);
      if (response.success) {
        setPoll(response.data);
      }
    } catch (err) {
      console.error("Failed to load poll:", err);
      if (!poll) setError("Failed to load poll");
    }
  }, [pollId]);

  const loadResults = useCallback(async () => {
    try {
      const response = await pollsAPI.getResults(pollId);
      if (response.success) {
        const newResults = response.data;

        // Check if any counts changed for confetti
        if (results) {
          const oldTotal = results.totalResponses || 0;
          const newTotal = newResults.totalResponses || 0;
          if (newTotal > oldTotal) {
            setConfettiTrigger((t) => t + 1);
          }
        }

        // Store prev counts for animation
        if (results?.options) {
          const prevCounts = {};
          results.options.forEach((o) => {
            prevCounts[o.optionId] = o.voteCount;
          });
          prevCountsRef.current = prevCounts;
        }

        setResults(newResults);
      }
    } catch (err) {
      // If results endpoint fails (auth required), fall back to poll data
      console.warn("Results endpoint failed, using poll data:", err);
    }
  }, [pollId, results]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadPoll();
      await loadResults();
      setLoading(false);
    };
    init();
  }, [pollId]);

  // Poll for updates
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadPoll();
      loadResults();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [loadPoll, loadResults]);

  // Use results data (admin) or fall back to poll data (public)
  const displayData = results || poll;
  const options = results?.options || poll?.options || [];
  const totalResponses =
    results?.totalResponses ?? poll?.totalResponses ?? 0;
  const averageRating = results?.averageRating ?? null;
  const pollType = poll?.pollType || results?.pollType || "SingleChoice";
  const question = poll?.question || results?.question || "";

  // Build origin for QR code URL
  const voteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/vote/${pollId}`
      : `/vote/${pollId}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-gold animate-spin" />
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <p className="text-white text-3xl">{error}</p>
        </div>
      </div>
    );
  }

  const maxVoteCount = Math.max(...options.map((o) => o.voteCount || 0), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black text-white overflow-hidden relative">
      <Confetti active={confettiTrigger} />

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 h-screen flex flex-col p-8 xl:p-12">
        {/* Header — Question */}
        <div className="text-center mb-8 xl:mb-12 flex-shrink-0">
          <h1 className="text-5xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-gold leading-tight drop-shadow-lg">
            {question}
          </h1>
          {poll?.description && (
            <p className="text-xl xl:text-2xl text-white/60 mt-4 max-w-4xl mx-auto">
              {poll.description}
            </p>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 flex gap-8 xl:gap-12 min-h-0">
          {/* Results area */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Choice-based polls */}
            {(pollType === "SingleChoice" || pollType === "MultipleChoice") && (
              <div className="space-y-5 xl:space-y-6">
                {options.map((option, index) => (
                  <AnimatedBar
                    key={option.optionId}
                    label={option.optionText}
                    count={option.voteCount || 0}
                    percentage={option.percentage || 0}
                    maxPercentage={
                      maxVoteCount > 0
                        ? ((option.voteCount || 0) / maxVoteCount) * 100
                        : 0
                    }
                    index={index}
                    prevCount={prevCountsRef.current[option.optionId]}
                  />
                ))}
              </div>
            )}

            {/* Rating-based polls */}
            {pollType === "Rating" && (
              <div className="flex flex-col items-center gap-8">
                <StarDisplay
                  average={averageRating || 0}
                  max={poll?.ratingMax || 5}
                />
                <div className="text-8xl xl:text-9xl font-black text-gold">
                  {averageRating ? averageRating.toFixed(1) : "—"}
                </div>
                <p className="text-2xl text-white/60">
                  Average Rating
                </p>

                {/* Distribution histogram */}
                {results?.responses && (
                  <div className="flex items-end gap-4 h-40 mt-4">
                    {Array.from(
                      { length: (poll?.ratingMax || 5) - (poll?.ratingMin || 1) + 1 },
                      (_, i) => i + (poll?.ratingMin || 1)
                    ).map((val) => {
                      const count = results.responses?.filter(
                        (r) => r.ratingValue === val
                      ).length || 0;
                      const maxCount = Math.max(
                        ...Array.from(
                          { length: (poll?.ratingMax || 5) - (poll?.ratingMin || 1) + 1 },
                          (_, i) =>
                            results.responses?.filter(
                              (r) => r.ratingValue === i + (poll?.ratingMin || 1)
                            ).length || 0
                        ),
                        1
                      );
                      const height = (count / maxCount) * 100;
                      return (
                        <div key={val} className="flex flex-col items-center gap-2">
                          <span className="text-sm text-white/60">{count}</span>
                          <div
                            className="w-12 xl:w-16 rounded-t-lg bg-gradient-to-t from-red-600 to-gold transition-all duration-1000"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          <div className="flex items-center gap-0.5">
                            <Star className="w-4 h-4 text-gold fill-gold" />
                            <span className="text-white/80 text-sm font-bold">{val}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QR Code + Stats sidebar */}
          <div className="w-72 xl:w-80 flex flex-col items-center justify-center gap-8 flex-shrink-0">
            <QRCodePlaceholder url={voteUrl} />

            {/* Total votes */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Users className="w-8 h-8 text-gold" />
                <span className="text-5xl xl:text-6xl font-black text-gold">
                  {totalResponses}
                </span>
              </div>
              <p className="text-lg text-white/50">
                {totalResponses === 1 ? "vote" : "votes"} · 投票数
              </p>
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div className="flex-shrink-0 text-center mt-6">
          <p className="text-white/30 text-sm tracking-widest uppercase">
            CASEC Spring Gala 2026 · 佛罗里达华人春晚
          </p>
        </div>
      </div>

      {/* Global styles for gold color utility */}
      <style>{`
        .text-gold { color: #FFD700; }
        .bg-gold { background-color: #FFD700; }
        .fill-gold { fill: #FFD700; }
        .border-gold { border-color: #FFD700; }
      `}</style>
    </div>
  );
}
