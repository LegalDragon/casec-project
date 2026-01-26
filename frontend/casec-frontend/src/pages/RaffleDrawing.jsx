import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { rafflesAPI, getAssetUrl } from "../services/api";

// Flip Panel Component - Airport/Train station style
function FlipPanel({ digit, isRevealing, onRevealComplete }) {
  const [currentDigit, setCurrentDigit] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDigit, setFlipDigit] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Reset animation flag when digit changes to null (reset drawing)
    if (digit === null) {
      hasAnimated.current = false;
      setCurrentDigit(null);
      return;
    }

    // Animate if we're revealing AND haven't animated this digit yet
    if (isRevealing && digit !== null && !hasAnimated.current && !isFlipping) {
      hasAnimated.current = true;
      animateFlip(digit);
    } else if (digit !== null && currentDigit === null && !isRevealing) {
      // Already revealed digit (page load), just show it without animation
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
    onRevealComplete?.();
  };

  const displayDigit = isFlipping ? flipDigit : currentDigit;

  return (
    <div className="relative w-16 h-24 md:w-24 md:h-36 perspective-1000">
      <div className="absolute inset-0 bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gray-800 flex items-end justify-center overflow-hidden border-b border-gray-700">
          <span
            className={`text-5xl md:text-7xl font-mono font-bold text-yellow-400 transform translate-y-1/2 ${
              isFlipping ? "animate-pulse" : ""
            }`}
          >
            {displayDigit !== null ? displayDigit : "?"}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gray-900 flex items-start justify-center overflow-hidden">
          <span
            className={`text-5xl md:text-7xl font-mono font-bold text-yellow-400 transform -translate-y-1/2 ${
              isFlipping ? "animate-pulse" : ""
            }`}
          >
            {displayDigit !== null ? displayDigit : "?"}
          </span>
        </div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 transform -translate-y-1/2" />
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-600" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-600" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gray-600" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gray-600" />
      </div>
    </div>
  );
}

// Participant Card Component with multi-stage elimination animation
function ParticipantCard({
  participant,
  animationStage, // null, "shake", "shrink", "exit", "entered"
  isInEliminatedSection,
  totalDigits,
  size = "normal", // "normal" or "small"
}) {
  const isSmall = size === "small";

  const getAnimationClasses = () => {
    if (animationStage === "shake") {
      return "animate-shake grayscale";
    }
    if (animationStage === "shrink") {
      return "scale-50 opacity-0 grayscale";
    }
    if (animationStage === "exit") {
      return "scale-0 opacity-0";
    }
    if (animationStage === "entered") {
      return "animate-pop-in";
    }
    if (isInEliminatedSection) {
      return "opacity-60 grayscale";
    }
    return "";
  };

  return (
    <div
      className={`flex flex-col items-center transition-all duration-500 ${getAnimationClasses()} ${
        isSmall ? "gap-0.5" : "gap-1"
      }`}
    >
      <div className="relative">
        {/* Avatar */}
        <div className={`relative ${isSmall ? "w-8 h-8" : "w-16 h-16"}`}>
          {participant.avatarUrl ? (
            <img
              src={getAssetUrl(participant.avatarUrl)}
              alt={participant.name}
              className={`w-full h-full rounded-full object-cover border-2 border-white shadow-lg ${
                isSmall ? "border" : "border-2"
              }`}
            />
          ) : (
            <div
              className={`w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold border-white shadow-lg ${
                isSmall ? "text-xs border" : "text-lg border-2"
              }`}
            >
              {participant.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Ticket count badge - only show on normal size */}
          {!isSmall && (
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.5rem] text-center">
              {participant.totalTickets}
            </div>
          )}

          {/* Winner crown */}
          {participant.isWinner && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Trophy
                className={`text-yellow-400 fill-yellow-400 animate-bounce ${
                  isSmall ? "w-4 h-4" : "w-6 h-6"
                }`}
              />
            </div>
          )}

          {/* Elimination overlay */}
          {animationStage === "shake" && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 rounded-full">
              <XCircle
                className={`text-red-500 animate-pulse ${
                  isSmall ? "w-5 h-5" : "w-10 h-10"
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <span
        className={`font-medium truncate ${
          isSmall
            ? "text-[10px] max-w-8 text-gray-500"
            : "text-xs max-w-16 " + (isInEliminatedSection ? "text-gray-500" : "text-white")
        }`}
      >
        {participant.name.split(" ")[0]}
      </span>

      {/* Ticket range - only show if not in eliminated section and not small */}
      {!isInEliminatedSection && !isSmall && (
        <span className="text-gray-500 text-xs font-mono">
          {participant.ticketStart?.toString().padStart(totalDigits, "0")}-
          {participant.ticketEnd?.toString().padStart(totalDigits, "0")}
        </span>
      )}
    </div>
  );
}

export default function RaffleDrawing() {
  const { raffleId } = useParams();
  const [drawingData, setDrawingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealingIndex, setRevealingIndex] = useState(-1);
  const [isAdmin, setIsAdmin] = useState(false);

  // Animation tracking
  const [animatingParticipants, setAnimatingParticipants] = useState({}); // {participantId: stage}
  const [previousEligibleIds, setPreviousEligibleIds] = useState(new Set());
  const [recentlyMovedIds, setRecentlyMovedIds] = useState(new Set()); // For "pop in" animation

  // Debug state
  const [debugLog, setDebugLog] = useState([]);
  const [showDebug, setShowDebug] = useState(true);
  const [pendingEliminations, setPendingEliminations] = useState(null); // {names, reason, digitIndex, digitValue}

  // Store pending elimination IDs to run after flip animation completes
  const pendingEliminationIds = useRef([]);
  const [flipAnimationComplete, setFlipAnimationComplete] = useState(false);

  // Track if a reveal sequence is in progress (from button click until all animations complete)
  const [isRevealInProgress, setIsRevealInProgress] = useState(false);

  // Displayed counts (updated after animation completes)
  const [displayedCounts, setDisplayedCounts] = useState({ people: 0, tickets: 0 });

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

      // Find newly eliminated
      const newlyEliminated = [];
      previousEligibleIds.forEach((id) => {
        if (!currentEligibleIds.has(id)) {
          newlyEliminated.push(id);
        }
      });

      if (newlyEliminated.length > 0) {
        // Get names of eliminated participants
        const eliminatedNames = drawingData.participants
          .filter((p) => newlyEliminated.includes(p.participantId))
          .map((p) => `${p.name} (${p.ticketStart}-${p.ticketEnd})`);

        const digitIndex = (drawingData.revealedDigits?.length || 1) - 1;
        const revealedDigit = drawingData.revealedDigits?.[digitIndex] || "?";
        const pattern = drawingData.revealedDigits || "";

        // Show pending eliminations summary in debug panel
        setPendingEliminations({
          names: eliminatedNames,
          digitIndex: digitIndex + 1,
          digitValue: revealedDigit,
          pattern: pattern,
          count: newlyEliminated.length,
        });

        // Add to debug log
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

        // Store elimination IDs - will be triggered after flip animation completes
        pendingEliminationIds.current = newlyEliminated;
        setFlipAnimationComplete(false);
      }

      setPreviousEligibleIds(currentEligibleIds);
    }
  }, [drawingData?.revealedDigits]);

  // Initialize displayed counts when data first loads or when no animation is pending
  useEffect(() => {
    // Only update counts if NOT in a reveal sequence
    if (drawingData?.participants && !isRevealInProgress && Object.keys(animatingParticipants).length === 0) {
      const eligible = drawingData.participants.filter(p => p.isStillEligible);
      setDisplayedCounts({
        people: eligible.length,
        tickets: eligible.reduce((sum, p) => sum + (p.totalTickets || 0), 0)
      });
    }
  }, [drawingData?.participants, animatingParticipants, isRevealInProgress]);

  // Run elimination animation when flip animation completes
  useEffect(() => {
    if (flipAnimationComplete) {
      if (pendingEliminationIds.current.length > 0) {
        const idsToAnimate = [...pendingEliminationIds.current];
        pendingEliminationIds.current = [];
        runEliminationAnimation(idsToAnimate);
      } else {
        // No eliminations for this digit, mark reveal as complete
        setIsRevealInProgress(false);
      }
    }
  }, [flipAnimationComplete]);

  // Callback when flip panel animation completes
  const handleFlipComplete = () => {
    setFlipAnimationComplete(true);
  };

  const runEliminationAnimation = async (participantIds) => {
    // Brief pause before starting elimination animation
    await new Promise((r) => setTimeout(r, 300));

    // Stage 1: Shake + gray (1 second)
    setAnimatingParticipants((prev) => {
      const next = { ...prev };
      participantIds.forEach((id) => (next[id] = "shake"));
      return next;
    });

    await new Promise((r) => setTimeout(r, 1000));

    // Stage 2: Shrink (0.5 seconds)
    setAnimatingParticipants((prev) => {
      const next = { ...prev };
      participantIds.forEach((id) => (next[id] = "shrink"));
      return next;
    });

    await new Promise((r) => setTimeout(r, 500));

    // Stage 3: Exit (remove from animating, they're now in eliminated section)
    setAnimatingParticipants((prev) => {
      const next = { ...prev };
      participantIds.forEach((id) => delete next[id]);
      return next;
    });

    // Clear pending eliminations
    setPendingEliminations(null);

    // Update displayed counts after animation completes
    if (drawingData?.participants) {
      const eligible = drawingData.participants.filter(p => p.isStillEligible);
      setDisplayedCounts({
        people: eligible.length,
        tickets: eligible.reduce((sum, p) => sum + (p.totalTickets || 0), 0)
      });
    }

    // Mark reveal sequence as complete
    setIsRevealInProgress(false);

    // Mark as recently moved for pop-in animation in eliminated section
    setRecentlyMovedIds(new Set(participantIds));

    // Clear the pop-in animation after it completes
    setTimeout(() => {
      setRecentlyMovedIds(new Set());
    }, 500);
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
          setPreviousEligibleIds(
            new Set(eligible.map((p) => p.participantId))
          );
          // Initialize displayed counts when drawing starts
          setDisplayedCounts({
            people: eligible.length,
            tickets: eligible.reduce((sum, p) => sum + (p.totalTickets || 0), 0)
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
    setIsRevealInProgress(true); // Mark reveal sequence as started

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

  // Participants currently eligible OR animating out (still shown in eligible section during animation)
  const eligibleParticipants =
    drawingData?.participants?.filter(
      (p) => p.isStillEligible || animatingParticipants[p.participantId]
    ) || [];

  // Participants that are eliminated AND not currently animating
  const eliminatedParticipants =
    drawingData?.participants?.filter(
      (p) => !p.isStillEligible && !animatingParticipants[p.participantId]
    ) || [];

  const digitsRevealed = drawingData?.revealedDigits?.length || 0;
  const totalDigits = drawingData?.ticketDigits || 6;
  const allDigitsRevealed = digitsRevealed >= totalDigits;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (error && !drawingData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const winner = drawingData?.participants?.find((p) => p.isWinner);
  const grandPrize =
    drawingData?.prizes?.find((p) => p.isGrandPrize) || drawingData?.prizes?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* Custom animation styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out 2;
        }
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        .animate-pop-in {
          animation: pop-in 0.4s ease-out forwards;
        }
      `}</style>

      {/* Debug Panel - Floating */}
      {showDebug && isAdmin && (
        <div className="fixed bottom-4 left-4 z-50 bg-gray-900/95 border border-yellow-500/50 rounded-lg shadow-2xl max-w-md max-h-[60vh] overflow-hidden flex flex-col">
          <div className="bg-yellow-500 text-black px-3 py-2 font-bold text-sm flex justify-between items-center">
            <span>DEBUG PANEL</span>
            <button onClick={() => setShowDebug(false)} className="hover:bg-yellow-600 px-2 rounded">✕</button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto text-xs">
            {/* Winning Number Display */}
            <div className="bg-purple-900/50 rounded p-2">
              <div className="text-purple-300 font-bold mb-1">TARGET NUMBER:</div>
              <div className="font-mono text-2xl text-yellow-400 tracking-widest">
                {drawingData?.revealedDigits
                  ? drawingData.revealedDigits.padEnd(totalDigits, '?')
                  : '?'.repeat(totalDigits)}
              </div>
              {drawingData?.winningNumber && (
                <div className="text-green-400 mt-1">
                  Final: {drawingData.winningNumber.toString().padStart(totalDigits, '0')}
                </div>
              )}
            </div>

            {/* Pending Eliminations Alert */}
            {pendingEliminations && (
              <div className="bg-red-900/50 border border-red-500 rounded p-2 animate-pulse">
                <div className="text-red-300 font-bold mb-1">
                  ELIMINATING (Digit #{pendingEliminations.digitIndex} = {pendingEliminations.digitValue}):
                </div>
                <div className="text-white">
                  Pattern: <span className="font-mono text-yellow-400">{pendingEliminations.pattern.padEnd(totalDigits, '_')}</span>
                </div>
                <div className="text-red-200 mt-1">
                  {pendingEliminations.count} participant(s):
                </div>
                <ul className="text-red-100 ml-2 mt-1">
                  {pendingEliminations.names.map((name, i) => (
                    <li key={i}>• {name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Elimination Log */}
            {debugLog.length > 0 && (
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-300 font-bold mb-1 flex justify-between">
                  <span>ELIMINATION LOG:</span>
                  <button
                    onClick={() => setDebugLog([])}
                    className="text-gray-500 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {debugLog.map((log, i) => (
                    <div key={i} className="border-l-2 border-yellow-500 pl-2 py-1">
                      <div className="text-gray-400">{log.time}</div>
                      <div className="text-white">
                        Digit #{log.digit}: <span className="text-yellow-400 font-mono">{log.value}</span>
                        {' '}→ Pattern: <span className="font-mono text-green-400">{log.pattern}</span>
                      </div>
                      {log.eliminated.length > 0 ? (
                        <div className="text-red-400">
                          Eliminated: {log.eliminated.join(', ')}
                        </div>
                      ) : (
                        <div className="text-gray-500">No eliminations</div>
                      )}
                      <div className="text-blue-400">
                        Remaining: {log.remainingCount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants Summary */}
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-300 font-bold mb-1">PARTICIPANTS:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-green-400">
                  Eligible: {eligibleParticipants.filter(p => p.isStillEligible).length}
                </div>
                <div className="text-red-400">
                  Eliminated: {eliminatedParticipants.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Toggle Button (when panel is hidden) */}
      {!showDebug && isAdmin && (
        <button
          onClick={() => setShowDebug(true)}
          className="fixed bottom-4 left-4 z-50 bg-yellow-500 text-black px-3 py-2 rounded-lg font-bold text-sm hover:bg-yellow-400"
        >
          Show Debug
        </button>
      )}

      {/* Error Toast */}
      {error && drawingData && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <div className="text-lg">⚠️</div>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to={`/raffle/${raffleId}`}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="text-white font-bold text-lg">
              {drawingData?.name}
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            {drawingData?.totalTicketsSold} tickets
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Prize Display */}
        {grandPrize && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Star className="w-4 h-4 fill-current" />
              GRAND PRIZE
              <Star className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {grandPrize.name}
            </h2>
            {grandPrize.value && (
              <p className="text-yellow-400 text-xl">
                Value: ${grandPrize.value.toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Flip Panels */}
        <div className="flex justify-center items-center gap-2 md:gap-4 mb-8">
          {getRevealedDigits().map((digit, index) => (
            <FlipPanel
              key={index}
              digit={digit}
              isRevealing={revealingIndex === index}
              onRevealComplete={revealingIndex === index ? handleFlipComplete : undefined}
            />
          ))}
        </div>

        {/* Progress indicator */}
        {drawingData?.status === "Drawing" && (
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm">
              Digit {digitsRevealed} of {totalDigits} revealed
            </p>
            <div className="w-full max-w-xs mx-auto h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${(digitsRevealed / totalDigits) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Winner Announcement */}
        {drawingData?.status === "Completed" && winner && (
          <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-2xl p-8 mb-8 text-center animate-pulse">
            <Trophy className="w-16 h-16 mx-auto text-yellow-900 mb-4" />
            <h3 className="text-3xl font-bold text-yellow-900 mb-2">
              🎉 WINNER! 🎉
            </h3>
            <div className="flex justify-center mb-4">
              <ParticipantCard
                participant={winner}
                totalDigits={totalDigits}
                isInEliminatedSection={false}
              />
            </div>
            <p className="text-2xl font-bold text-yellow-900">{winner.name}</p>
            <p className="text-yellow-800">
              Ticket #{drawingData.winningNumber?.toString().padStart(totalDigits, "0")}
            </p>
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Admin Controls
            </h3>

            {drawingData?.status === "Active" && (
              <button
                onClick={handleStartDrawing}
                className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 flex items-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Drawing
              </button>
            )}

            {drawingData?.status === "Drawing" && !allDigitsRevealed && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm mb-2">
                  Click to reveal the next digit of the winning number:
                </p>
                <button
                  onClick={handleRevealNext}
                  disabled={revealingIndex !== -1 || Object.keys(animatingParticipants).length > 0}
                  className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 shadow-lg hover:shadow-yellow-400/30"
                >
                  <Sparkles className="w-6 h-6" />
                  Reveal Next Digit
                  {(revealingIndex !== -1 || Object.keys(animatingParticipants).length > 0) && (
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  )}
                </button>
              </div>
            )}

            {(drawingData?.status === "Drawing" ||
              drawingData?.status === "Completed") && (
              <button
                onClick={handleResetDrawing}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Drawing
              </button>
            )}
          </div>
        )}

        {/* Participants Section */}
        <div className="space-y-4">
          {/* Possible Winners */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Possible Winners
              </h3>
              <div className="flex gap-4 text-sm">
                <span className="text-green-300">
                  <span className="font-bold">{displayedCounts.people}</span> people
                </span>
                <span className="text-yellow-400">
                  <span className="font-bold">{displayedCounts.tickets}</span> tickets
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 min-h-[100px]">
              {eligibleParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.participantId}
                  participant={participant}
                  animationStage={animatingParticipants[participant.participantId]}
                  isInEliminatedSection={false}
                  totalDigits={totalDigits}
                  size="normal"
                />
              ))}
              {eligibleParticipants.length === 0 && (
                <p className="text-gray-500 text-sm">No participants yet</p>
              )}
            </div>
          </div>

          {/* Eliminated - Below, smaller */}
          {eliminatedParticipants.length > 0 && (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Eliminated
                </h3>
                <span className="text-xs text-gray-600">
                  {eliminatedParticipants.length} people
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {eliminatedParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.participantId}
                    participant={participant}
                    animationStage={
                      recentlyMovedIds.has(participant.participantId)
                        ? "entered"
                        : null
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

        {/* All Prizes */}
        {drawingData?.prizes?.length > 1 && (
          <div className="mt-8 bg-gray-800/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-400" />
              All Prizes
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drawingData.prizes.map((prize) => (
                <div
                  key={prize.prizeId}
                  className={`rounded-xl p-4 ${
                    prize.isGrandPrize
                      ? "bg-yellow-400/20 border border-yellow-400/50"
                      : "bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {prize.imageUrl ? (
                      <img
                        src={getAssetUrl(prize.imageUrl)}
                        alt={prize.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                        <Gift className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{prize.name}</h4>
                        {prize.isGrandPrize && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      {prize.value && (
                        <p className="text-sm text-green-400">
                          ${prize.value.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
