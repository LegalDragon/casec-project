import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Trophy } from "lucide-react";
import { seatRafflesAPI } from "../services/api";

// Placeholder - full implementation coming soon
export default function SeatRaffleDrawing() {
  const { raffleId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [raffleId]);

  const loadData = async () => {
    try {
      const response = await seatRafflesAPI.getDrawingData(raffleId);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to load raffle data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-white p-6"
      style={{
        background: data?.backgroundGradient || 
          `linear-gradient(135deg, ${data?.backgroundColor || '#1a1a2e'} 0%, #16213e 100%)`
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: data?.primaryColor || '#a855f7' }}>
            {data?.name || 'Seat Raffle'}
          </h1>
          {data?.prizeName && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6" style={{ color: data?.winnerColor || '#22c55e' }} />
              <span className="text-xl">{data.prizeName}</span>
              {data.prizeValue && (
                <span className="text-green-400">${data.prizeValue}</span>
              )}
            </div>
          )}
        </div>

        <div className="text-center py-12 bg-gray-800/30 rounded-xl">
          <p className="text-xl text-gray-400">
            Full seat raffle drawing interface coming soon...
          </p>
          <p className="mt-4 text-gray-500">
            {data?.eligibleSeats} eligible seats • {data?.totalSeats} total
          </p>
        </div>
      </div>
    </div>
  );
}
