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

// Seat component - now uses actual seatNumber from DB
function Seat({ seatId, visibleNumber, isHighlighted, isWinner, isExcluded, attendeeName, onClick }) {
  let bgColor = 'bg-gray-600 border-gray-500 text-gray-300';
  if (isExcluded) bgColor = 'bg-red-900/50 border-red-800 text-red-300';
  else if (isWinner) bgColor = 'bg-green-500 border-green-400 text-white';
  else if (isHighlighted) bgColor = 'bg-yellow-400 border-yellow-300 text-gray-900';
  else if (attendeeName) bgColor = 'bg-purple-600 border-purple-500 text-white';
  
  return (
    <div
      onClick={onClick}
      className={`w-6 h-6 rounded-t-sm rounded-b cursor-pointer border transition-all duration-100
        flex items-center justify-center text-[8px] font-bold
        ${bgColor}
        ${isHighlighted ? 'scale-150 shadow-lg shadow-yellow-400/50 z-10' : ''}
        ${isWinner ? 'scale-175 shadow-xl shadow-green-400/70 animate-pulse z-20' : ''}
        hover:scale-125 hover:bg-indigo-500 hover:text-white hover:z-10`}
      title={`Seat ${visibleNumber}${attendeeName ? `: ${attendeeName}` : ''}`}
    >
      {visibleNumber}
    </div>
  );
}

// Dynamic Section component - renders seats from DB data
function DynamicSection({ title, section, seats, highlightedSeatId, winnerSeatId, excludedSeatIds, onSeatClick }) {
  // Group seats by row
  const rowsData = useMemo(() => {
    if (!seats || seats.length === 0) return [];
    
    // Group by rowLabel
    const grouped = {};
    seats.forEach(seat => {
      if (!grouped[seat.rowLabel]) {
        grouped[seat.rowLabel] = [];
      }
      grouped[seat.rowLabel].push(seat);
    });
    
    // Sort rows alphabetically and seats by seatNumber within each row
    const sortedRows = Object.keys(grouped).sort();
    return sortedRows.map(rowLabel => ({
      label: rowLabel,
      seats: grouped[rowLabel].sort((a, b) => a.seatNumber - b.seatNumber)
    }));
  }, [seats]);
  
  // Calculate max seats for alignment
  const maxSeats = useMemo(() => {
    return Math.max(...rowsData.map(r => r.seats.length), 0);
  }, [rowsData]);
  
  if (rowsData.length === 0) return null;
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="flex flex-col gap-0.5">
        {rowsData.map(row => {
          const padding = Math.floor((maxSeats - row.seats.length) / 2);
          
          return (
            <div key={row.label} className="flex items-center gap-0.5">
              <span className="w-6 text-xs text-gray-500 text-right mr-1">{row.label}</span>
              {/* Left padding */}
              {padding > 0 && <div style={{ width: `${padding * 28}px` }} />}
              {/* Seats */}
              {row.seats.map(seat => (
                <Seat
                  key={seat.seatId}
                  seatId={seat.seatId}
                  visibleNumber={seat.seatNumber}
                  isHighlighted={highlightedSeatId === seat.seatId}
                  isWinner={winnerSeatId === seat.seatId}
                  isExcluded={excludedSeatIds?.includes(seat.seatId)}
                  attendeeName={seat.attendeeName}
                  onClick={() => onSeatClick?.(seat)}
                />
              ))}
              {/* Right padding */}
              {padding > 0 && <div style={{ width: `${padding * 28}px` }} />}
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
  const [sections, setSections] = useState([]);
  const [allSeats, setAllSeats] = useState([]);
  const [error, setError] = useState(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlightedSeatId, setHighlightedSeatId] = useState(null);
  const [winnerSeatId, setWinnerSeatId] = useState(null);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const { isPlaying, toggleMusic } = useBackgroundMusic();
  
  // Group sections by level and position for theater layout
  const groupedSections = useMemo(() => {
    const result = {
      orchestra: { left: null, center: null, right: null },
      balcony: { left: null, center: null, right: null }
    };
    
    sections.forEach(section => {
      const name = (section.name || section.shortName || '').toLowerCase();
      const level = name.includes('balc') ? 'balcony' : 'orchestra';
      let position = 'center';
      if (name.includes('left')) position = 'left';
      else if (name.includes('right')) position = 'right';
      
      result[level][position] = section;
    });
    
    return result;
  }, [sections]);
  
  // Group seats by sectionId
  const seatsBySection = useMemo(() => {
    const grouped = {};
    allSeats.forEach(seat => {
      if (!grouped[seat.sectionId]) {
        grouped[seat.sectionId] = [];
      }
      grouped[seat.sectionId].push(seat);
    });
    return grouped;
  }, [allSeats]);
  
  // Excluded seat IDs (numeric IDs from DB)
  const excludedSeatIds = useMemo(() => {
    return allSeats.filter(s => s.isExcluded).map(s => s.seatId);
  }, [allSeats]);
  
  // Eligible seats for raffle - use backend's IsEligible flag
  // Backend already filters out: NotExist, NotAvailable, excluded, non-occupied (if required), previous winners
  const eligibleSeats = useMemo(() => {
    if (!raffle) return [];
    return allSeats.filter(seat => seat.isEligible);
  }, [raffle, allSeats]);
  
  // Load raffle data
  useEffect(() => {
    loadRaffle();
  }, [raffleId]);
  
  const loadRaffle = async () => {
    try {
      setLoading(true);
      const response = await seatRafflesAPI.getDrawingData(raffleId);
      if (response.success) {
        setRaffle(response.data);
        setSections(response.data.sections || []);
        setAllSeats(response.data.seats || []);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to load raffle");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const startDraw = async () => {
    if (isDrawing || eligibleSeats.length === 0) return;
    
    setIsDrawing(true);
    setWinnerSeatId(null);
    setWinnerInfo(null);
    setShowModal(false);
    
    // Resume audio
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    
    // Pick winner
    const winnerIndex = Math.floor(Math.random() * eligibleSeats.length);
    const winnerSeat = eligibleSeats[winnerIndex];
    
    // Animation
    const steps = 35;
    let step = 0;
    
    const animate = () => {
      if (step >= steps) {
        // Final winner
        setHighlightedSeatId(null);
        setWinnerSeatId(winnerSeat.seatId);
        playWinner();
        createConfetti();
        
        // Find section info
        const section = sections.find(s => s.sectionId === winnerSeat.sectionId);
        const sectionName = section?.name || section?.shortName || 'Unknown';
        
        setWinnerInfo({
          seatId: winnerSeat.seatId,
          section: sectionName,
          row: winnerSeat.rowLabel,
          seatNum: winnerSeat.seatNumber,
          attendeeName: winnerSeat.attendeeName || 'Unknown'
        });
        
        setShowModal(true);
        setIsDrawing(false);
        
        // Record winner in database
        seatRafflesAPI.draw(raffleId, false, winnerSeat.seatId).catch(console.error);
        
        return;
      }
      
      // Highlight random seat, getting closer to winner near the end
      let highlightSeat;
      if (step >= steps - 8) {
        // Near end, pick from nearby seats in eligible list
        const nearbySeats = eligibleSeats.filter((s, i) => Math.abs(i - winnerIndex) < 15);
        highlightSeat = nearbySeats[Math.floor(Math.random() * nearbySeats.length)];
      } else {
        highlightSeat = eligibleSeats[Math.floor(Math.random() * eligibleSeats.length)];
      }
      
      setHighlightedSeatId(highlightSeat.seatId);
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
      setWinnerSeatId(null);
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
  
  // Background opacity (default 1 if not set)
  const bgOpacity = raffle?.backgroundOpacity ?? 1;

  // Helper to render a section if it exists
  const renderSection = (level, position, title) => {
    const section = groupedSections[level][position];
    if (!section) return null;
    
    return (
      <DynamicSection
        title={title}
        section={section}
        seats={seatsBySection[section.sectionId] || []}
        highlightedSeatId={highlightedSeatId}
        winnerSeatId={winnerSeatId}
        excludedSeatIds={excludedSeatIds}
      />
    );
  };

  // Check which sections exist to determine layout
  const hasOrchestra = groupedSections.orchestra.left || groupedSections.orchestra.center || groupedSections.orchestra.right;
  const hasBalcony = groupedSections.balcony.left || groupedSections.balcony.center || groupedSections.balcony.right;

  return (
    <div className="min-h-screen text-white relative" style={{ backgroundColor: raffle?.backgroundColor || '#1a1a2e' }}>
      {/* Background image with opacity */}
      {raffle?.backgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${raffle.backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
            opacity: bgOpacity
          }}
        />
      )}
      {/* Gradient overlay if no image */}
      {!raffle?.backgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0"
          style={{ background: raffle?.backgroundGradient || `linear-gradient(135deg, ${raffle?.backgroundColor || '#1a1a2e'} 0%, #16213e 100%)` }}
        />
      )}
      {/* Content */}
      <div className="relative z-10 p-4">
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
              {raffle?.eventName || 'CASEC 2026 Spring Gala'} • {raffle?.venueName || 'Venue'}
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
        
        {/* Theater Layout - Dynamic based on available sections */}
        <div className="space-y-6">
          {/* Orchestra */}
          {hasOrchestra && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-center text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">
                Orchestra
              </div>
              <div className="flex justify-center gap-6">
                {renderSection('orchestra', 'left', 'Left')}
                {renderSection('orchestra', 'center', 'Center')}
                {renderSection('orchestra', 'right', 'Right')}
              </div>
            </div>
          )}
          
          {/* Balcony */}
          {hasBalcony && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-center text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">
                Balcony
              </div>
              <div className="flex justify-center gap-6">
                {renderSection('balcony', 'left', 'Left')}
                {renderSection('balcony', 'center', 'Center')}
                {renderSection('balcony', 'right', 'Right')}
              </div>
            </div>
          )}
          
          {/* Fallback: show all sections generically if they don't match orchestra/balcony pattern */}
          {!hasOrchestra && !hasBalcony && sections.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex justify-center gap-6 flex-wrap">
                {sections.map(section => (
                  <DynamicSection
                    key={section.sectionId}
                    title={section.name || section.shortName}
                    section={section}
                    seats={seatsBySection[section.sectionId] || []}
                    highlightedSeatId={highlightedSeatId}
                    winnerSeatId={winnerSeatId}
                    excludedSeatIds={excludedSeatIds}
                  />
                ))}
              </div>
            </div>
          )}
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
      
      </div>{/* End content wrapper */}
      
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
