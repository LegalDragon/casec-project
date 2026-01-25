import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Ticket,
  Gift,
  Trophy,
  Users,
  DollarSign,
  Calendar,
  Play,
  Eye,
  Loader2,
  X,
  Star,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { rafflesAPI, getAssetUrl } from "../../services/api";

export default function AdminRaffles() {
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [raffleForm, setRaffleForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    ticketDigits: 6,
    startDate: "",
    endDate: "",
    drawingDate: "",
  });

  const [prizeForm, setPrizeForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    value: "",
    displayOrder: 0,
    isGrandPrize: false,
  });

  const [tierForm, setTierForm] = useState({
    name: "",
    price: "",
    ticketCount: "",
    description: "",
    displayOrder: 0,
    isActive: true,
    isFeatured: false,
  });

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      setLoading(true);
      const response = await rafflesAPI.getAllAdmin();
      if (response.success) {
        setRaffles(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to load raffles");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRaffle = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await rafflesAPI.create({
        ...raffleForm,
        ticketDigits: parseInt(raffleForm.ticketDigits) || 6,
      });
      if (response.success) {
        setShowRaffleModal(false);
        resetRaffleForm();
        loadRaffles();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to create raffle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRaffle = async (e) => {
    e.preventDefault();
    if (!selectedRaffle) return;
    try {
      setSubmitting(true);
      const response = await rafflesAPI.update(selectedRaffle.raffleId, {
        ...raffleForm,
        ticketDigits: parseInt(raffleForm.ticketDigits) || 6,
      });
      if (response.success) {
        setShowRaffleModal(false);
        setSelectedRaffle(null);
        resetRaffleForm();
        loadRaffles();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to update raffle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRaffle = async (raffleId) => {
    if (!confirm("Are you sure you want to delete this raffle?")) return;
    try {
      await rafflesAPI.delete(raffleId);
      loadRaffles();
    } catch (err) {
      setError(err.message || "Failed to delete raffle");
    }
  };

  const handleUpdateStatus = async (raffleId, status) => {
    try {
      await rafflesAPI.update(raffleId, { status });
      loadRaffles();
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleAddPrize = async (e) => {
    e.preventDefault();
    if (!selectedRaffle) return;
    try {
      setSubmitting(true);
      const response = await rafflesAPI.addPrize(selectedRaffle.raffleId, {
        ...prizeForm,
        value: prizeForm.value ? parseFloat(prizeForm.value) : null,
        displayOrder: parseInt(prizeForm.displayOrder) || 0,
      });
      if (response.success) {
        setShowPrizeModal(false);
        resetPrizeForm();
        loadRaffles();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to add prize");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrize = async (prizeId) => {
    if (!confirm("Delete this prize?")) return;
    try {
      await rafflesAPI.deletePrize(prizeId);
      loadRaffles();
    } catch (err) {
      setError(err.message || "Failed to delete prize");
    }
  };

  const handleAddTier = async (e) => {
    e.preventDefault();
    if (!selectedRaffle) return;
    try {
      setSubmitting(true);
      const response = await rafflesAPI.addTier(selectedRaffle.raffleId, {
        ...tierForm,
        price: parseFloat(tierForm.price),
        ticketCount: parseInt(tierForm.ticketCount),
        displayOrder: parseInt(tierForm.displayOrder) || 0,
      });
      if (response.success) {
        setShowTierModal(false);
        resetTierForm();
        loadRaffles();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to add tier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTier = async (tierId) => {
    if (!confirm("Delete this tier?")) return;
    try {
      await rafflesAPI.deleteTier(tierId);
      loadRaffles();
    } catch (err) {
      setError(err.message || "Failed to delete tier");
    }
  };

  const loadParticipants = async (raffle) => {
    setSelectedRaffle(raffle);
    setShowParticipantsModal(true);
    try {
      const response = await rafflesAPI.getParticipants(raffle.raffleId);
      if (response.success) {
        setParticipants(response.data);
      }
    } catch (err) {
      setError("Failed to load participants");
    }
  };

  const handleConfirmPayment = async (participantId, confirm) => {
    try {
      await rafflesAPI.confirmPayment(participantId, { confirm });
      loadParticipants(selectedRaffle);
    } catch (err) {
      setError(err.message || "Failed to update payment");
    }
  };

  const resetRaffleForm = () => {
    setRaffleForm({
      name: "",
      description: "",
      imageUrl: "",
      ticketDigits: 6,
      startDate: "",
      endDate: "",
      drawingDate: "",
    });
  };

  const resetPrizeForm = () => {
    setPrizeForm({
      name: "",
      description: "",
      imageUrl: "",
      value: "",
      displayOrder: 0,
      isGrandPrize: false,
    });
  };

  const resetTierForm = () => {
    setTierForm({
      name: "",
      price: "",
      ticketCount: "",
      description: "",
      displayOrder: 0,
      isActive: true,
      isFeatured: false,
    });
  };

  const openEditRaffle = (raffle) => {
    setSelectedRaffle(raffle);
    setRaffleForm({
      name: raffle.name,
      description: raffle.description || "",
      imageUrl: raffle.imageUrl || "",
      ticketDigits: raffle.ticketDigits,
      startDate: raffle.startDate ? raffle.startDate.split("T")[0] : "",
      endDate: raffle.endDate ? raffle.endDate.split("T")[0] : "",
      drawingDate: raffle.drawingDate ? raffle.drawingDate.split("T")[0] : "",
    });
    setShowRaffleModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Active":
        return "bg-green-100 text-green-800";
      case "Drawing":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-custom" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raffle Management</h1>
          <p className="text-gray-600">Create and manage raffle events</p>
        </div>
        <button
          onClick={() => {
            setSelectedRaffle(null);
            resetRaffleForm();
            setShowRaffleModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Raffle
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="float-right">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Raffles Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {raffles.map((raffle) => (
          <div
            key={raffle.raffleId}
            className="card bg-white rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {raffle.name}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(
                      raffle.status
                    )}`}
                  >
                    {raffle.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/raffle/${raffle.raffleId}/drawing`}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="View Drawing"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => openEditRaffle(raffle)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRaffle(raffle.raffleId)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-3 gap-4 text-center border-b">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {raffle.totalTicketsSold}
                </div>
                <div className="text-xs text-gray-500">Tickets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${raffle.totalRevenue.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Revenue</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {raffle.participantCount}
                </div>
                <div className="text-xs text-gray-500">Participants</div>
              </div>
            </div>

            {/* Prizes */}
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Prizes ({raffle.prizes?.length || 0})
                </h4>
                <button
                  onClick={() => {
                    setSelectedRaffle(raffle);
                    resetPrizeForm();
                    setShowPrizeModal(true);
                  }}
                  className="text-xs text-purple-600 hover:underline"
                >
                  + Add Prize
                </button>
              </div>
              <div className="space-y-2">
                {raffle.prizes?.slice(0, 3).map((prize) => (
                  <div
                    key={prize.prizeId}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1"
                  >
                    <div className="flex items-center gap-2">
                      {prize.isGrandPrize && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                      <span>{prize.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeletePrize(prize.prizeId)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {raffle.prizes?.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{raffle.prizes.length - 3} more
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Tiers */}
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Ticket Tiers ({raffle.ticketTiers?.length || 0})
                </h4>
                <button
                  onClick={() => {
                    setSelectedRaffle(raffle);
                    resetTierForm();
                    setShowTierModal(true);
                  }}
                  className="text-xs text-purple-600 hover:underline"
                >
                  + Add Tier
                </button>
              </div>
              <div className="space-y-2">
                {raffle.ticketTiers?.map((tier) => (
                  <div
                    key={tier.tierId}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1"
                  >
                    <div className="flex items-center gap-2">
                      {tier.isFeatured && (
                        <Star className="w-3 h-3 text-purple-500 fill-purple-500" />
                      )}
                      <span>
                        {tier.name}: ${tier.price} / {tier.ticketCount} tickets
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTier(tier.tierId)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex flex-wrap gap-2">
              <button
                onClick={() => loadParticipants(raffle)}
                className="btn btn-secondary text-sm flex items-center gap-1"
              >
                <Users className="w-4 h-4" />
                Participants
              </button>
              {raffle.status === "Draft" && (
                <button
                  onClick={() =>
                    handleUpdateStatus(raffle.raffleId, "Active")
                  }
                  className="btn bg-green-500 text-white text-sm flex items-center gap-1"
                >
                  <Play className="w-4 h-4" />
                  Activate
                </button>
              )}
              {raffle.status === "Active" && (
                <Link
                  to={`/raffle/${raffle.raffleId}/drawing`}
                  className="btn bg-yellow-500 text-white text-sm flex items-center gap-1"
                >
                  <Trophy className="w-4 h-4" />
                  Start Drawing
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {raffles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Ticket className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No raffles yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first raffle to get started
          </p>
          <button
            onClick={() => {
              setSelectedRaffle(null);
              resetRaffleForm();
              setShowRaffleModal(true);
            }}
            className="btn btn-primary"
          >
            Create Raffle
          </button>
        </div>
      )}

      {/* Raffle Modal */}
      {showRaffleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {selectedRaffle ? "Edit Raffle" : "Create Raffle"}
              </h3>
              <button
                onClick={() => setShowRaffleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={selectedRaffle ? handleUpdateRaffle : handleCreateRaffle}
              className="p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={raffleForm.name}
                  onChange={(e) =>
                    setRaffleForm({ ...raffleForm, name: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={raffleForm.description}
                  onChange={(e) =>
                    setRaffleForm({ ...raffleForm, description: e.target.value })
                  }
                  className="input w-full"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={raffleForm.imageUrl}
                  onChange={(e) =>
                    setRaffleForm({ ...raffleForm, imageUrl: e.target.value })
                  }
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Number Digits
                </label>
                <input
                  type="number"
                  min="4"
                  max="10"
                  value={raffleForm.ticketDigits}
                  onChange={(e) =>
                    setRaffleForm({
                      ...raffleForm,
                      ticketDigits: e.target.value,
                    })
                  }
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={raffleForm.startDate}
                    onChange={(e) =>
                      setRaffleForm({ ...raffleForm, startDate: e.target.value })
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={raffleForm.endDate}
                    onChange={(e) =>
                      setRaffleForm({ ...raffleForm, endDate: e.target.value })
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drawing Date
                  </label>
                  <input
                    type="date"
                    value={raffleForm.drawingDate}
                    onChange={(e) =>
                      setRaffleForm({
                        ...raffleForm,
                        drawingDate: e.target.value,
                      })
                    }
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRaffleModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : selectedRaffle ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prize Modal */}
      {showPrizeModal && selectedRaffle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">
                Add Prize to {selectedRaffle.name}
              </h3>
              <button
                onClick={() => setShowPrizeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPrize} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize Name *
                </label>
                <input
                  type="text"
                  value={prizeForm.name}
                  onChange={(e) =>
                    setPrizeForm({ ...prizeForm, name: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={prizeForm.description}
                  onChange={(e) =>
                    setPrizeForm({ ...prizeForm, description: e.target.value })
                  }
                  className="input w-full"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={prizeForm.value}
                    onChange={(e) =>
                      setPrizeForm({ ...prizeForm, value: e.target.value })
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={prizeForm.displayOrder}
                    onChange={(e) =>
                      setPrizeForm({
                        ...prizeForm,
                        displayOrder: e.target.value,
                      })
                    }
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={prizeForm.imageUrl}
                  onChange={(e) =>
                    setPrizeForm({ ...prizeForm, imageUrl: e.target.value })
                  }
                  className="input w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isGrandPrize"
                  checked={prizeForm.isGrandPrize}
                  onChange={(e) =>
                    setPrizeForm({ ...prizeForm, isGrandPrize: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="isGrandPrize" className="text-sm text-gray-700">
                  Grand Prize
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPrizeModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Add Prize"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tier Modal */}
      {showTierModal && selectedRaffle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">
                Add Ticket Tier to {selectedRaffle.name}
              </h3>
              <button
                onClick={() => setShowTierModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTier} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Name *
                </label>
                <input
                  type="text"
                  value={tierForm.name}
                  onChange={(e) =>
                    setTierForm({ ...tierForm, name: e.target.value })
                  }
                  className="input w-full"
                  placeholder="e.g., Basic, Value Pack"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tierForm.price}
                    onChange={(e) =>
                      setTierForm({ ...tierForm, price: e.target.value })
                    }
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tickets *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tierForm.ticketCount}
                    onChange={(e) =>
                      setTierForm({ ...tierForm, ticketCount: e.target.value })
                    }
                    className="input w-full"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={tierForm.description}
                  onChange={(e) =>
                    setTierForm({ ...tierForm, description: e.target.value })
                  }
                  className="input w-full"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tierActive"
                    checked={tierForm.isActive}
                    onChange={(e) =>
                      setTierForm({ ...tierForm, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label htmlFor="tierActive" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tierFeatured"
                    checked={tierForm.isFeatured}
                    onChange={(e) =>
                      setTierForm({ ...tierForm, isFeatured: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="tierFeatured"
                    className="text-sm text-gray-700"
                  >
                    Featured (Best Value)
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTierModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Add Tier"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && selectedRaffle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {selectedRaffle.name} - Participants ({participants.length})
              </h3>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
              {participants.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No participants yet
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Participant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tickets
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Paid
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {participants.map((p) => (
                      <tr key={p.participantId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.avatarUrl ? (
                              <img
                                src={getAssetUrl(p.avatarUrl)}
                                alt={p.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                {p.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {p.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {p.phoneNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.totalTickets > 0 ? (
                            <div>
                              <div className="font-mono text-sm">
                                {p.ticketStart?.toString().padStart(6, "0")} -{" "}
                                {p.ticketEnd?.toString().padStart(6, "0")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {p.totalTickets} tickets
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">
                            ${p.totalPaid.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              p.paymentStatus === "Confirmed"
                                ? "bg-green-100 text-green-800"
                                : p.paymentStatus === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {p.paymentStatus === "Confirmed" && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {p.paymentStatus === "Pending" && (
                              <Clock className="w-3 h-3" />
                            )}
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.paymentStatus === "Pending" && p.totalPaid > 0 && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleConfirmPayment(p.participantId, true)
                                }
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Confirm"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleConfirmPayment(p.participantId, false)
                                }
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
