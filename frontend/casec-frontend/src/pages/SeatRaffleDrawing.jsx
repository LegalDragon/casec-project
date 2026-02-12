import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Volume2, VolumeX, RotateCcw, Trophy, Settings, Gift, ChevronDown, Lock, Unlock } from "lucide-react";
import { seatRafflesAPI, getAssetUrl } from "../services/api";

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

// Confetti effect - z-index 50 so it's behind winner modal (z-100) but visible over seat chart
const createConfetti = () => {
  const colors = ['#a855f7', '#ec4899', '#22c55e', '#fbbf24', '#3b82f6', '#ef4444'];
  for (let i = 0; i < 50; i++) { // Reduced from 80 to 50 for less intrusive effect
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 50;
      left: ${Math.random() * 100}vw;
      top: -10px;
      width: ${Math.random() * 10 + 4}px;
      height: ${Math.random() * 10 + 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      opacity: 0.8;
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
function Seat({ seatId, visibleNumber, isHighlighted, isWinner, isExcluded, isVIP, isNotAvailable, attendeeName, onClick }) {
  // Color logic matching the preview:
  // Available: blue-gray, NotAvailable: dark red, VIP: purple, Occupied: green
  let bgColor = 'bg-[#3a3a5a] border-[#4a4a6a] text-gray-300'; // available
  let opacity = '';
  
  if (isNotAvailable) {
    bgColor = 'bg-[#7f1d1d] border-red-900 text-red-200';
    opacity = 'opacity-60';
  } else if (isExcluded) {
    bgColor = 'bg-red-900/50 border-red-800 text-red-300';
  } else if (isWinner) {
    bgColor = 'bg-green-500 border-green-400 text-white';
  } else if (isHighlighted) {
    bgColor = 'bg-yellow-400 border-yellow-300 text-gray-900';
  } else if (isVIP) {
    bgColor = 'bg-purple-500 border-purple-400 text-white';
  } else if (attendeeName) {
    bgColor = 'bg-green-500 border-green-400 text-white'; // occupied
  }
  
  return (
    <div
      onClick={onClick}
      className={`w-6 h-6 rounded-t-sm rounded-b cursor-pointer border transition-all duration-100
        flex items-center justify-center text-[8px] font-bold
        ${bgColor} ${opacity}
        ${isHighlighted ? 'scale-150 shadow-lg shadow-yellow-400/50 z-10' : ''}
        ${isWinner ? 'scale-175 shadow-xl shadow-green-400/70 animate-pulse z-20' : ''}
        hover:scale-125 hover:bg-indigo-500 hover:text-white hover:z-10`}
      title={isNotAvailable ? 'Not Available' : `Seat ${visibleNumber}${attendeeName ? `: ${attendeeName}` : ''}`}
    >
      {!isNotAvailable && visibleNumber}
    </div>
  );
}

// Dynamic Section component - renders seats from DB data
function DynamicSection({ title, section, seats, highlightedSeatId, winnerSeatId, excludedSeatIds, onSeatClick }) {
  // Get section direction (LTR or RTL)
  const direction = section?.direction || 'LTR';
  
  // Group seats by row, filtering out NotExist seats
  const rowsData = useMemo(() => {
    if (!seats || seats.length === 0) return [];
    
    // Filter out NotExist seats (they shouldn't be shown)
    const visibleSeats = seats.filter(s => s.status !== 'NotExist');
    
    // Group by rowLabel
    const grouped = {};
    visibleSeats.forEach(seat => {
      if (!grouped[seat.rowLabel]) {
        grouped[seat.rowLabel] = [];
      }
      grouped[seat.rowLabel].push(seat);
    });
    
    // Sort rows alphabetically and seats by seatNumber (respecting direction)
    const sortedRows = Object.keys(grouped).sort();
    return sortedRows.map(rowLabel => ({
      label: rowLabel,
      seats: grouped[rowLabel].sort((a, b) => 
        direction === 'RTL' ? b.seatNumber - a.seatNumber : a.seatNumber - b.seatNumber
      )
    }));
  }, [seats, direction]);
  
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
                  isVIP={seat.isVIP}
                  isNotAvailable={seat.status === 'NotAvailable'}
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
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [showPrizeSelector, setShowPrizeSelector] = useState(false);
  const [winnerSeatId, setWinnerSeatId] = useState(null);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  
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
  
  const loadRaffle = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };
  
  const startDraw = async () => {
    if (isDrawing || eligibleSeats.length === 0) return;
    
    // Check if selected prize is full - warn that it will replace an existing winner
    if (selectedPrize && selectedPrize.quantity > 0) {
      const currentWinners = selectedPrize.winnersCount || 0;
      if (currentWinners >= selectedPrize.quantity) {
        const lockedCount = raffle?.winners?.filter(w => w.prizeId === selectedPrize.prizeId && w.isLocked).length || 0;
        const unlockedCount = currentWinners - lockedCount;
        
        if (unlockedCount === 0) {
          alert(`All ${currentWinners} winners for "${selectedPrize.name}" are locked. Unlock one first to draw again.`);
          return;
        }
        
        if (!confirm(`"${selectedPrize.name}" already has ${currentWinners}/${selectedPrize.quantity} winners.\n\nDrawing again will REPLACE the oldest unlocked winner.\n\nContinue?`)) {
          return;
        }
      }
    }
    
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
          attendeeName: winnerSeat.attendeeName || 'Unknown',
          prize: selectedPrize
        });
        
        setShowModal(true);
        setIsDrawing(false);
        
        // Record winner in database (with optional prizeId) then silently refresh data
        seatRafflesAPI.draw(raffleId, false, winnerSeat.seatId, selectedPrize?.prizeId)
          .then(() => loadRaffle(false)) // Silent refresh - no loading spinner
          .catch(console.error);
        
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
  
  // Background opacity (default 0.5 if not set)
  const bgOpacity = raffle?.backgroundOpacity ?? 0.5;
  
  // Text color from theme (default white)
  const textColor = raffle?.textColor || '#ffffff';

  // Check which sections exist to determine layout
  const hasOrchestra = groupedSections.orchestra.left || groupedSections.orchestra.center || groupedSections.orchestra.right;
  const hasBalcony = groupedSections.balcony.left || groupedSections.balcony.center || groupedSections.balcony.right;

  // Helper to get seats for a section/row, filtered and sorted
  const getSeatsForRow = (section, rowLabel) => {
    if (!section) return [];
    return (seatsBySection[section.sectionId] || [])
      .filter(s => s.rowLabel === rowLabel && s.status !== 'NotExist')
      .sort((a, b) => section.direction === 'RTL' ? b.seatNumber - a.seatNumber : a.seatNumber - b.seatNumber);
  };

  // Helper to calculate max seats in a section
  const getMaxSeatsInSection = (section) => {
    if (!section) return 0;
    const seats = seatsBySection[section.sectionId] || [];
    const rowCounts = {};
    seats.filter(s => s.status !== 'NotExist').forEach(s => {
      rowCounts[s.rowLabel] = (rowCounts[s.rowLabel] || 0) + 1;
    });
    return Math.max(0, ...Object.values(rowCounts));
  };

  // Render a unified level (Orchestra or Balcony) with aligned rows
  const renderLevel = (levelKey, levelName) => {
    const leftSection = groupedSections[levelKey].left;
    const centerSection = groupedSections[levelKey].center;
    const rightSection = groupedSections[levelKey].right;
    
    if (!leftSection && !centerSection && !rightSection) return null;
    
    // Get ALL unique rows across all sections in this level
    const allSections = [leftSection, centerSection, rightSection].filter(Boolean);
    const allRows = [...new Set(
      allSections.flatMap(s => 
        (seatsBySection[s.sectionId] || [])
          .filter(seat => seat.status !== 'NotExist')
          .map(seat => seat.rowLabel)
      )
    )].sort();
    
    // Calculate fixed widths for alignment
    const leftMaxSeats = getMaxSeatsInSection(leftSection);
    const centerMaxSeats = getMaxSeatsInSection(centerSection);
    const rightMaxSeats = getMaxSeatsInSection(rightSection);
    
    const leftWidth = Math.max(80, leftMaxSeats * 28);
    const centerWidth = Math.max(100, centerMaxSeats * 28);
    const rightWidth = Math.max(80, rightMaxSeats * 28);
    
    // Render seats for a section/row
    const renderSectionSeats = (section, rowLabel, fixedWidth) => {
      if (!section) return <div style={{ width: fixedWidth }}></div>;
      const seats = getSeatsForRow(section, rowLabel);
      
      return (
        <div className="flex items-center gap-0.5 justify-center" style={{ width: fixedWidth }}>
          {seats.map(seat => (
            <Seat
              key={seat.seatId}
              seatId={seat.seatId}
              visibleNumber={seat.seatNumber}
              isHighlighted={highlightedSeatId === seat.seatId}
              isWinner={winnerSeatId === seat.seatId}
              isExcluded={excludedSeatIds?.includes(seat.seatId)}
              isVIP={seat.isVIP}
              isNotAvailable={seat.status === 'NotAvailable'}
              attendeeName={seat.attendeeName}
            />
          ))}
        </div>
      );
    };
    
    return (
      <div className="bg-white/5 rounded-xl p-4">
        <div className="text-center text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: textColor }}>
          {levelName}
        </div>
        {/* Column headers */}
        <div className="flex justify-center items-center gap-4 mb-2">
          <div className="text-[10px] uppercase text-center opacity-60" style={{ color: textColor, width: leftWidth }}>Left</div>
          <div className="w-6"></div>
          <div className="text-[10px] uppercase text-center opacity-60" style={{ color: textColor, width: centerWidth }}>Center</div>
          <div className="w-6"></div>
          <div className="text-[10px] uppercase text-center opacity-60" style={{ color: textColor, width: rightWidth }}>Right</div>
        </div>
        {/* Rows */}
        <div className="space-y-0.5">
          {allRows.map(rowLabel => (
            <React.Fragment key={rowLabel}>
              {/* Add aisle gap before row D (between B and D, since C may not exist in side sections) */}
              {rowLabel === 'C' && <div className="h-4"></div>}
              <div className="flex justify-center items-center gap-4">
                {renderSectionSeats(leftSection, rowLabel, leftWidth)}
                <span className="w-6 text-center text-[10px] opacity-70" style={{ color: textColor }}>{rowLabel}</span>
                {renderSectionSeats(centerSection, rowLabel, centerWidth)}
                <span className="w-6 text-center text-[10px] opacity-70" style={{ color: textColor }}>{rowLabel}</span>
                {renderSectionSeats(rightSection, rowLabel, rightWidth)}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

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
      <div className="relative z-10 p-2">
        {/* Stage bar at top - centered */}
        <div className="bg-gradient-to-b from-gray-600 to-gray-800 text-white text-center py-2 px-12 
          rounded-b-[50%] mx-auto w-2/3 max-w-xl font-bold tracking-widest shadow-lg mb-2">
          STAGE
        </div>
        
        {/* Center Prize Showcase - shows when prize selected, hides during drawing and when winner modal shown */}
        {selectedPrize && !isDrawing && !showModal && (
          <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="animate-prize-showcase bg-black/60 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-2 border-yellow-500/50
              shadow-yellow-500/30">
              {selectedPrize.imageUrl ? (
                <img 
                  src={getAssetUrl(selectedPrize.imageUrl)} 
                  alt={selectedPrize.name}
                  className="w-64 h-64 object-cover rounded-2xl shadow-2xl mb-4 animate-pulse-glow"
                />
              ) : (
                <div className="w-64 h-64 bg-gradient-to-br from-yellow-600/30 to-amber-600/30 rounded-2xl 
                  flex items-center justify-center mb-4 animate-pulse-glow">
                  <Gift className="w-24 h-24 text-yellow-400" />
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">{selectedPrize.name}</div>
                {selectedPrize.value && (
                  <div className="text-2xl text-green-400 font-bold">${selectedPrize.value}</div>
                )}
                {selectedPrize.description && (
                  <div className="text-gray-300 mt-2 max-w-xs">{selectedPrize.description}</div>
                )}
              </div>
              <div className="text-center mt-4 text-sm text-gray-400 animate-bounce">
                Press "Start Raffle" to draw!
              </div>
            </div>
          </div>
        )}
        
        {/* Floating Admin Panel - bottom left */}
        <div className="fixed bottom-4 left-4 z-40 w-52 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl p-3 space-y-3">
            {/* Title */}
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                🎉 {raffle?.name || 'Seat Raffle'}
              </h1>
              <p className="text-gray-500 text-xs">
                {raffle?.eventName || 'CASEC 2026 Spring Gala'}
              </p>
            </div>
            
            {/* Prize info */}
            {raffle?.prizeName && (
              <div className="flex items-center gap-1 text-sm">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white">{raffle.prizeName}</span>
                {raffle.prizeValue && <span className="text-green-400 text-xs">${raffle.prizeValue}</span>}
              </div>
            )}
            
            {/* Stats */}
            <div className="text-xs text-gray-400 space-y-1">
              <div>Eligible: <span className="text-white font-bold">{eligibleSeats.length}</span></div>
            </div>
            
            {/* Winners List */}
            <div 
              className="bg-white/5 rounded-lg p-2 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => raffle?.winners?.length > 0 && setShowWinnersModal(true)}
            >
              <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                <span>🏆 Winners ({raffle?.winners?.length || 0})</span>
                {raffle?.winners?.length > 0 && <span className="text-[10px] text-purple-400">View All</span>}
              </div>
              {raffle?.winners?.length > 0 ? (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {raffle.winners.slice(-3).reverse().map((w, i) => (
                    <div key={w.winnerId || i} className="text-[10px] text-green-400 truncate">
                      #{w.drawNumber} {w.sectionName} {w.rowLabel}-{w.seatNumber}
                      {w.attendeeName && <span className="text-gray-400"> • {w.attendeeName}</span>}
                    </div>
                  ))}
                  {raffle.winners.length > 3 && (
                    <div className="text-[10px] text-gray-500">+{raffle.winners.length - 3} more...</div>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-gray-500">No winners yet</div>
              )}
            </div>
            
            {/* Prize Selector (if multiple prizes) */}
            {raffle?.prizes?.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowPrizeSelector(!showPrizeSelector)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-lg text-xs font-bold
                    flex items-center justify-between gap-2 hover:from-amber-500 hover:to-yellow-400 transition-all"
                >
                  <span className="flex items-center gap-1 truncate">
                    <Gift className="w-3 h-3 flex-shrink-0" />
                    {selectedPrize ? selectedPrize.name : 'Select Prize...'}
                  </span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${showPrizeSelector ? 'rotate-180' : ''}`} />
                </button>
                {showPrizeSelector && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedPrize(null); setShowPrizeSelector(false); }}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-700 flex items-center gap-2
                        ${!selectedPrize ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300'}`}
                    >
                      <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                        <Gift className="w-3 h-3" />
                      </div>
                      <span>No specific prize</span>
                    </button>
                    {raffle.prizes.sort((a, b) => a.displayOrder - b.displayOrder).map(prize => {
                      const isFull = prize.quantity && prize.winnersCount >= prize.quantity;
                      const remaining = prize.quantity ? prize.quantity - (prize.winnersCount || 0) : null;
                      return (
                        <button
                          key={prize.prizeId}
                          onClick={() => { if (!isFull) { setSelectedPrize(prize); setShowPrizeSelector(false); }}}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-700 flex items-center gap-2
                            ${selectedPrize?.prizeId === prize.prizeId ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300'}
                            ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {prize.imageUrl ? (
                            <img src={getAssetUrl(prize.imageUrl)} alt="" className="w-6 h-6 rounded object-cover" />
                          ) : (
                            <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                              <Gift className="w-3 h-3" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">{prize.name}</div>
                            {prize.value && <div className="text-green-400 text-[10px]">${prize.value}</div>}
                          </div>
                          <div className="text-right">
                            {prize.quantity > 1 ? (
                              <span className={`text-[10px] ${isFull ? 'text-red-400' : 'text-gray-400'}`}>
                                {prize.winnersCount || 0}/{prize.quantity}
                              </span>
                            ) : prize.winnersCount > 0 ? (
                              <span className="text-[10px] text-red-400">Won</span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={startDraw}
                disabled={isDrawing || eligibleSeats.length === 0}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold text-sm
                  shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isDrawing ? '🎰 Drawing...' : '🎲 Start Raffle'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={resetDraw}
                  className="flex-1 px-2 py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full text-xs font-bold
                    hover:from-gray-500 hover:to-gray-600 transition-all"
                >
                  <RotateCcw className="w-3 h-3 inline mr-1" /> Reset
                </button>
                <button
                  onClick={toggleMusic}
                  className={`flex-1 px-2 py-1.5 rounded-full text-xs font-bold transition-all
                    ${isPlaying 
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`}
                >
                  {isPlaying ? <Volume2 className="w-3 h-3 inline" /> : <VolumeX className="w-3 h-3 inline" />}
                </button>
              </div>
            </div>
            
            {/* Admin link */}
            <Link to="/admin/seat-raffles" className="text-purple-400 hover:underline text-xs block">
              ← Admin
            </Link>
          </div>
        
        {/* Theater Layout - centered, full width */}
        <div className="space-y-6">
          {/* Orchestra - unified row layout */}
          {hasOrchestra && renderLevel('orchestra', 'Orchestra')}
          
          {/* Balcony - unified row layout */}
          {hasBalcony && renderLevel('balcony', 'Balcony')}
          
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
          
          {/* Legend - compact */}
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#3a3a5a]"></span>Available</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500"></span>Occupied</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-500"></span>VIP</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-400"></span>Scanning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 ring-2 ring-green-400"></span>Winner</span>
          </div>
        </div>{/* End theater layout */}
      </div>{/* End content */}
      
      {/* Winner Modal - semi-transparent so seat chart is visible */}
      {showModal && winnerInfo && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]"
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
            <div className="text-4xl font-bold text-white mb-2">
              Row {winnerInfo.row}, Seat {winnerInfo.seatNum}
            </div>
            {winnerInfo.attendeeName && winnerInfo.attendeeName !== 'Unknown' && (
              <div className="text-xl text-yellow-400 mb-4">
                🏆 {winnerInfo.attendeeName}
              </div>
            )}
            {/* Prize Won */}
            {winnerInfo.prize && (
              <div className="bg-gradient-to-r from-amber-900/50 to-yellow-900/50 rounded-xl p-4 mb-6 border border-yellow-500/30">
                <div className="text-sm text-yellow-300 uppercase tracking-wider mb-2">Prize Won</div>
                <div className="flex items-center justify-center gap-3">
                  {winnerInfo.prize.imageUrl ? (
                    <img 
                      src={getAssetUrl(winnerInfo.prize.imageUrl)} 
                      alt={winnerInfo.prize.name}
                      className="w-16 h-16 object-cover rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-yellow-600/30 rounded-lg flex items-center justify-center">
                      <Gift className="w-8 h-8 text-yellow-400" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xl font-bold text-white">{winnerInfo.prize.name}</div>
                    {winnerInfo.prize.value && (
                      <div className="text-lg text-green-400">${winnerInfo.prize.value}</div>
                    )}
                    {winnerInfo.prize.description && (
                      <div className="text-sm text-gray-400">{winnerInfo.prize.description}</div>
                    )}
                  </div>
                </div>
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
      
      {/* All Winners Modal - Grouped by Prize */}
      {showWinnersModal && raffle?.winners?.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50"
          onClick={() => setShowWinnersModal(false)}
        >
          <div 
            className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500 rounded-2xl 
              p-6 shadow-2xl shadow-purple-500/30 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🏆 All Winners ({raffle.winners.length})
              </h2>
              <button 
                onClick={() => setShowWinnersModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-4">
              {/* Group winners by prize */}
              {(() => {
                // Group winners by prizeId (null for no prize)
                const grouped = {};
                raffle.winners.forEach(w => {
                  const key = w.prizeId || 'no-prize';
                  if (!grouped[key]) {
                    grouped[key] = {
                      prize: raffle.prizes?.find(p => p.prizeId === w.prizeId) || null,
                      prizeName: w.prizeName,
                      winners: []
                    };
                  }
                  grouped[key].winners.push(w);
                });
                
                // Sort: prizes with images first, then by displayOrder, no-prize last
                const sortedKeys = Object.keys(grouped).sort((a, b) => {
                  if (a === 'no-prize') return 1;
                  if (b === 'no-prize') return -1;
                  const pa = grouped[a].prize;
                  const pb = grouped[b].prize;
                  if (pa?.imageUrl && !pb?.imageUrl) return -1;
                  if (!pa?.imageUrl && pb?.imageUrl) return 1;
                  return (pa?.displayOrder || 0) - (pb?.displayOrder || 0);
                });
                
                return sortedKeys.map(key => {
                  const { prize, prizeName, winners } = grouped[key];
                  return (
                    <div key={key} className="bg-white/5 rounded-xl p-4">
                      <div className="flex gap-4">
                        {/* Prize Image */}
                        <div className="flex-shrink-0">
                          {prize?.imageUrl ? (
                            <img 
                              src={getAssetUrl(prize.imageUrl)} 
                              alt={prize.name}
                              className="w-24 h-24 object-cover rounded-xl shadow-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-600/30 to-amber-600/30 rounded-xl flex items-center justify-center">
                              <Gift className="w-10 h-10 text-yellow-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Prize Info & Winners */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-2">
                            <div className="text-lg font-bold text-yellow-400">
                              {prize?.name || prizeName || 'General Raffle'}
                            </div>
                            {prize?.value && (
                              <div className="text-sm text-green-400">${prize.value}</div>
                            )}
                          </div>
                          
                          {/* Winners List */}
                          <div className="space-y-1">
                            {winners.map((w, i) => (
                              <div key={w.winnerId || i} className="flex items-center gap-2 text-sm group">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await seatRafflesAPI.lockWinner(raffle.seatRaffleId, w.winnerId, !w.isLocked);
                                      loadRaffle(false); // Silent refresh
                                    } catch (err) {
                                      console.error('Failed to toggle lock:', err);
                                    }
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    w.isLocked 
                                      ? 'text-yellow-400 hover:text-yellow-300' 
                                      : 'text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title={w.isLocked ? 'Unlock winner' : 'Lock winner'}
                                >
                                  {w.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                </button>
                                <span className="text-purple-400 font-medium">#{w.drawNumber || i + 1}</span>
                                <span className="text-white">
                                  {w.sectionName} {w.rowLabel}-{w.seatNumber}
                                </span>
                                {w.attendeeName && (
                                  <span className="text-green-400 truncate">• {w.attendeeName}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
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
        
        @keyframes prize-showcase {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(2deg); }
          70% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-prize-showcase { animation: prize-showcase 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(234, 179, 8, 0.4), 0 0 40px rgba(234, 179, 8, 0.2); }
          50% { box-shadow: 0 0 30px rgba(234, 179, 8, 0.6), 0 0 60px rgba(234, 179, 8, 0.3); }
        }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
