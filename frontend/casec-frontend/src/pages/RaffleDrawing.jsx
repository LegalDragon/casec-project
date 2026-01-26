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
} from "lucide-react";
import { rafflesAPI, getAssetUrl } from "../services/api";

// Flip Panel Component - Airport/Train station style
function FlipPanel({ digit, isRevealing, onRevealComplete }) {
  const [currentDigit, setCurrentDigit] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDigit, setFlipDigit] = useState(0);

  useEffect(() => {
    if (isRevealing && digit !== null) {
      animateFlip(digit);
    }
  }, [isRevealing, digit]);

  const animateFlip = async (targetDigit) => {
    setIsFlipping(true);
    const startDigit = currentDigit ?? 0;
    const steps = 15 + Math.floor(Math.random() * 10); // Random number of flips for effect
    const baseDelay = 50;

    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay + i * 5));
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
      {/* Background panel */}
      <div className="absolute inset-0 bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        {/* Top half */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gray-800 flex items-end justify-center overflow-hidden border-b border-gray-700">
          <span
            className={`text-5xl md:text-7xl font-mono font-bold text-yellow-400 transform translate-y-1/2 ${
              isFlipping ? "animate-pulse" : ""
            }`}
          >
            {displayDigit !== null ? displayDigit : "?"}
          </span>
        </div>
        {/* Bottom half */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gray-900 flex items-start justify-center overflow-hidden">
          <span
            className={`text-5xl md:text-7xl font-mono font-bold text-yellow-400 transform -translate-y-1/2 ${
              isFlipping ? "animate-pulse" : ""
            }`}
          >
            {displayDigit !== null ? displayDigit : "?"}
          </span>
        </div>
        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 transform -translate-y-1/2" />
        {/* Screws */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-600" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-600" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gray-600" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gray-600" />
      </div>
    </div>
  );
}

// Participant Avatar Component
function ParticipantAvatar({ participant, isEliminated, size = "md" }) {
  const sizeClasses = {
    sm: "w-12 h-12 text-xs",
    md: "w-16 h-16 text-sm",
    lg: "w-20 h-20 text-base",
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} transition-all duration-500 ${
        isEliminated ? "opacity-30 grayscale scale-90" : "opacity-100"
      }`}
    >
      {participant.avatarUrl ? (
        <img
          src={getAssetUrl(participant.avatarUrl)}
          alt={participant.name}
          className="w-full h-full rounded-full object-cover border-2 border-white shadow-lg"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">
          {participant.name.charAt(0).toUpperCase()}
        </div>
      )}
      {/* Ticket count badge */}
      <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.5rem] text-center">
        {participant.totalTickets}
      </div>
      {/* Winner crown */}
      {participant.isWinner && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Trophy className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce" />
        </div>
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
  const pollInterval = useRef(null);

  useEffect(() => {
    loadDrawingData();
    // Check if user is admin
    const authData = localStorage.getItem("casec-auth");
    if (authData) {
      const { user } = JSON.parse(authData).state;
      setIsAdmin(user?.isAdmin);
    }

    // Poll for updates
    pollInterval.current = setInterval(loadDrawingData, 3000);
    return () => clearInterval(pollInterval.current);
  }, [raffleId]);

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
        loadDrawingData();
      } else {
        setError(response.message || "Failed to start drawing");
      }
    } catch (err) {
      // err is already error.response?.data from the axios interceptor
      const errorMsg = typeof err === 'string' ? err : (err?.message || "Failed to start drawing");
      setError(errorMsg);
    }
  };

  const handleRevealDigit = async (digit) => {
    const currentIndex = drawingData?.revealedDigits?.length || 0;
    setRevealingIndex(currentIndex);
    try {
      const response = await rafflesAPI.revealDigit(raffleId, digit);
      if (response.success) {
        // Small delay to let animation complete
        setTimeout(() => {
          loadDrawingData();
          setRevealingIndex(-1);
        }, 2000);
      } else {
        setError(response.message || "Failed to reveal digit");
        setRevealingIndex(-1);
      }
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || "Failed to reveal digit");
      setError(errorMsg);
      setRevealingIndex(-1);
    }
  };

  const handleResetDrawing = async () => {
    if (!confirm("Are you sure you want to reset the drawing?")) return;
    try {
      const response = await rafflesAPI.resetDrawing(raffleId);
      if (response.success) {
        loadDrawingData();
      } else {
        setError(response.message || "Failed to reset drawing");
      }
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || "Failed to reset drawing");
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

  const eligibleParticipants = drawingData?.participants?.filter(
    (p) => p.isStillEligible
  ) || [];
  const eliminatedParticipants = drawingData?.participants?.filter(
    (p) => !p.isStillEligible
  ) || [];

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
  const grandPrize = drawingData?.prizes?.find((p) => p.isGrandPrize) || drawingData?.prizes?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* Error Toast */}
      {error && drawingData && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-pulse">
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
            />
          ))}
        </div>

        {/* Winner Announcement */}
        {drawingData?.status === "Completed" && winner && (
          <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-2xl p-8 mb-8 text-center animate-pulse">
            <Trophy className="w-16 h-16 mx-auto text-yellow-900 mb-4" />
            <h3 className="text-3xl font-bold text-yellow-900 mb-2">
              WINNER!
            </h3>
            <div className="flex justify-center mb-4">
              <ParticipantAvatar participant={winner} size="lg" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">{winner.name}</p>
            <p className="text-yellow-800">
              Ticket #{drawingData.winningNumber?.toString().padStart(6, "0")}
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
                className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Drawing
              </button>
            )}

            {drawingData?.status === "Drawing" && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm mb-2">
                  Select the next digit to reveal:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleRevealDigit(digit)}
                      disabled={revealingIndex !== -1}
                      className="w-12 h-12 bg-yellow-400 text-black font-bold text-xl rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(drawingData?.status === "Drawing" ||
              drawingData?.status === "Completed") && (
              <button
                onClick={handleResetDrawing}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Drawing
              </button>
            )}
          </div>
        )}

        {/* Participants Grid */}
        <div className="bg-gray-800/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-yellow-400" />
            Participants ({eligibleParticipants.length} still in /{" "}
            {drawingData?.participants?.length || 0} total)
          </h3>

          {/* Still Eligible */}
          {eligibleParticipants.length > 0 && (
            <div className="mb-6">
              <p className="text-green-400 text-sm font-medium mb-3">
                Still Eligible
              </p>
              <div className="flex flex-wrap gap-4">
                {eligibleParticipants.map((participant) => (
                  <div
                    key={participant.participantId}
                    className="flex flex-col items-center gap-1"
                  >
                    <ParticipantAvatar participant={participant} />
                    <span className="text-white text-xs font-medium truncate max-w-16">
                      {participant.name.split(" ")[0]}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {participant.ticketStart?.toString().padStart(6, "0")}-
                      {participant.ticketEnd?.toString().padStart(6, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eliminated */}
          {eliminatedParticipants.length > 0 && (
            <div>
              <p className="text-gray-500 text-sm font-medium mb-3">
                Eliminated
              </p>
              <div className="flex flex-wrap gap-4">
                {eliminatedParticipants.map((participant) => (
                  <div
                    key={participant.participantId}
                    className="flex flex-col items-center gap-1"
                  >
                    <ParticipantAvatar participant={participant} isEliminated />
                    <span className="text-gray-500 text-xs font-medium truncate max-w-16">
                      {participant.name.split(" ")[0]}
                    </span>
                  </div>
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
