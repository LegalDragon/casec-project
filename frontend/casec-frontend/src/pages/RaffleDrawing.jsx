import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Trophy,
  Ticket,
  Gift,
  Loader2,
  ChevronLeft,
  Play,
  RotateCcw,
  Users,
  Star,
  Sparkles,
  XCircle,
  Monitor,
} from "lucide-react";
import { rafflesAPI, getAssetUrl } from "../services/api";

/* ═══════════════════════════════════════════════════════════════════
   PRIZE CAROUSEL — rotates through all prizes with fade transitions
   ═══════════════════════════════════════════════════════════════════ */
function PrizeCarousel({ prizes }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  const validPrizes = prizes?.length ? prizes : [];

  const goTo = useCallback(
    (idx) => {
      if (idx === activeIndex || isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex(idx);
        setIsTransitioning(false);
      }, 400);
    },
    [activeIndex, isTransitioning]
  );

  useEffect(() => {
    if (validPrizes.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % validPrizes.length);
        setIsTransitioning(false);
      }, 400);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [validPrizes.length]);

  if (validPrizes.length === 0) return null;

  const prize = validPrizes[activeIndex];

  return (
    <div className="prize-carousel-wrapper">
      <div
        className={`prize-carousel-card ${prize.isGrandPrize ? "grand-prize" : ""} ${
          isTransitioning ? "carousel-fade-out" : "carousel-fade-in"
        }`}
      >
        <div className="prize-carousel-inner">
          {/* Image side */}
          <div className="prize-carousel-image-wrap">
            {prize.imageUrl ? (
              <img
                src={getAssetUrl(prize.imageUrl)}
                alt={prize.name}
                className="prize-carousel-img"
              />
            ) : (
              <div className="prize-carousel-placeholder">
                <Gift className="w-16 h-16 text-yellow-400/60" />
              </div>
            )}
          </div>
          {/* Info side */}
          <div className="prize-carousel-info">
            {prize.isGrandPrize && (
              <div className="grand-prize-badge">
                <Star className="w-4 h-4 fill-current" />
                GRAND PRIZE
                <Star className="w-4 h-4 fill-current" />
              </div>
            )}
            <h3 className="prize-carousel-name">{prize.name}</h3>
            {prize.value && (
              <p className="prize-carousel-value">
                ${prize.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
            {prize.description && (
              <p className="prize-carousel-desc">{prize.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dot navigation */}
      {validPrizes.length > 1 && (
        <div className="prize-carousel-dots">
          {validPrizes.map((p, i) => (
            <button
              key={p.prizeId || i}
              onClick={() => goTo(i)}
              className={`carousel-dot ${i === activeIndex ? "active" : ""} ${
                p.isGrandPrize ? "grand" : ""
              }`}
              aria-label={`Show prize ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FLIP PANEL — Split-flap style digit display (enhanced for video wall)
   ═══════════════════════════════════════════════════════════════════ */
function FlipPanel({ digit, isRevealing, onRevealComplete, index }) {
  const [currentDigit, setCurrentDigit] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDigit, setFlipDigit] = useState(0);
  const [justLanded, setJustLanded] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (digit === null) {
      hasAnimated.current = false;
      setCurrentDigit(null);
      setJustLanded(false);
      return;
    }
    if (isRevealing && digit !== null && !hasAnimated.current && !isFlipping) {
      hasAnimated.current = true;
      animateFlip(digit);
    } else if (digit !== null && currentDigit === null && !isRevealing) {
      setCurrentDigit(digit);
      hasAnimated.current = true;
    }
  }, [isRevealing, digit]);

  const animateFlip = async (targetDigit) => {
    setIsFlipping(true);
    const startDigit = currentDigit ?? 0;
    const steps = 20 + Math.floor(Math.random() * 10);
    const baseDelay = 40;

    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay + i * 4));
      if (i < steps) {
        setFlipDigit((startDigit + i) % 10);
      } else {
        setFlipDigit(targetDigit);
        setCurrentDigit(targetDigit);
      }
    }

    setIsFlipping(false);
    // Slam effect
    setJustLanded(true);
    setShowBurst(true);
    setTimeout(() => setJustLanded(false), 400);
    setTimeout(() => setShowBurst(false), 900);
    onRevealComplete?.();
  };

  const displayDigit = isFlipping ? flipDigit : currentDigit;
  const unrevealed = currentDigit === null && !isFlipping;

  return (
    <div
      className={`flip-panel-container ${isFlipping ? "flip-revealing sound-hook-flipping" : ""} ${
        justLanded ? "flip-slam sound-hook-landed" : ""
      } ${unrevealed ? "flip-unrevealed" : "flip-revealed"}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Golden particle burst on reveal */}
      {showBurst && (
        <div className="particle-burst">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="burst-particle" style={{ "--angle": `${i * 30}deg` }} />
          ))}
        </div>
      )}

      <div className="flip-panel-inner">
        {/* Top half */}
        <div className="flip-half flip-top">
          <span className={`flip-digit ${isFlipping ? "digit-spinning" : ""}`}>
            {displayDigit !== null ? displayDigit : "?"}
          </span>
        </div>
        {/* Bottom half */}
        <div className="flip-half flip-bottom">
          <span className={`flip-digit ${isFlipping ? "digit-spinning" : ""}`}>
            {displayDigit !== null ? displayDigit : "?"}
          </span>
        </div>
        {/* Center line */}
        <div className="flip-center-line" />
        {/* Corner rivets */}
        <div className="flip-rivet" style={{ top: 8, left: 8 }} />
        <div className="flip-rivet" style={{ top: 8, right: 8 }} />
        <div className="flip-rivet" style={{ bottom: 8, left: 8 }} />
        <div className="flip-rivet" style={{ bottom: 8, right: 8 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PARTICIPANT CARD — with enhanced elimination & survival animations
   ═══════════════════════════════════════════════════════════════════ */
function ParticipantCard({
  participant,
  animationStage,
  isInEliminatedSection,
  totalDigits,
  size = "normal",
  survived, // true → brief green glow after a round
}) {
  const isSmall = size === "small";

  const getAnimationClasses = () => {
    if (animationStage === "pending") return "";
    if (animationStage === "shake") return "card-shake card-red-flash";
    if (animationStage === "shrink") return "card-shrink";
    if (animationStage === "exit") return "card-exit";
    if (animationStage === "entered") return "card-pop-in";
    if (isInEliminatedSection) return "card-eliminated";
    return "";
  };

  return (
    <div
      className={`participant-card ${getAnimationClasses()} ${
        survived ? "card-survived" : ""
      } ${isSmall ? "participant-card-sm" : "participant-card-lg"}`}
    >
      <div className="participant-avatar-wrap">
        {/* Avatar */}
        <div className={`participant-avatar ${isSmall ? "avatar-sm" : "avatar-lg"}`}>
          {participant.avatarUrl ? (
            <img
              src={getAssetUrl(participant.avatarUrl)}
              alt={participant.name}
              className="avatar-img"
            />
          ) : (
            <div className="avatar-placeholder">
              {participant.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Ticket count badge */}
          {!isSmall && (
            <div className="ticket-badge">{participant.totalTickets}</div>
          )}

          {/* Winner crown */}
          {participant.isWinner && (
            <div className="winner-crown">
              <Trophy
                className={`text-yellow-400 fill-yellow-400 animate-bounce ${
                  isSmall ? "w-4 h-4" : "w-7 h-7"
                }`}
              />
            </div>
          )}

          {/* Elimination overlay */}
          {animationStage === "shake" && (
            <div className="elimination-overlay">
              <XCircle
                className={`text-red-500 animate-pulse ${
                  isSmall ? "w-5 h-5" : "w-12 h-12"
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <span
        className={`participant-name ${isSmall ? "name-sm" : "name-lg"} ${
          isInEliminatedSection ? "text-gray-600" : "text-white"
        }`}
      >
        {participant.name.split(" ")[0]}
      </span>

      {/* Ticket range */}
      {!isInEliminatedSection && !isSmall && (
        <span className="participant-tickets">
          {participant.ticketStart?.toString().padStart(totalDigits, "0")}-
          {participant.ticketEnd?.toString().padStart(totalDigits, "0")}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED COUNTER — number that smoothly counts down
   ═══════════════════════════════════════════════════════════════════ */
function AnimatedCounter({ value, label, color = "text-green-400" }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    prevRef.current = to;

    const diff = Math.abs(to - from);
    const steps = Math.min(diff, 30);
    const stepDuration = Math.max(20, Math.floor(400 / steps));

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (step >= steps) {
        clearInterval(interval);
        setDisplay(to);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <span className={`${color} font-bold tabular-nums`}>
      <span className="counter-value">{display}</span> {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WINNER OVERLAY — dramatic spotlight reveal
   ═══════════════════════════════════════════════════════════════════ */
function WinnerOverlay({ winner, grandPrize, totalDigits, winningNumber, onClose }) {
  const [stage, setStage] = useState("dark"); // dark → spotlight → card

  useEffect(() => {
    const t1 = setTimeout(() => setStage("spotlight"), 600);
    const t2 = setTimeout(() => setStage("card"), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={`winner-overlay winner-stage-${stage}`}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.5rem",
            right: "1.5rem",
            zIndex: 110,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.7)",
            fontSize: "1.5rem",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          }}
          title="Close"
        >
          ✕
        </button>
      )}
      {/* Confetti rain */}
      <div className="confetti-container">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              "--x": `${Math.random() * 100}vw`,
              "--delay": `${Math.random() * 3}s`,
              "--duration": `${2.5 + Math.random() * 2}s`,
              "--color": ["#FFD700", "#DC2626", "#FF6B35", "#22C55E", "#3B82F6", "#A855F7"][
                i % 6
              ],
              "--size": `${6 + Math.random() * 8}px`,
              "--drift": `${-30 + Math.random() * 60}px`,
            }}
          />
        ))}
      </div>

      {/* Firework bursts */}
      <div className="fireworks">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="firework"
            style={{
              "--fx": `${15 + Math.random() * 70}vw`,
              "--fy": `${10 + Math.random() * 40}vh`,
              "--fdelay": `${i * 0.5 + Math.random() * 0.5}s`,
            }}
          >
            {Array.from({ length: 12 }).map((_, j) => (
              <span
                key={j}
                className="firework-spark"
                style={{ "--spark-angle": `${j * 30}deg` }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Winner card */}
      <div className={`winner-card ${stage === "card" ? "winner-card-visible" : ""}`}>
        <div className="winner-trophy-wrap">
          <Trophy className="winner-trophy-icon" />
        </div>

        <h2 className="winner-title">🎉 WINNER! 🎉</h2>

        <div className="winner-avatar-section">
          <div className="winner-avatar-ring">
            {winner.avatarUrl ? (
              <img
                src={getAssetUrl(winner.avatarUrl)}
                alt={winner.name}
                className="winner-avatar-img"
              />
            ) : (
              <div className="winner-avatar-placeholder">
                {winner.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <p className="winner-name">{winner.name}</p>
        <p className="winner-phone">****{winner.phoneNumber?.slice(-4)}</p>
        <p className="winner-ticket">
          Ticket #{winningNumber?.toString().padStart(totalDigits, "0")}
        </p>

        {grandPrize && (
          <div className="winner-prize-section">
            <div className="winner-prize-badge">
              <Star className="w-4 h-4 fill-current" /> {grandPrize.name}
            </div>
            {grandPrize.value && (
              <p className="winner-prize-value">
                ${grandPrize.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN: RAFFLE DRAWING PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function RaffleDrawing() {
  const { raffleId } = useParams();
  const [drawingData, setDrawingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealingIndex, setRevealingIndex] = useState(-1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  // Animation tracking
  const [animatingParticipants, setAnimatingParticipants] = useState({});
  const [previousEligibleIds, setPreviousEligibleIds] = useState(new Set());
  const [recentlyMovedIds, setRecentlyMovedIds] = useState(new Set());
  const [survivedIds, setSurvivedIds] = useState(new Set());

  // Debug state
  const [debugLog, setDebugLog] = useState([]);
  const [showDebug, setShowDebug] = useState(true);
  const [pendingEliminations, setPendingEliminations] = useState(null);

  const pendingEliminationIds = useRef([]);
  const [flipAnimationComplete, setFlipAnimationComplete] = useState(false);
  const [isRevealInProgress, setIsRevealInProgress] = useState(false);
  const [displayedCounts, setDisplayedCounts] = useState({ people: 0, tickets: 0 });

  // Winner overlay
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const hasShownWinner = useRef(false);

  const pollInterval = useRef(null);

  useEffect(() => {
    loadDrawingData();
    const authData = localStorage.getItem("casec-auth");
    if (authData) {
      const { user } = JSON.parse(authData).state;
      setIsAdmin(user?.isAdmin);
    }

    pollInterval.current = setInterval(loadDrawingData, 5000);
    return () => clearInterval(pollInterval.current);
  }, [raffleId]);

  // Track eliminated participants for multi-stage animation
  useEffect(() => {
    if (drawingData?.participants) {
      const currentEligibleIds = new Set(
        drawingData.participants
          .filter((p) => p.isStillEligible)
          .map((p) => p.participantId)
      );

      const newlyEliminated = [];
      previousEligibleIds.forEach((id) => {
        if (!currentEligibleIds.has(id)) {
          newlyEliminated.push(id);
        }
      });

      if (newlyEliminated.length > 0) {
        const eliminatedNames = drawingData.participants
          .filter((p) => newlyEliminated.includes(p.participantId))
          .map((p) => `${p.name} (${p.ticketStart}-${p.ticketEnd})`);

        const digitIndex = (drawingData.revealedDigits?.length || 1) - 1;
        const revealedDigit = drawingData.revealedDigits?.[digitIndex] || "?";
        const pattern = drawingData.revealedDigits || "";

        setPendingEliminations({
          names: eliminatedNames,
          digitIndex: digitIndex + 1,
          digitValue: revealedDigit,
          pattern: pattern,
          count: newlyEliminated.length,
        });

        setDebugLog((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            digit: digitIndex + 1,
            value: revealedDigit,
            pattern: pattern,
            eliminated: eliminatedNames,
            remainingCount: currentEligibleIds.size,
          },
        ]);

        setAnimatingParticipants((prev) => {
          const next = { ...prev };
          newlyEliminated.forEach((id) => (next[id] = "pending"));
          return next;
        });

        pendingEliminationIds.current = newlyEliminated;
        setFlipAnimationComplete(false);

        // Survivors glow green
        setSurvivedIds(new Set(currentEligibleIds));
        setTimeout(() => setSurvivedIds(new Set()), 2000);
      } else if (previousEligibleIds.size > 0 && currentEligibleIds.size > 0) {
        // No eliminations this round but digit was revealed — survivors still glow
        setSurvivedIds(new Set(currentEligibleIds));
        setTimeout(() => setSurvivedIds(new Set()), 2000);
      }

      setPreviousEligibleIds(currentEligibleIds);
    }
  }, [drawingData?.revealedDigits]);

  // Initialize displayed counts
  useEffect(() => {
    if (
      drawingData?.participants &&
      !isRevealInProgress &&
      Object.keys(animatingParticipants).length === 0
    ) {
      const eligible = drawingData.participants.filter((p) => p.isStillEligible);
      setDisplayedCounts({
        people: eligible.length,
        tickets: eligible.reduce((sum, p) => sum + (p.totalTickets || 0), 0),
      });
    }
  }, [drawingData?.participants, animatingParticipants, isRevealInProgress]);

  // Run elimination animation when flip completes
  useEffect(() => {
    if (flipAnimationComplete) {
      if (pendingEliminationIds.current.length > 0) {
        const idsToAnimate = [...pendingEliminationIds.current];
        pendingEliminationIds.current = [];
        runEliminationAnimation(idsToAnimate);
      } else {
        setIsRevealInProgress(false);
      }
    }
  }, [flipAnimationComplete]);

  // Winner overlay trigger
  useEffect(() => {
    if (drawingData?.status === "Completed" && !hasShownWinner.current) {
      const winner = drawingData?.participants?.find((p) => p.isWinner);
      if (winner) {
        hasShownWinner.current = true;
        setTimeout(() => setShowWinnerOverlay(true), 500);
      }
    }
    if (drawingData?.status !== "Completed") {
      hasShownWinner.current = false;
      setShowWinnerOverlay(false);
    }
  }, [drawingData?.status]);

  const handleFlipComplete = () => {
    setFlipAnimationComplete(true);
  };

  const runEliminationAnimation = async (participantIds) => {
    await new Promise((r) => setTimeout(r, 300));

    // Stage 1: Shake + red flash
    setAnimatingParticipants((prev) => {
      const next = { ...prev };
      participantIds.forEach((id) => (next[id] = "shake"));
      return next;
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Stage 2: Shrink
    setAnimatingParticipants((prev) => {
      const next = { ...prev };
      participantIds.forEach((id) => (next[id] = "shrink"));
      return next;
    });
    await new Promise((r) => setTimeout(r, 600));

    // Stage 3: Exit
    setAnimatingParticipants((prev) => {
      const next = { ...prev };
      participantIds.forEach((id) => delete next[id]);
      return next;
    });

    setPendingEliminations(null);

    if (drawingData?.participants) {
      const eligible = drawingData.participants.filter((p) => p.isStillEligible);
      setDisplayedCounts({
        people: eligible.length,
        tickets: eligible.reduce((sum, p) => sum + (p.totalTickets || 0), 0),
      });
    }

    setIsRevealInProgress(false);

    setRecentlyMovedIds(new Set(participantIds));
    setTimeout(() => setRecentlyMovedIds(new Set()), 500);
  };

  const loadDrawingData = async () => {
    try {
      const response = await rafflesAPI.getDrawingData(raffleId);
      if (response.success) {
        setDrawingData(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to load drawing data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartDrawing = async () => {
    try {
      const response = await rafflesAPI.startDrawing(raffleId);
      if (response.success) {
        if (response.data?.participants) {
          const eligible = response.data.participants.filter((p) => p.isStillEligible);
          setPreviousEligibleIds(new Set(eligible.map((p) => p.participantId)));
          setDisplayedCounts({
            people: eligible.length,
            tickets: eligible.reduce((sum, p) => sum + (p.totalTickets || 0), 0),
          });
        }
        setAnimatingParticipants({});
        setRecentlyMovedIds(new Set());
        setDrawingData(response.data);
      } else {
        setError(response.message || "Failed to start drawing");
      }
    } catch (err) {
      const errorMsg =
        typeof err === "string" ? err : err?.message || "Failed to start drawing";
      setError(errorMsg);
    }
  };

  const handleRevealNext = async () => {
    const currentIndex = drawingData?.revealedDigits?.length || 0;
    setRevealingIndex(currentIndex);
    setIsRevealInProgress(true);

    try {
      const response = await rafflesAPI.revealNext(raffleId);
      if (response.success) {
        setDrawingData(response.data);
        setTimeout(() => {
          setRevealingIndex(-1);
        }, 2500);
      } else {
        setError(response.message || "Failed to reveal digit");
        setRevealingIndex(-1);
        setIsRevealInProgress(false);
      }
    } catch (err) {
      const errorMsg =
        typeof err === "string" ? err : err?.message || "Failed to reveal digit";
      setError(errorMsg);
      setRevealingIndex(-1);
      setIsRevealInProgress(false);
    }
  };

  const handleResetDrawing = async () => {
    if (!confirm("Are you sure you want to reset the drawing?")) return;
    try {
      const response = await rafflesAPI.resetDrawing(raffleId);
      if (response.success) {
        setAnimatingParticipants({});
        setRecentlyMovedIds(new Set());
        setPreviousEligibleIds(new Set());
        loadDrawingData();
      } else {
        setError(response.message || "Failed to reset drawing");
      }
    } catch (err) {
      const errorMsg =
        typeof err === "string" ? err : err?.message || "Failed to reset drawing";
      setError(errorMsg);
    }
  };

  const getRevealedDigits = () => {
    if (!drawingData) return [];
    const revealed = drawingData.revealedDigits || "";
    const digits = [];
    for (let i = 0; i < drawingData.ticketDigits; i++) {
      digits.push(revealed[i] !== undefined ? parseInt(revealed[i]) : null);
    }
    return digits;
  };

  const eligibleParticipants =
    drawingData?.participants?.filter(
      (p) => p.isStillEligible || animatingParticipants[p.participantId]
    ) || [];

  const eliminatedParticipants =
    drawingData?.participants?.filter(
      (p) => !p.isStillEligible && !animatingParticipants[p.participantId]
    ) || [];

  const digitsRevealed = drawingData?.revealedDigits?.length || 0;
  const totalDigits = drawingData?.ticketDigits || 6;
  const allDigitsRevealed = digitsRevealed >= totalDigits;

  const winner = drawingData?.participants?.find((p) => p.isWinner);
  const grandPrize =
    drawingData?.prizes?.find((p) => p.isGrandPrize) || drawingData?.prizes?.[0];

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-yellow-400/70 text-xl">Loading Raffle...</p>
        </div>
      </div>
    );
  }

  /* ─── Fatal error ─── */
  if (error && !drawingData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-white mb-3">Error</h2>
          <p className="text-gray-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="raffle-page">
      {/* ═══ INLINE STYLES ═══ */}
      <style>{`
        /* ============================================
           ROOT & BACKGROUND ATMOSPHERE
           ============================================ */
        .raffle-page {
          min-height: 100vh;
          background: #050510;
          position: relative;
          overflow-x: hidden;
          color: #fff;
        }
        .raffle-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(88, 28, 135, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(30, 58, 138, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(127, 29, 29, 0.1) 0%, transparent 50%);
          animation: bgShift 12s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 0;
        }
        @keyframes bgShift {
          0% { opacity: 1; filter: hue-rotate(0deg); }
          50% { opacity: 0.8; filter: hue-rotate(15deg); }
          100% { opacity: 1; filter: hue-rotate(-10deg); }
        }

        /* Subtle grid overlay */
        .raffle-page::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,215,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,215,0,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        .raffle-content {
          position: relative;
          z-index: 1;
        }

        /* ============================================
           FLOATING BOKEH / SPARKLE PARTICLES
           ============================================ */
        .ambient-particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .ambient-particle {
          position: absolute;
          border-radius: 50%;
          animation: floatParticle var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
          opacity: 0;
        }
        @keyframes floatParticle {
          0% { transform: translateY(100vh) translateX(0) scale(0); opacity: 0; }
          10% { opacity: var(--opacity); }
          50% { transform: translateY(40vh) translateX(var(--drift)) scale(1); opacity: var(--opacity); }
          90% { opacity: var(--opacity); }
          100% { transform: translateY(-10vh) translateX(calc(var(--drift) * -0.5)) scale(0.3); opacity: 0; }
        }

        /* ============================================
           PRIZE CAROUSEL
           ============================================ */
        .prize-carousel-wrapper {
          margin-bottom: 1.5rem;
        }
        .prize-carousel-card {
          background: linear-gradient(135deg, rgba(30, 20, 60, 0.9), rgba(20, 15, 50, 0.9));
          border: 1px solid rgba(255, 215, 0, 0.15);
          border-radius: 1.5rem;
          overflow: hidden;
          transition: opacity 0.4s ease, transform 0.4s ease;
          backdrop-filter: blur(10px);
        }
        .prize-carousel-card.grand-prize {
          border-color: rgba(255, 215, 0, 0.5);
          box-shadow: 0 0 40px rgba(255, 215, 0, 0.15), inset 0 0 40px rgba(255, 215, 0, 0.05);
        }
        .carousel-fade-out {
          opacity: 0;
          transform: scale(0.97);
        }
        .carousel-fade-in {
          opacity: 1;
          transform: scale(1);
        }
        .prize-carousel-inner {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding: 1.5rem 2rem;
        }
        @media (max-width: 768px) {
          .prize-carousel-inner {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
            padding: 1.5rem;
          }
        }
        .prize-carousel-image-wrap {
          flex-shrink: 0;
          width: 160px;
          height: 120px;
          border-radius: 1rem;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
        }
        .prize-carousel-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .prize-carousel-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(255,215,0,0.05), rgba(220,38,38,0.05));
        }
        .prize-carousel-info {
          flex: 1;
          min-width: 0;
        }
        .grand-prize-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.25rem 1rem;
          border-radius: 9999px;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .prize-carousel-name {
          font-size: 1.75rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 0.25rem;
        }
        .prize-carousel-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #FFD700;
        }
        .prize-carousel-desc {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.6);
          margin-top: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .prize-carousel-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        .carousel-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        .carousel-dot.active {
          background: #FFD700;
          box-shadow: 0 0 8px rgba(255,215,0,0.5);
          transform: scale(1.3);
        }
        .carousel-dot.grand {
          border: 1px solid rgba(255,215,0,0.4);
        }

        /* ============================================
           FLIP PANELS — enhanced for video wall
           ============================================ */
        .flip-panels-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          perspective: 1000px;
        }
        @media (min-width: 768px) {
          .flip-panels-row { gap: 1.25rem; }
        }

        .flip-panel-container {
          position: relative;
          width: 80px;
          height: 120px;
          perspective: 800px;
        }
        @media (min-width: 768px) {
          .flip-panel-container {
            width: 120px;
            height: 180px;
          }
        }
        @media (min-width: 1280px) {
          .flip-panel-container {
            width: 140px;
            height: 200px;
          }
        }

        .flip-panel-inner {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.1);
          background: #111;
          transform-style: preserve-3d;
        }

        /* Unrevealed shimmer */
        .flip-unrevealed .flip-panel-inner {
          animation: shimmer 2.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 15px rgba(255,215,0,0.0); }
          50% { box-shadow: 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 20px rgba(255,215,0,0.15); }
        }

        /* Revealing glow */
        .flip-revealing .flip-panel-inner {
          animation: revealGlow 0.3s ease-in-out infinite alternate;
        }
        @keyframes revealGlow {
          0% { box-shadow: 0 0 20px rgba(255,215,0,0.3), 0 0 60px rgba(255,215,0,0.1); }
          100% { box-shadow: 0 0 30px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2); }
        }

        /* Slam effect */
        .flip-slam {
          animation: slamLand 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes slamLand {
          0% { transform: scale(1.15); }
          40% { transform: scale(0.95); }
          70% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .flip-slam .flip-panel-inner {
          box-shadow:
            0 0 40px rgba(255,215,0,0.6),
            0 0 80px rgba(255,215,0,0.2),
            0 8px 32px rgba(0,0,0,0.6) !important;
          animation: none !important;
        }

        /* Revealed steady glow */
        .flip-revealed .flip-panel-inner {
          border: 1px solid rgba(255,215,0,0.2);
        }

        .flip-half {
          position: absolute;
          left: 0; right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .flip-top {
          top: 0;
          height: 50%;
          background: linear-gradient(180deg, #1a1a2e, #16162a);
          align-items: flex-end;
        }
        .flip-bottom {
          bottom: 0;
          height: 50%;
          background: linear-gradient(180deg, #111128, #0d0d20);
          align-items: flex-start;
        }
        .flip-digit {
          font-family: 'Courier New', monospace;
          font-weight: 900;
          color: #FFD700;
          font-size: 3.5rem;
          line-height: 1;
          text-shadow: 0 0 20px rgba(255,215,0,0.4);
          user-select: none;
        }
        .flip-top .flip-digit { transform: translateY(50%); }
        .flip-bottom .flip-digit { transform: translateY(-50%); }
        @media (min-width: 768px) {
          .flip-digit { font-size: 5.5rem; }
        }
        @media (min-width: 1280px) {
          .flip-digit { font-size: 6.5rem; }
        }
        .digit-spinning {
          animation: digitSpin 0.08s linear infinite;
        }
        @keyframes digitSpin {
          0% { filter: blur(0.5px); }
          50% { filter: blur(1px); }
          100% { filter: blur(0.5px); }
        }

        .flip-center-line {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(0,0,0,0.8);
          transform: translateY(-50%);
          box-shadow: 0 1px 0 rgba(255,255,255,0.05);
          z-index: 2;
        }
        .flip-rivet {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle, #333, #222);
          border: 1px solid #444;
          z-index: 3;
        }

        /* Particle burst from panel */
        .particle-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          z-index: 10;
          pointer-events: none;
        }
        .burst-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFD700;
          box-shadow: 0 0 6px #FFD700;
          animation: burstOut 0.8s ease-out forwards;
          transform: rotate(var(--angle));
        }
        @keyframes burstOut {
          0% { transform: rotate(var(--angle)) translateX(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle)) translateX(80px) scale(0); opacity: 0; }
        }

        /* ============================================
           PARTICIPANT CARDS
           ============================================ */
        .participant-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .participant-card-lg { gap: 0.35rem; }
        .participant-card-sm { gap: 0.15rem; }

        .participant-avatar-wrap { position: relative; }

        .avatar-lg { width: 72px; height: 72px; position: relative; }
        .avatar-sm { width: 36px; height: 36px; position: relative; }
        @media (min-width: 768px) {
          .avatar-lg { width: 80px; height: 80px; }
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.3);
        }
        .avatar-sm .avatar-img { border-width: 1px; }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          border: 2px solid rgba(255,255,255,0.3);
        }
        .avatar-lg .avatar-placeholder { font-size: 1.5rem; }
        .avatar-sm .avatar-placeholder { font-size: 0.7rem; border-width: 1px; }

        .ticket-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 9999px;
          min-width: 1.5rem;
          text-align: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        .winner-crown {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
        }

        .elimination-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(220, 38, 38, 0.35);
          border-radius: 50%;
        }

        .participant-name {
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .name-lg { font-size: 0.85rem; max-width: 80px; }
        .name-sm { font-size: 0.6rem; max-width: 40px; color: #6b7280; }

        .participant-tickets {
          font-size: 0.7rem;
          color: #9ca3af;
          font-family: monospace;
        }

        /* Card animation stages */
        @keyframes cardShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-8px) rotate(-2deg); }
          20% { transform: translateX(8px) rotate(2deg); }
          30% { transform: translateX(-6px) rotate(-1.5deg); }
          40% { transform: translateX(6px) rotate(1.5deg); }
          50% { transform: translateX(-4px) rotate(-1deg); }
          60% { transform: translateX(4px) rotate(1deg); }
          70% { transform: translateX(-3px) rotate(-0.5deg); }
          80% { transform: translateX(3px) rotate(0.5deg); }
          90% { transform: translateX(-1px); }
        }
        .card-shake {
          animation: cardShake 0.6s ease-in-out 2;
          filter: grayscale(1);
        }
        .card-red-flash .participant-avatar-wrap::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 3px solid #DC2626;
          animation: redFlash 0.4s ease-in-out 3;
        }
        @keyframes redFlash {
          0%, 100% { opacity: 0; box-shadow: none; }
          50% { opacity: 1; box-shadow: 0 0 20px rgba(220,38,38,0.5); }
        }

        .card-shrink {
          transform: scale(0.3);
          opacity: 0;
          filter: grayscale(1) blur(2px);
        }
        .card-exit {
          transform: scale(0);
          opacity: 0;
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        .card-pop-in {
          animation: popIn 0.4s ease-out forwards;
        }
        .card-eliminated {
          opacity: 0.5;
          filter: grayscale(0.8);
        }

        /* Survived green glow */
        @keyframes survivedGlow {
          0% { box-shadow: 0 0 0 rgba(34,197,94,0); }
          30% { box-shadow: 0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.2); }
          100% { box-shadow: 0 0 0 rgba(34,197,94,0); }
        }
        .card-survived .avatar-img,
        .card-survived .avatar-placeholder {
          animation: survivedGlow 1.5s ease-out;
          border-color: #22C55E !important;
        }

        /* ============================================
           WINNER OVERLAY
           ============================================ */
        .winner-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.8s ease;
        }
        .winner-stage-dark {
          background: rgba(0,0,0,0.95);
        }
        .winner-stage-spotlight {
          background: radial-gradient(circle at 50% 45%, rgba(255,215,0,0.15) 0%, rgba(0,0,0,0.95) 60%);
        }
        .winner-stage-card {
          background: radial-gradient(circle at 50% 45%, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0.9) 60%);
        }

        .winner-card {
          text-align: center;
          padding: 3rem 4rem;
          border-radius: 2rem;
          background: linear-gradient(135deg, rgba(30,20,60,0.95), rgba(20,10,40,0.95));
          border: 2px solid rgba(255,215,0,0.4);
          box-shadow: 0 0 60px rgba(255,215,0,0.2), 0 0 120px rgba(255,215,0,0.05);
          transform: translateY(60px) scale(0.8);
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-width: 500px;
          width: 90%;
          animation: winnerPulse 3s ease-in-out infinite;
        }
        .winner-card-visible {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        @keyframes winnerPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(255,215,0,0.2), 0 0 120px rgba(255,215,0,0.05); }
          50% { box-shadow: 0 0 80px rgba(255,215,0,0.35), 0 0 160px rgba(255,215,0,0.1); }
        }

        .winner-trophy-wrap {
          margin-bottom: 1rem;
        }
        .winner-trophy-icon {
          width: 64px;
          height: 64px;
          color: #FFD700;
          fill: #FFD700;
          margin: 0 auto;
          animation: trophySpin 3s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255,215,0,0.5));
        }
        @keyframes trophySpin {
          0% { transform: rotateY(0deg) scale(1); }
          25% { transform: rotateY(180deg) scale(1.1); }
          50% { transform: rotateY(360deg) scale(1); }
          75% { transform: rotateY(180deg) scale(1.1); }
          100% { transform: rotateY(0deg) scale(1); }
        }

        .winner-title {
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #FFD700, #FF6B35, #FFD700);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textShine 2s linear infinite;
          margin-bottom: 1.5rem;
        }
        @keyframes textShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .winner-avatar-section { margin-bottom: 1rem; }
        .winner-avatar-ring {
          width: 120px;
          height: 120px;
          margin: 0 auto;
          border-radius: 50%;
          padding: 4px;
          background: linear-gradient(135deg, #FFD700, #DC2626, #FFD700);
          animation: ringRotate 3s linear infinite;
        }
        @keyframes ringRotate {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 200%; }
        }
        .winner-avatar-ring {
          background-size: 200% 200%;
        }
        .winner-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #0a0a1a;
        }
        .winner-avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 3rem;
          font-weight: 900;
          border: 3px solid #0a0a1a;
        }

        .winner-name {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.25rem;
        }
        .winner-phone {
          font-size: 1.1rem;
          color: rgba(255,215,0,0.7);
          margin-bottom: 0.25rem;
        }
        .winner-ticket {
          font-size: 1rem;
          color: rgba(255,255,255,0.5);
          font-family: monospace;
          margin-bottom: 1rem;
        }
        .winner-prize-section {
          border-top: 1px solid rgba(255,215,0,0.2);
          padding-top: 1rem;
          margin-top: 0.5rem;
        }
        .winner-prize-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #FFD700;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .winner-prize-value {
          color: #22C55E;
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 0.25rem;
        }

        /* ============================================
           CONFETTI & FIREWORKS (CSS only)
           ============================================ */
        .confetti-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .confetti-piece {
          position: absolute;
          top: -20px;
          left: var(--x);
          width: var(--size);
          height: calc(var(--size) * 0.6);
          background: var(--color);
          animation: confettiFall var(--duration) linear var(--delay) infinite;
          border-radius: 2px;
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(720deg); opacity: 0.3; }
        }

        .fireworks {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .firework {
          position: absolute;
          left: var(--fx);
          top: var(--fy);
          width: 0;
          height: 0;
          animation: fireworkPop 0.1s ease-out var(--fdelay) both;
        }
        @keyframes fireworkPop {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .firework-spark {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #FFD700;
          box-shadow: 0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.5);
          animation: sparkShoot 1.2s ease-out var(--fdelay, 0s) both;
          transform: rotate(var(--spark-angle));
        }
        @keyframes sparkShoot {
          0% { transform: rotate(var(--spark-angle)) translateX(0) scale(1); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: rotate(var(--spark-angle)) translateX(100px) scale(0); opacity: 0; }
        }

        /* ============================================
           COUNTER ANIMATION
           ============================================ */
        .counter-value {
          display: inline-block;
          min-width: 1.5ch;
          text-align: right;
        }

        /* ============================================
           HEADER
           ============================================ */
        .raffle-header {
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,215,0,0.1);
          padding: 0.75rem 1.5rem;
        }
        .raffle-header-inner {
          max-width: 80rem;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .raffle-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .raffle-title {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @media (min-width: 768px) {
          .raffle-title { font-size: 2rem; }
        }

        /* ============================================
           SECTIONS
           ============================================ */
        .section-eligible {
          background: linear-gradient(135deg, rgba(22,101,52,0.15), rgba(22,101,52,0.05));
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 1.5rem;
          padding: 1.5rem;
        }
        .section-eliminated {
          background: rgba(30,30,40,0.3);
          border: 1px solid rgba(100,100,120,0.15);
          border-radius: 1rem;
          padding: 1rem;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.25rem;
        }
        @media (min-width: 768px) {
          .section-title { font-size: 1.5rem; }
        }
        .section-title-eligible { color: #4ade80; }
        .section-title-eliminated { color: #6b7280; font-size: 0.9rem; }

        .section-counts {
          display: flex;
          gap: 1.5rem;
          font-size: 1rem;
        }
        @media (min-width: 768px) {
          .section-counts { font-size: 1.15rem; }
        }

        .participants-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          min-height: 80px;
        }
        .participants-grid-sm {
          gap: 0.5rem;
        }

        /* ============================================
           PROGRESS BAR
           ============================================ */
        .progress-section {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .progress-text {
          color: rgba(255,255,255,0.5);
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        @media (min-width: 768px) {
          .progress-text { font-size: 1.15rem; }
        }
        .progress-bar-bg {
          width: 100%;
          max-width: 400px;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 9999px;
          margin: 0 auto;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #DC2626, #FFD700);
          border-radius: 9999px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 10px rgba(255,215,0,0.4);
        }

        /* ============================================
           ADMIN CONTROLS
           ============================================ */
        .admin-panel {
          background: rgba(20,20,40,0.6);
          border: 1px solid rgba(255,215,0,0.15);
          border-radius: 1.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(8px);
        }
        .admin-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #FFD700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .btn-start {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          color: #fff;
          padding: 0.75rem 2rem;
          border-radius: 1rem;
          font-weight: 700;
          font-size: 1.1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(34,197,94,0.3);
        }
        .btn-start:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,0.4); }

        .btn-reveal {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          padding: 1rem 2.5rem;
          border-radius: 1rem;
          font-weight: 800;
          font-size: 1.25rem;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(255,215,0,0.3);
        }
        .btn-reveal:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(255,215,0,0.4);
        }
        .btn-reveal:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-reset {
          background: rgba(220,38,38,0.2);
          color: #f87171;
          padding: 0.5rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid rgba(220,38,38,0.3);
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
        }
        .btn-reset:hover { background: rgba(220,38,38,0.3); }

        .btn-presentation {
          background: rgba(139,92,246,0.2);
          color: #a78bfa;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border: 1px solid rgba(139,92,246,0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-presentation:hover { background: rgba(139,92,246,0.3); }
        .btn-presentation.active {
          background: rgba(139,92,246,0.4);
          color: #c4b5fd;
          border-color: rgba(139,92,246,0.6);
        }

        /* ============================================
           ALL PRIZES GRID (bottom)
           ============================================ */
        .prizes-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
        .prize-card {
          background: rgba(20,20,40,0.5);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1rem;
          padding: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: all 0.2s;
        }
        .prize-card:hover {
          border-color: rgba(255,215,0,0.2);
          background: rgba(30,25,55,0.6);
        }
        .prize-card.grand {
          border-color: rgba(255,215,0,0.4);
          box-shadow: 0 0 20px rgba(255,215,0,0.1);
        }
        .prize-thumb {
          width: 64px;
          height: 64px;
          border-radius: 0.75rem;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(255,255,255,0.05);
        }
        .prize-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .prize-thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ============================================
           DEBUG PANEL
           ============================================ */
        .debug-panel {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          z-index: 50;
          background: rgba(10,10,20,0.95);
          border: 1px solid rgba(255,215,0,0.3);
          border-radius: 0.75rem;
          max-width: 420px;
          max-height: 60vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          backdrop-filter: blur(12px);
        }
        .debug-header {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          padding: 0.5rem 0.75rem;
          font-weight: 800;
          font-size: 0.8rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .debug-body {
          padding: 0.75rem;
          overflow-y: auto;
          font-size: 0.75rem;
        }
        .debug-section {
          background: rgba(255,255,255,0.03);
          border-radius: 0.5rem;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .debug-toggle {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          z-index: 50;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-weight: 800;
          font-size: 0.8rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(255,215,0,0.3);
        }

        /* ============================================
           PRESENTATION MODE OVERRIDES
           ============================================ */
        .presentation-mode .raffle-header { display: none; }
        .presentation-mode .admin-panel { display: none; }
        .presentation-mode .debug-panel { display: none; }
        .presentation-mode .debug-toggle { display: none; }

        /* ============================================
           ERROR TOAST
           ============================================ */
        .error-toast {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 60;
          background: linear-gradient(135deg, #DC2626, #B91C1C);
          color: #fff;
          padding: 1rem 1.5rem;
          border-radius: 1rem;
          max-width: 380px;
          box-shadow: 0 8px 32px rgba(220,38,38,0.3);
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        /* ============================================
           RESPONSIVE LAYOUT
           ============================================ */
        .raffle-main {
          max-width: 80rem;
          margin: 0 auto;
          padding: 1.5rem 1rem;
        }
        @media (min-width: 768px) {
          .raffle-main { padding: 2rem 2rem; }
        }
        @media (min-width: 1280px) {
          .raffle-main { padding: 2rem 3rem; }
        }
      `}</style>

      {/* ═══ AMBIENT PARTICLES ═══ */}
      <div className="ambient-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="ambient-particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${3 + Math.random() * 5}px`,
              height: `${3 + Math.random() * 5}px`,
              background: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#DC2626" : "#a78bfa",
              "--dur": `${8 + Math.random() * 12}s`,
              "--delay": `${Math.random() * 10}s`,
              "--drift": `${-40 + Math.random() * 80}px`,
              "--opacity": `${0.15 + Math.random() * 0.25}`,
            }}
          />
        ))}
      </div>

      <div className={`raffle-content ${presentationMode ? "presentation-mode" : ""}`}>
        {/* ═══ DEBUG PANEL ═══ */}
        {showDebug && isAdmin && (
          <div className="debug-panel">
            <div className="debug-header">
              <span>🔧 DEBUG PANEL</span>
              <button
                onClick={() => setShowDebug(false)}
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "none",
                  color: "#000",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            <div className="debug-body">
              {/* Winning Number */}
              <div className="debug-section" style={{ background: "rgba(88,28,135,0.2)" }}>
                <div style={{ color: "#c084fc", fontWeight: 700, marginBottom: 4 }}>
                  TARGET NUMBER:
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "1.5rem",
                    color: "#FFD700",
                    letterSpacing: "0.2em",
                  }}
                >
                  {drawingData?.revealedDigits
                    ? drawingData.revealedDigits.padEnd(totalDigits, "?")
                    : "?".repeat(totalDigits)}
                </div>
                {drawingData?.winningNumber && (
                  <div style={{ color: "#4ade80", marginTop: 4 }}>
                    Final: {drawingData.winningNumber.toString().padStart(totalDigits, "0")}
                  </div>
                )}
              </div>

              {/* Pending Eliminations */}
              {pendingEliminations && (
                <div
                  className="debug-section"
                  style={{
                    background: "rgba(127,29,29,0.25)",
                    border: "1px solid rgba(220,38,38,0.4)",
                  }}
                >
                  <div style={{ color: "#fca5a5", fontWeight: 700, marginBottom: 4 }}>
                    ELIMINATING (Digit #{pendingEliminations.digitIndex} ={" "}
                    {pendingEliminations.digitValue}):
                  </div>
                  <div style={{ color: "#fff" }}>
                    Pattern:{" "}
                    <span style={{ fontFamily: "monospace", color: "#FFD700" }}>
                      {pendingEliminations.pattern.padEnd(totalDigits, "_")}
                    </span>
                  </div>
                  <div style={{ color: "#fecaca", marginTop: 4 }}>
                    {pendingEliminations.count} participant(s):
                  </div>
                  <ul style={{ color: "#fee2e2", marginLeft: 8, marginTop: 4 }}>
                    {pendingEliminations.names.map((name, i) => (
                      <li key={i}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Elimination Log */}
              {debugLog.length > 0 && (
                <div className="debug-section">
                  <div
                    style={{
                      color: "#d1d5db",
                      fontWeight: 700,
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>ELIMINATION LOG:</span>
                    <button
                      onClick={() => setDebugLog([])}
                      style={{
                        color: "#6b7280",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div style={{ maxHeight: 150, overflowY: "auto" }}>
                    {debugLog.map((log, i) => (
                      <div
                        key={i}
                        style={{
                          borderLeft: "2px solid #FFD700",
                          paddingLeft: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ color: "#9ca3af" }}>{log.time}</div>
                        <div style={{ color: "#fff" }}>
                          Digit #{log.digit}:{" "}
                          <span
                            style={{
                              color: "#FFD700",
                              fontFamily: "monospace",
                            }}
                          >
                            {log.value}
                          </span>{" "}
                          → Pattern:{" "}
                          <span
                            style={{
                              fontFamily: "monospace",
                              color: "#4ade80",
                            }}
                          >
                            {log.pattern}
                          </span>
                        </div>
                        {log.eliminated.length > 0 ? (
                          <div style={{ color: "#f87171" }}>
                            Eliminated: {log.eliminated.join(", ")}
                          </div>
                        ) : (
                          <div style={{ color: "#6b7280" }}>No eliminations</div>
                        )}
                        <div style={{ color: "#60a5fa" }}>Remaining: {log.remainingCount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants Summary */}
              <div className="debug-section">
                <div style={{ color: "#d1d5db", fontWeight: 700, marginBottom: 4 }}>
                  PARTICIPANTS:
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <span style={{ color: "#4ade80" }}>
                    Eligible: {eligibleParticipants.filter((p) => p.isStillEligible).length}
                  </span>
                  <span style={{ color: "#f87171" }}>
                    Eliminated: {eliminatedParticipants.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug toggle */}
        {!showDebug && isAdmin && (
          <button className="debug-toggle" onClick={() => setShowDebug(true)}>
            🔧 Debug
          </button>
        )}

        {/* ═══ ERROR TOAST ═══ */}
        {error && drawingData && (
          <div className="error-toast">
            <div style={{ fontSize: "1.25rem" }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600 }}>Error</p>
              <p style={{ fontSize: "0.9rem", opacity: 0.9 }}>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                fontSize: "1.1rem",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ═══ HEADER ═══ */}
        <div className="raffle-header">
          <div className="raffle-header-inner">
            <Link
              to={`/raffle/${raffleId}`}
              style={{
                color: "#9ca3af",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>

            <div className="raffle-title-group">
              <Trophy className="w-7 h-7 text-yellow-400" style={{ color: "#FFD700" }} />
              <span className="raffle-title">{drawingData?.name}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {isAdmin && (
                <button
                  className={`btn-presentation ${presentationMode ? "active" : ""}`}
                  onClick={() => setPresentationMode(!presentationMode)}
                >
                  <Monitor className="w-4 h-4" />
                  {presentationMode ? "Exit Present" : "Present"}
                </button>
              )}
              <span style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
                {drawingData?.totalTicketsSold} tickets
              </span>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="raffle-main">
          {/* Prize Carousel */}
          {drawingData?.prizes?.length > 0 && (
            <PrizeCarousel prizes={drawingData.prizes} />
          )}

          {/* Flip Panels */}
          <div className="flip-panels-row">
            {getRevealedDigits().map((digit, index) => (
              <FlipPanel
                key={index}
                index={index}
                digit={digit}
                isRevealing={revealingIndex === index}
                onRevealComplete={revealingIndex === index ? handleFlipComplete : undefined}
              />
            ))}
          </div>

          {/* Progress */}
          {drawingData?.status === "Drawing" && (
            <div className="progress-section">
              <p className="progress-text">
                Digit <strong style={{ color: "#FFD700" }}>{digitsRevealed}</strong> of{" "}
                <strong>{totalDigits}</strong> revealed
              </p>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(digitsRevealed / totalDigits) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Winner Announcement (inline fallback, also triggers overlay) */}
          {drawingData?.status === "Completed" && winner && showWinnerOverlay && (
            <WinnerOverlay
              winner={winner}
              grandPrize={grandPrize}
              totalDigits={totalDigits}
              winningNumber={drawingData.winningNumber}
              onClose={() => setShowWinnerOverlay(false)}
            />
          )}

          {/* Simple winner banner when overlay is dismissed or not yet shown */}
          {drawingData?.status === "Completed" && winner && !showWinnerOverlay && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(220,38,38,0.1))",
                border: "2px solid rgba(255,215,0,0.4)",
                borderRadius: "1.5rem",
                padding: "2rem",
                textAlign: "center",
                marginBottom: "1.5rem",
                cursor: "pointer",
              }}
              onClick={() => setShowWinnerOverlay(true)}
            >
              <Trophy
                className="mx-auto mb-3"
                style={{ width: 48, height: 48, color: "#FFD700", fill: "#FFD700" }}
              />
              <h3
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: "#FFD700",
                  marginBottom: "0.5rem",
                }}
              >
                🎉 WINNER: {winner.name} 🎉
              </h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem" }}>
                Ticket #{drawingData.winningNumber?.toString().padStart(totalDigits, "0")} •
                Click to replay announcement
              </p>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="admin-panel">
              <h3 className="admin-title">
                <Users className="w-5 h-5" />
                Admin Controls
              </h3>

              {drawingData?.status === "Active" && (
                <button onClick={handleStartDrawing} className="btn-start">
                  <Play className="w-5 h-5" />
                  Start Drawing
                </button>
              )}

              {drawingData?.status === "Drawing" && !allDigitsRevealed && (
                <div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.9rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Click to reveal the next digit of the winning number:
                  </p>
                  <button
                    onClick={handleRevealNext}
                    disabled={
                      revealingIndex !== -1 || Object.keys(animatingParticipants).length > 0
                    }
                    className="btn-reveal"
                  >
                    <Sparkles className="w-6 h-6" />
                    Reveal Next Digit
                    {(revealingIndex !== -1 ||
                      Object.keys(animatingParticipants).length > 0) && (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ marginLeft: 8 }} />
                    )}
                  </button>
                </div>
              )}

              {(drawingData?.status === "Drawing" || drawingData?.status === "Completed") && (
                <button onClick={handleResetDrawing} className="btn-reset">
                  <RotateCcw className="w-4 h-4" />
                  Reset Drawing
                </button>
              )}
            </div>
          )}

          {/* Participants — Eligible */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="section-eligible">
              <div className="section-header">
                <h3 className="section-title section-title-eligible">
                  <Ticket style={{ width: 22, height: 22 }} />
                  {drawingData?.status === "Completed" ? "Final" : "Possible Winners"}
                </h3>
                <div className="section-counts">
                  <AnimatedCounter
                    value={displayedCounts.people}
                    label="people"
                    color="text-green-300"
                  />
                  <AnimatedCounter
                    value={displayedCounts.tickets}
                    label="tickets"
                    color="text-yellow-400"
                  />
                </div>
              </div>
              <div className="participants-grid">
                {eligibleParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.participantId}
                    participant={participant}
                    animationStage={animatingParticipants[participant.participantId]}
                    isInEliminatedSection={false}
                    totalDigits={totalDigits}
                    size="normal"
                    survived={survivedIds.has(participant.participantId)}
                  />
                ))}
                {eligibleParticipants.length === 0 && (
                  <p style={{ color: "#6b7280", fontSize: "1rem" }}>No participants yet</p>
                )}
              </div>
            </div>

            {/* Eliminated */}
            {eliminatedParticipants.length > 0 && (
              <div className="section-eliminated">
                <div className="section-header">
                  <h3 className="section-title section-title-eliminated">
                    <XCircle style={{ width: 16, height: 16 }} />
                    Eliminated
                  </h3>
                  <span style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                    {eliminatedParticipants.length} people
                  </span>
                </div>
                <div className="participants-grid participants-grid-sm">
                  {eliminatedParticipants.map((participant) => (
                    <ParticipantCard
                      key={participant.participantId}
                      participant={participant}
                      animationStage={
                        recentlyMovedIds.has(participant.participantId) ? "entered" : null
                      }
                      isInEliminatedSection={true}
                      totalDigits={totalDigits}
                      size="small"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* All Prizes (bottom grid) */}
          {drawingData?.prizes?.length > 1 && (
            <div style={{ marginTop: "2rem" }}>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: "1rem",
                }}
              >
                <Gift style={{ width: 22, height: 22, color: "#ec4899" }} />
                All Prizes
              </h3>
              <div className="prizes-grid">
                {drawingData.prizes.map((prize) => (
                  <div
                    key={prize.prizeId}
                    className={`prize-card ${prize.isGrandPrize ? "grand" : ""}`}
                  >
                    <div className="prize-thumb">
                      {prize.imageUrl ? (
                        <img src={getAssetUrl(prize.imageUrl)} alt={prize.name} />
                      ) : (
                        <div className="prize-thumb-placeholder">
                          <Gift style={{ width: 28, height: 28, color: "#6b7280" }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <h4 style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>
                          {prize.name}
                        </h4>
                        {prize.isGrandPrize && (
                          <Star
                            style={{
                              width: 16,
                              height: 16,
                              color: "#FFD700",
                              fill: "#FFD700",
                            }}
                          />
                        )}
                      </div>
                      {prize.value && (
                        <p style={{ fontSize: "0.9rem", color: "#4ade80", fontWeight: 600 }}>
                          ${prize.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
