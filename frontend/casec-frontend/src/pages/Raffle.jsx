import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Phone,
  User,
  Gift,
  Ticket,
  CheckCircle,
  Loader2,
  ArrowRight,
  Trophy,
  Camera,
  RefreshCw,
  Star,
  DollarSign,
} from "lucide-react";
import { rafflesAPI, raffleParticipantAPI, getAssetUrl } from "../services/api";

// Storage key for session tokens
const getSessionKey = (raffleId) => `raffle-session-${raffleId}`;

export default function Raffle() {
  const { raffleId } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Registration state
  const [step, setStep] = useState("register"); // register, verify, dashboard
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Participant state
  const [sessionToken, setSessionToken] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [purchaseResult, setPurchaseResult] = useState(null);

  // Load raffle data
  useEffect(() => {
    loadRaffle();
    // Check for existing session
    const storedSession = localStorage.getItem(getSessionKey(raffleId));
    if (storedSession) {
      setSessionToken(storedSession);
    }
  }, [raffleId]);

  // Load participant info if we have a session
  useEffect(() => {
    if (sessionToken) {
      loadParticipantInfo();
    }
  }, [sessionToken]);

  const loadRaffle = async () => {
    try {
      setLoading(true);
      const response = await rafflesAPI.getById(raffleId);
      if (response.success) {
        setRaffle(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to load raffle");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantInfo = async () => {
    try {
      const response = await raffleParticipantAPI.getMyInfo(
        raffleId,
        sessionToken
      );
      if (response.success && response.data) {
        setParticipant(response.data);
        if (response.data.isVerified) {
          setStep("dashboard");
        }
      }
    } catch (err) {
      // Session invalid, clear it
      localStorage.removeItem(getSessionKey(raffleId));
      setSessionToken(null);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await raffleParticipantAPI.register(raffleId, {
        name: name.trim(),
        phoneNumber: phone.trim(),
      });

      if (response.success) {
        const data = response.data;
        setSessionToken(data.sessionToken);
        localStorage.setItem(getSessionKey(raffleId), data.sessionToken);

        if (data.isVerified) {
          setParticipant(data);
          setStep("dashboard");
        } else {
          setStep("verify");
          if (data.otpMessage) {
            setOtpMessage(data.otpMessage);
          }
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await raffleParticipantAPI.verifyOtp(raffleId, {
        phoneNumber: phone,
        otpCode: otp.trim(),
      });

      if (response.success) {
        setParticipant(response.data);
        setStep("dashboard");
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const response = await raffleParticipantAPI.resendOtp(raffleId, {
        phoneNumber: phone,
      });

      if (response.success && response.data?.otpMessage) {
        setOtpMessage(response.data.otpMessage);
      }
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchase = async (tier) => {
    try {
      setSubmitting(true);
      setError(null);
      setPurchaseResult(null);

      const response = await raffleParticipantAPI.purchaseTickets(
        raffleId,
        { tierId: tier.tierId, paymentMethod: "Cash" },
        sessionToken
      );

      if (response.success) {
        setPurchaseResult(response.data);
        // Reload participant info
        await loadParticipantInfo();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Purchase failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSubmitting(true);
      const response = await raffleParticipantAPI.uploadAvatar(
        raffleId,
        file,
        sessionToken
      );

      if (response.success) {
        await loadParticipantInfo();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to upload avatar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (error && !raffle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-white" />
            <span className="text-white font-bold text-xl">Raffle</span>
          </div>
          {raffle?.status === "Drawing" && (
            <Link
              to={`/raffle/${raffleId}/drawing`}
              className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-yellow-300 transition-colors flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Watch Drawing
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Raffle Info Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          {raffle?.imageUrl && (
            <div className="h-48 bg-gray-200">
              <img
                src={getAssetUrl(raffle.imageUrl)}
                alt={raffle.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {raffle?.name}
            </h1>
            {raffle?.description && (
              <p className="text-gray-600 mb-4">{raffle.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-purple-600">
                <Ticket className="w-4 h-4" />
                <span>{raffle?.totalTicketsSold || 0} tickets sold</span>
              </div>
              {raffle?.drawingDate && (
                <div className="flex items-center gap-2 text-pink-600">
                  <Trophy className="w-4 h-4" />
                  <span>
                    Drawing:{" "}
                    {new Date(raffle.drawingDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prizes Section */}
        {raffle?.prizes?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-pink-500" />
              Prizes
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {raffle.prizes.map((prize) => (
                <div
                  key={prize.prizeId}
                  className={`rounded-xl p-4 border-2 ${
                    prize.isGrandPrize
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {prize.imageUrl ? (
                      <img
                        src={getAssetUrl(prize.imageUrl)}
                        alt={prize.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Gift className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">{prize.name}</h3>
                        {prize.isGrandPrize && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {prize.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {prize.description}
                        </p>
                      )}
                      {prize.value && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          Value: ${prize.value.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {step === "register" && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Register to Join
            </h2>
            <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === "verify" && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Verify Your Phone
            </h2>
            <p className="text-gray-600 text-center mb-6">
              We sent a verification code to {phone}
            </p>

            {otpMessage && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm mb-4 text-center">
                {otpMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center text-2xl tracking-widest py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={submitting}
                className="w-full text-purple-600 py-2 font-medium hover:underline flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Resend Code
              </button>
            </form>
          </div>
        )}

        {step === "dashboard" && participant && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {participant.avatarUrl ? (
                    <img
                      src={getAssetUrl(participant.avatarUrl)}
                      alt={participant.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-purple-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-gray-50">
                    <Camera className="w-4 h-4 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Welcome, {participant.name}!
                  </h2>
                  <p className="text-gray-600">{participant.phoneNumber}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Phone Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Status */}
            {participant.totalTickets > 0 && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl shadow-2xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Your Tickets
                </h3>
                <div className="text-4xl font-bold mb-2">
                  {participant.ticketStart?.toString().padStart(6, "0")} -{" "}
                  {participant.ticketEnd?.toString().padStart(6, "0")}
                </div>
                <p className="text-white/80">
                  {participant.totalTickets} tickets (${participant.totalPaid.toFixed(2)} paid)
                </p>
                {participant.paymentStatus === "Pending" && (
                  <div className="mt-3 bg-yellow-400/20 rounded-lg px-3 py-2 text-sm">
                    Payment pending confirmation
                  </div>
                )}
                {participant.paymentStatus === "Confirmed" && (
                  <div className="mt-3 bg-green-400/20 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Payment confirmed - Good luck!
                  </div>
                )}
              </div>
            )}

            {/* Purchase Result */}
            {purchaseResult && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <h3 className="font-bold text-lg">Purchase Successful!</h3>
                    <p>
                      You got tickets {purchaseResult.ticketStart.toString().padStart(6, "0")} -{" "}
                      {purchaseResult.ticketEnd.toString().padStart(6, "0")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buy Tickets */}
            {raffle?.status === "Active" && raffle?.ticketTiers?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Buy Tickets
                </h3>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {raffle.ticketTiers
                    .filter((t) => t.isActive)
                    .map((tier) => (
                      <div
                        key={tier.tierId}
                        className={`rounded-xl p-4 border-2 ${
                          tier.isFeatured
                            ? "border-purple-400 bg-purple-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        {tier.isFeatured && (
                          <div className="text-xs font-bold text-purple-600 uppercase mb-2">
                            Best Value
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-gray-800">
                              {tier.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {tier.ticketCount} tickets
                            </p>
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ${tier.price}
                          </div>
                        </div>
                        {tier.description && (
                          <p className="text-xs text-gray-500 mb-3">
                            {tier.description}
                          </p>
                        )}
                        <button
                          onClick={() => handlePurchase(tier)}
                          disabled={submitting}
                          className={`w-full py-2 rounded-lg font-bold transition-colors ${
                            tier.isFeatured
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          } disabled:opacity-50`}
                        >
                          {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          ) : (
                            "Buy Now"
                          )}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
