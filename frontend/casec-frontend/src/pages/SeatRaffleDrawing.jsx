import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Volume2, VolumeX, RotateCcw, Trophy, Settings } from "lucide-react";
import { seatRafflesAPI } from "../services/api";

// Web Audio context for sound effects
let audioCtx = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

// Sound effect functions
const playTick = () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800 + Math.random() * 400;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

const playWinner = () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }, i * 150);
  });
};

// Confetti effect
const createConfetti = () => {
  const colors = ['#a855f7', '#ec4899', '#22c55e', '#fbbf24', '#3b82f6', '#ef4444'];
  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 1001;
      left: ${Math.random() * 100}vw;
      top: -10px;
      width: ${Math.random() * 12 + 6}px;
      height: ${Math.random() * 12 + 6}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation: confetti-fall ${Math.random() * 2 + 2}s linear forwards;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
};

// Add confetti animation to document
const style = document.createElement('style');
style.textContent = `
  @keyframes confetti-fall {
    to {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
`;
if (!document.querySelector('style[data-confetti]')) {
  style.setAttribute('data-confetti', 'true');
  document.head.appendChild(style);
}

// Background music hook
function useBackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);
  
  const startMusic = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const bassFreqs = [130.81, 146.83, 164.81, 174.61];
    const melodyFreqs = [523, 587, 659, 698, 784];
    let beatIndex = 0;
    
    intervalRef.current = setInterval(() => {
      // Bass drum
      if (beatIndex % 4 === 0 || beatIndex % 4 === 2) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 80;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
      
      // Hi-hat
      const noise = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.frequency.value = 8000 + Math.random() * 2000;
      noise.type = 'square';
      noiseGain.gain.setValueAtTime(0.05, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      noise.start();
      noise.stop(ctx.currentTime + 0.05);
      
      // Bass line
      if (beatIndex % 2 === 0) {
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.connect(bassGain);
        bassGain.connect(ctx.destination);
        bass.frequency.value = bassFreqs[Math.floor(beatIndex / 2) % bassFreqs.length];
        bass.type = 'sawtooth';
        bassGain.gain.setValueAtTime(0.08, ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        bass.start();
        bass.stop(ctx.currentTime + 0.2);
      }
      
      // Melody sparkles
      if (Math.random() > 0.6) {
        const melody = ctx.createOscillator();
        const melodyGain = ctx.createGain();
        melody.connect(melodyGain);
        melodyGain.connect(ctx.destination);
        melody.frequency.value = melodyFreqs[Math.floor(Math.random() * melodyFreqs.length)];
        melody.type = 'sine';
        melodyGain.gain.setValueAtTime(0.08, ctx.currentTime);
        melodyGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        melody.start();
        melody.stop(ctx.currentTime + 0.15);
      }
      
      beatIndex++;
    }, 180);
    
    setIsPlaying(true);
  }, []);
  
  const stopMusic = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);
  
  const toggleMusic = useCallback(() => {
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }, [isPlaying, startMusic, stopMusic]);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  return { isPlaying, toggleMusic, startMusic, stopMusic };
}

// Miramar Cultural Center seat layout configuration
const MIRAMAR_LAYOUT = {
  orchestra: {
    left: {
      // Rows D-W only, varying seat counts
      rows: [
        { label: 'D', seats: 7, start: 1 },
        { label: 'E', seats: 8, start: 1 },
        { label: 'F', seats: 8, start: 1 },
        { label: 'G', seats: 9, start: 1 },
        { label: 'H', seats: 9, start: 1 },
        { label: 'J', seats: 10, start: 1 },
        { label: 'K', seats: 10, start: 1 },
        { label: 'L', seats: 10, start: 1 },
        { label: 'M', seats: 11, start: 1 },
        { label: 'N', seats: 11, start: 1 },
        { label: 'P', seats: 11, start: 1 },
        { label: 'Q', seats: 11, start: 1 },
        { label: 'R', seats: 11, start: 1 },
        { label: 'S', seats: 11, start: 1 },
        { label: 'T', seats: 11, start: 1 },
        { label: 'U', seats: 11, start: 1 },
        { label: 'V', seats: 11, start: 1 },
        { label: 'W', seats: 11, start: 1 },
      ]
    },
    center: {
      // Rows A-W, A-B narrower, then expands
      rows: [
        { label: 'A', seats: 6, start: 105 },
        { label: 'B', seats: 8, start: 104 },
        { label: 'C', seats: 12, start: 102 },
        { label: 'D', seats: 14, start: 101 },
        { label: 'E', seats: 14, start: 101 },
        { label: 'F', seats: 14, start: 101 },
        { label: 'G', seats: 14, start: 101 },
        { label: 'H', seats: 14, start: 101 },
        { label: 'J', seats: 14, start: 101 },
        { label: 'K', seats: 14, start: 101 },
        { label: 'L', seats: 14, start: 101 },
        { label: 'M', seats: 14, start: 101 },
        { label: 'N', seats: 14, start: 101 },
        { label: 'P', seats: 14, start: 101 },
        { label: 'Q', seats: 14, start: 101 },
        { label: 'R', seats: 14, start: 101 },
        { label: 'S', seats: 10, start: 103 }, // Sound board area
        { label: 'T', seats: 10, start: 103 }, // Sound board area
        { label: 'U', seats: 14, start: 101 },
        { label: 'V', seats: 14, start: 101 },
        { label: 'W', seats: 14, start: 101 },
      ]
    },
    right: {
      // Mirror of left
      rows: [
        { label: 'D', seats: 7, start: 1 },
        { label: 'E', seats: 8, start: 1 },
        { label: 'F', seats: 8, start: 1 },
        { label: 'G', seats: 9, start: 1 },
        { label: 'H', seats: 9, start: 1 },
        { label: 'J', seats: 10, start: 1 },
        { label: 'K', seats: 10, start: 1 },
        { label: 'L', seats: 10, start: 1 },
        { label: 'M', seats: 11, start: 1 },
        { label: 'N', seats: 11, start: 1 },
        { label: 'P', seats: 11, start: 1 },
        { label: 'Q', seats: 11, start: 1 },
        { label: 'R', seats: 11, start: 1 },
        { label: 'S', seats: 11, start: 1 },
        { label: 'T', seats: 11, start: 1 },
        { label: 'U', seats: 11, start: 1 },
        { label: 'V', seats: 11, start: 1 },
        { label: 'W', seats: 11, start: 1 },
      ]
    }
  },
  balcony: {
    left: {
      rows: [
        { label: 'AA', seats: 8, start: 1 },
        { label: 'BB', seats: 8, start: 1 },
        { label: 'CC', seats: 8, start: 1 },
        { label: 'DD', seats: 8, start: 1 },
        { label: 'EE', seats: 8, start: 1 },
        { label: 'FF', seats: 8, start: 1 },
      ]
    },
    center: {
      rows: [
        { label: 'AA', seats: 14, start: 101 },
        { label: 'BB', seats: 14, start: 101 },
        { label: 'CC', seats: 14, start: 101 },
        { label: 'DD', seats: 14, start: 101 },
        { label: 'EE', seats: 14, start: 101 },
        { label: 'FF', seats: 14, start: 101 },
      ]
    },
    right: {
      rows: [
        { label: 'AA', seats: 8, start: 1 },
        { label: 'BB', seats: 8, start: 1 },
        { label: 'CC', seats: 8, start: 1 },
        { label: 'DD', seats: 8, start: 1 },
        { label: 'EE', seats: 8, start: 1 },
        { label: 'FF', seats: 8, start: 1 },
      ]
    }
  }
};

// Seat component
function Seat({ seatId, section, row, seatNum, isHighlighted, isWinner, isExcluded, attendeeName, onClick }) {
  let bgColor = 'bg-gray-600 border-gray-500';
  if (isExcluded) bgColor = 'bg-red-900/50 border-red-800';
  else if (isWinner) bgColor = 'bg-green-500 border-green-400';
  else if (isHighlighted) bgColor = 'bg-yellow-400 border-yellow-300';
  else if (attendeeName) bgColor = 'bg-purple-600 border-purple-500';
  
  return (
    <div
      onClick={onClick}
      className={`w-3 h-3 rounded-t-sm rounded-b cursor-pointer border transition-all duration-100
        ${bgColor}
        ${isHighlighted ? 'scale-150 shadow-lg shadow-yellow-400/50' : ''}
        ${isWinner ? 'scale-175 shadow-xl shadow-green-400/70 animate-pulse' : ''}
        hover:scale-125 hover:bg-indigo-500`}
      title={`${section} ${row}-${seatNum}${attendeeName ? `: ${attendeeName}` : ''}`}
    />
  );
}

// Section component
function Section({ title, sectionKey, rows, seats, highlightedSeat, winnerSeat, excludedSeats, onSeatClick }) {
  const maxSeats = Math.max(...rows.map(r => r.seats));
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="flex flex-col gap-0.5">
        {rows.map(row => {
          const rowSeats = [];
          const padding = Math.floor((maxSeats - row.seats) / 2);
          
          return (
            <div key={row.label} className="flex items-center gap-0.5">
              <span className="w-5 text-xs text-gray-500 text-right mr-1">{row.label}</span>
              {/* Left padding */}
              {padding > 0 && <div style={{ width: `${padding * 14}px` }} />}
              {/* Seats */}
              {Array.from({ length: row.seats }, (_, i) => {
                const seatNum = row.start + i;
                const seatId = `${sectionKey}-${row.label}-${seatNum}`;
                const seatData = seats?.[seatId];
                
                return (
                  <Seat
                    key={seatId}
                    seatId={seatId}
                    section={sectionKey}
                    row={row.label}
                    seatNum={seatNum}
                    isHighlighted={highlightedSeat === seatId}
                    isWinner={winnerSeat === seatId}
                    isExcluded={excludedSeats?.includes(seatId)}
                    attendeeName={seatData?.attendeeName}
                    onClick={() => onSeatClick?.(seatId, sectionKey, row.label, seatNum)}
                  />
                );
              })}
              {/* Right padding */}
              {padding > 0 && <div style={{ width: `${padding * 14}px` }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SeatRaffleDrawing() {
  const { raffleId } = useParams();
  const [loading, setLoading] = useState(true);
  const [raffle, setRaffle] = useState(null);
  const [seats, setSeats] = useState({});
  const [error, setError] = useState(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlightedSeat, setHighlightedSeat] = useState(null);
  const [winnerSeat, setWinnerSeat] = useState(null);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const { isPlaying, toggleMusic } = useBackgroundMusic();
  
  const allSeatIds = useRef([]);
  
  // Build all seat IDs from layout
  useEffect(() => {
    const ids = [];
    Object.entries(MIRAMAR_LAYOUT).forEach(([level, sections]) => {
      Object.entries(sections).forEach(([position, { rows }]) => {
        const sectionKey = `${level === 'orchestra' ? 'Orch' : 'Balc'}-${position.charAt(0).toUpperCase() + position.slice(1)}`;
        rows.forEach(row => {
          for (let i = 0; i < row.seats; i++) {
            ids.push(`${sectionKey}-${row.label}-${row.start + i}`);
          }
        });
      });
    });
    allSeatIds.current = ids;
  }, []);
  
  // Load raffle data
  useEffect(() => {
    loadRaffle();
  }, [raffleId]);
  
  const loadRaffle = async () => {
    try {
      setLoading(true);
      const response = await seatRafflesAPI.getDrawingData(raffleId);
      if (response.data.success) {
        setRaffle(response.data.data);
        // Convert seats array to map
        const seatMap = {};
        response.data.data.seats?.forEach(s => {
          seatMap[s.seatId] = s;
        });
        setSeats(seatMap);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to load raffle");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const eligibleSeats = useMemo(() => {
    if (!raffle) return allSeatIds.current;
    const excluded = new Set(raffle.excludedSeats || []);
    const previousWinners = new Set(raffle.winners?.map(w => w.seatId) || []);
    
    return allSeatIds.current.filter(id => {
      if (excluded.has(id)) return false;
      if (!raffle.allowRepeatWinners && previousWinners.has(id)) return false;
      if (raffle.requireOccupied) {
        const seat = seats[id];
        return seat?.attendeeName;
      }
      return true;
    });
  }, [raffle, seats]);
  
  const startDraw = async () => {
    if (isDrawing || eligibleSeats.length === 0) return;
    
    setIsDrawing(true);
    setWinnerSeat(null);
    setWinnerInfo(null);
    setShowModal(false);
    
    // Resume audio
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    
    // Pick winner
    const winnerIndex = Math.floor(Math.random() * eligibleSeats.length);
    const winner = eligibleSeats[winnerIndex];
    
    // Animation
    const steps = 35;
    let step = 0;
    
    const animate = () => {
      if (step >= steps) {
        // Final winner
        setHighlightedSeat(null);
        setWinnerSeat(winner);
        playWinner();
        createConfetti();
        
        // Parse winner info
        const [section, row, seatNum] = winner.split('-').slice(0, 3);
        const seatData = seats[winner];
        setWinnerInfo({
          seatId: winner,
          section: section.replace('Orch-', 'Orchestra ').replace('Balc-', 'Balcony '),
          row,
          seatNum: winner.split('-').pop(),
          attendeeName: seatData?.attendeeName || 'Unknown'
        });
        
        setShowModal(true);
        setIsDrawing(false);
        
        // Record winner in database
        seatRafflesAPI.draw(raffleId).catch(console.error);
        
        return;
      }
      
      // Highlight random seat, getting closer to winner near the end
      let highlightSeat;
      if (step >= steps - 8) {
        // Near end, pick from nearby seats
        const nearbySeats = eligibleSeats.filter((s, i) => Math.abs(i - winnerIndex) < 15);
        highlightSeat = nearbySeats[Math.floor(Math.random() * nearbySeats.length)];
      } else {
        highlightSeat = eligibleSeats[Math.floor(Math.random() * eligibleSeats.length)];
      }
      
      setHighlightedSeat(highlightSeat);
      playTick();
      
      step++;
      const delay = 40 + (step / steps) * 180; // Slow down
      setTimeout(animate, delay);
    };
    
    animate();
  };
  
  const resetDraw = async () => {
    if (!confirm('Reset this raffle and clear all winners?')) return;
    try {
      await seatRafflesAPI.reset(raffleId);
      setWinnerSeat(null);
      setWinnerInfo(null);
      setShowModal(false);
      loadRaffle();
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-red-400">{error}</p>
        <Link to="/admin/seat-raffles" className="text-purple-400 hover:underline">
          ← Back to Seat Raffles
        </Link>
      </div>
    );
  }
  
  const bgStyle = raffle?.backgroundImageUrl 
    ? { backgroundImage: `url(${raffle.backgroundImageUrl})`, backgroundSize: 'cover' }
    : { background: raffle?.backgroundGradient || `linear-gradient(135deg, ${raffle?.backgroundColor || '#1a1a2e'} 0%, #16213e 100%)` };

  return (
    <div className="min-h-screen text-white p-4" style={bgStyle}>
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          {/* Left buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={startDraw}
              disabled={isDrawing || eligibleSeats.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold 
                shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDrawing ? '🎰 Drawing...' : '🎲 Start Raffle'}
            </button>
            <button
              onClick={resetDraw}
              className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full text-sm font-bold
                hover:from-gray-500 hover:to-gray-600 transition-all"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" /> Reset
            </button>
            <button
              onClick={toggleMusic}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all
                ${isPlaying 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`}
            >
              {isPlaying ? <Volume2 className="w-4 h-4 inline mr-1" /> : <VolumeX className="w-4 h-4 inline mr-1" />}
              {isPlaying ? 'Playing' : 'Music'}
            </button>
          </div>
          
          {/* Title */}
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎉 {raffle?.name || 'Seat Raffle'}
            </h1>
            <p className="text-gray-400 text-sm">
              {raffle?.eventName || 'CASEC 2026 Spring Gala'} • Miramar Cultural Center
            </p>
            {raffle?.prizeName && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span>{raffle.prizeName}</span>
                {raffle.prizeValue && <span className="text-green-400">${raffle.prizeValue}</span>}
              </div>
            )}
          </div>
          
          {/* Right - stats */}
          <div className="text-right text-sm text-gray-400">
            <div>Eligible: <span className="text-white font-bold">{eligibleSeats.length}</span></div>
            <div>Winners: <span className="text-green-400 font-bold">{raffle?.winners?.length || 0}</span></div>
            <Link to="/admin/seat-raffles" className="text-purple-400 hover:underline text-xs">
              ← Admin
            </Link>
          </div>
        </div>
        
        {/* Stage */}
        <div className="bg-gradient-to-b from-gray-600 to-gray-800 text-white text-center py-2 px-12 
          rounded-b-[50%] mx-auto w-1/2 font-bold tracking-widest shadow-lg mb-6">
          STAGE
        </div>
        
        {/* Theater Layout */}
        <div className="space-y-6">
          {/* Orchestra */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-center text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Orchestra
            </div>
            <div className="flex justify-center gap-6">
              <Section
                title="Left"
                sectionKey="Orch-Left"
                rows={MIRAMAR_LAYOUT.orchestra.left.rows}
                seats={seats}
                highlightedSeat={highlightedSeat}
                winnerSeat={winnerSeat}
                excludedSeats={raffle?.excludedSeats}
              />
              <Section
                title="Center"
                sectionKey="Orch-Center"
                rows={MIRAMAR_LAYOUT.orchestra.center.rows}
                seats={seats}
                highlightedSeat={highlightedSeat}
                winnerSeat={winnerSeat}
                excludedSeats={raffle?.excludedSeats}
              />
              <Section
                title="Right"
                sectionKey="Orch-Right"
                rows={MIRAMAR_LAYOUT.orchestra.right.rows}
                seats={seats}
                highlightedSeat={highlightedSeat}
                winnerSeat={winnerSeat}
                excludedSeats={raffle?.excludedSeats}
              />
            </div>
          </div>
          
          {/* Balcony */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-center text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Balcony
            </div>
            <div className="flex justify-center gap-6">
              <Section
                title="Left"
                sectionKey="Balc-Left"
                rows={MIRAMAR_LAYOUT.balcony.left.rows}
                seats={seats}
                highlightedSeat={highlightedSeat}
                winnerSeat={winnerSeat}
                excludedSeats={raffle?.excludedSeats}
              />
              <Section
                title="Center"
                sectionKey="Balc-Center"
                rows={MIRAMAR_LAYOUT.balcony.center.rows}
                seats={seats}
                highlightedSeat={highlightedSeat}
                winnerSeat={winnerSeat}
                excludedSeats={raffle?.excludedSeats}
              />
              <Section
                title="Right"
                sectionKey="Balc-Right"
                rows={MIRAMAR_LAYOUT.balcony.right.rows}
                seats={seats}
                highlightedSeat={highlightedSeat}
                winnerSeat={winnerSeat}
                excludedSeats={raffle?.excludedSeats}
              />
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-600" /> Available
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-purple-600" /> Occupied
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-yellow-400" /> Scanning
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500" /> Winner
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-900/50" /> Excluded
          </div>
        </div>
      </div>
      
      {/* Winner Modal */}
      {showModal && winnerInfo && (
        <div 
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500 rounded-3xl 
              p-12 text-center shadow-2xl shadow-purple-500/30 animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce">🎊</div>
            <div className="text-xl text-purple-400 uppercase tracking-widest mb-2">Congratulations!</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              {winnerInfo.section}
            </div>
            <div className="text-2xl text-gray-300 mb-2">
              Row {winnerInfo.row}, Seat {winnerInfo.seatNum}
            </div>
            {winnerInfo.attendeeName && winnerInfo.attendeeName !== 'Unknown' && (
              <div className="text-xl text-yellow-400 mb-6">
                🏆 {winnerInfo.attendeeName}
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full font-bold"
              >
                OK
              </button>
              <button
                onClick={() => { setShowModal(false); setTimeout(startDraw, 300); }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold"
              >
                🎲 Draw Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.4s ease; }
      `}</style>
    </div>
  );
}
