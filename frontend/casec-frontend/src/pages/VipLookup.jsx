import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, User, MapPin, Phone, Ticket, Loader2, Star, Check, X } from "lucide-react";
import api from "../services/api";

export default function VipLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allSeats, setAllSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null); // seatId being updated

  // Load all VIP seats on mount
  useEffect(() => {
    const loadAllVip = async () => {
      setLoading(true);
      setError(null);
      try {
        // Search with a wildcard-like query to get all VIP seats
        const response = await api.get(`/seatingcharts/vip-lookup?q=*`);
        if (response.success) {
          // Sort by name
          const sorted = (response.data || []).sort((a, b) => {
            const nameA = (a.attendeeName || '').toLowerCase();
            const nameB = (b.attendeeName || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setAllSeats(sorted);
        } else {
          setError(response.message || "Failed to load VIP seats");
        }
      } catch (err) {
        console.error("VIP load error:", err);
        setError("Failed to load VIP seats. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadAllVip();
  }, []);

  // Filter results based on search query
  const results = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSeats;
    }
    const query = searchQuery.toLowerCase().trim();
    return allSeats.filter(seat => {
      const name = (seat.attendeeName || '').toLowerCase();
      const section = (seat.section || '').toLowerCase();
      const seatLoc = `${seat.row}-${seat.seatNumber}`.toLowerCase();
      return name.includes(query) || section.includes(query) || seatLoc.includes(query);
    });
  }, [allSeats, searchQuery]);

  // Toggle ticket pickup status
  const togglePickup = async (seatId, currentStatus) => {
    setUpdating(seatId);
    try {
      const response = await api.post(`/seatingcharts/vip-pickup/${seatId}`, {
        pickedUp: !currentStatus
      });
      if (response.success) {
        // Update the local allSeats state
        setAllSeats(prev => prev.map(seat => 
          seat.seatId === seatId 
            ? { ...seat, ticketPickedUp: response.data.ticketPickedUp, pickedUpAt: response.data.pickedUpAt }
            : seat
        ));
      } else {
        alert(response.message || "Failed to update");
      }
    } catch (err) {
      console.error("Toggle pickup error:", err);
      alert("Failed to update ticket status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-yellow-700">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-20">🏮</div>
        <div className="absolute top-20 right-20 text-6xl opacity-20">🧧</div>
        <div className="absolute bottom-20 left-20 text-6xl opacity-20">🐴</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-20">✨</div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            VIP Ticket Lookup
          </h1>
          <p className="text-yellow-100/80">
            2026 Florida Chinese Spring Festival Gala
          </p>
          <p className="text-yellow-100/60 text-sm mt-1">
            Search by name or seat (e.g., "John" or "C-105")
          </p>
        </div>

        {/* Search Box */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-yellow-600" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter name or seat number..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-yellow-400 
              text-gray-800 text-lg placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-400/50
              shadow-lg"
            autoFocus
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-100 px-4 py-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
            <div className="text-yellow-200">Loading VIP seats...</div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="text-yellow-200 text-sm mb-2">
              {searchQuery ? `Found ${results.length} matching` : `${results.length} VIP seats`}
            </div>
            {results.map((seat) => (
              <div
                key={seat.seatId}
                className={`bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border-2 
                  transform hover:scale-[1.02] transition-all duration-200
                  ${seat.ticketPickedUp 
                    ? 'border-green-500 bg-green-50/95' 
                    : 'border-yellow-400/50'}`}
              >
                <div className="flex items-start gap-4">
                  {/* VIP Badge */}
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg
                      ${seat.ticketPickedUp 
                        ? 'bg-gradient-to-br from-green-400 to-green-600' 
                        : 'bg-gradient-to-br from-yellow-400 to-amber-500'}`}>
                      {seat.ticketPickedUp 
                        ? <Check className="w-8 h-8 text-white" />
                        : <Star className="w-8 h-8 text-white fill-white" />
                      }
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <span className="text-xl font-bold text-gray-800 truncate">
                        {seat.attendeeName || "Guest"}
                      </span>
                    </div>

                    {/* Seat Location */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <span className="text-lg text-gray-700">
                        <span className="font-semibold">{seat.section}</span>
                        {" · "}
                        <span className="text-red-600 font-bold">
                          Row {seat.row}, Seat {seat.seatNumber}
                        </span>
                      </span>
                    </div>

                    {/* Phone if available */}
                    {seat.attendeePhone && (
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{seat.attendeePhone}</span>
                      </div>
                    )}

                    {/* Pickup status */}
                    {seat.ticketPickedUp && seat.pickedUpAt && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Picked up at {new Date(seat.pickedUpAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => togglePickup(seat.seatId, seat.ticketPickedUp)}
                      disabled={updating === seat.seatId}
                      className={`px-4 py-3 rounded-xl font-bold text-sm shadow-lg transition-all
                        ${updating === seat.seatId ? 'opacity-50 cursor-wait' : 'hover:scale-105'}
                        ${seat.ticketPickedUp 
                          ? 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600' 
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500'
                        }`}
                    >
                      {updating === seat.seatId ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : seat.ticketPickedUp ? (
                        <span className="flex items-center gap-1">
                          <X className="w-4 h-4" /> Undo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Check className="w-4 h-4" /> Given
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-yellow-200 text-lg">
              {searchQuery ? "No matching VIP seats found" : "No VIP seats yet"}
            </div>
            {searchQuery && (
              <div className="text-yellow-100/60 text-sm mt-2">
                Try a different name or seat number
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="text-center mt-12 text-yellow-100/50 text-sm">
          <p>一马当先 · 光耀世界</p>
          <p className="mt-1">Leading the Way · Shining Across the World</p>
        </div>
      </div>
    </div>
  );
}
