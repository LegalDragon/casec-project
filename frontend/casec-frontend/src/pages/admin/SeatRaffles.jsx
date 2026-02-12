import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit, Trash2, Play, Eye, Loader2, X, Trophy, Users,
  Palette, Settings, Target, Ban, RotateCcw, ExternalLink, 
  Gift, ChevronUp, ChevronDown, Upload, Image as ImageIcon
} from "lucide-react";
import { seatRafflesAPI, seatingChartsAPI, slideShowsAPI, getAssetUrl } from "../../services/api";

export default function AdminSeatRaffles() {
  const [raffles, setRaffles] = useState([]);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    chartId: "", name: "", description: "", prizeName: "", prizeValue: ""
  });

  // Prize management state
  const [prizes, setPrizes] = useState([]);
  const [prizeForm, setPrizeForm] = useState({
    name: "", description: "", imageUrl: "", value: "", quantity: 1, displayOrder: 0
  });
  const [editingPrize, setEditingPrize] = useState(null);
  const [prizeUploading, setPrizeUploading] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    name: "", description: "",
    backgroundImageUrl: "", backgroundColor: "#1a1a2e", backgroundGradient: "",
    backgroundOpacity: 0.5,
    primaryColor: "#a855f7", secondaryColor: "#ec4899", winnerColor: "#22c55e",
    textColor: "#ffffff", seatColor: "#3a3a5a", seatHighlightColor: "#fbbf24",
    requireOccupied: true, allowRepeatWinners: false,
    animationSpeed: 100, animationSteps: 35,
    showAttendeeName: true, showAttendeePhone: false,
    prizeName: "", prizeDescription: "", prizeValue: ""
  });

  useEffect(() => {
    loadRaffles();
    loadCharts();
  }, []);

  const loadRaffles = async () => {
    try {
      setLoading(true);
      const response = await seatRafflesAPI.getAll();
      if (response.success) {
        setRaffles(response.data || []);
      }
    } catch (err) {
      setError("Failed to load raffles");
    } finally {
      setLoading(false);
    }
  };

  const loadCharts = async () => {
    try {
      const response = await seatingChartsAPI.getAll();
      if (response.success) {
        setCharts(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load charts", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await seatRafflesAPI.create({
        chartId: parseInt(createForm.chartId),
        name: createForm.name,
        description: createForm.description || null,
        prizeName: createForm.prizeName || null,
        prizeValue: createForm.prizeValue ? parseFloat(createForm.prizeValue) : null
      });
      if (response.success) {
        setShowCreateModal(false);
        setCreateForm({ chartId: "", name: "", description: "", prizeName: "", prizeValue: "" });
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

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!selectedRaffle) return;
    try {
      setSubmitting(true);
      const response = await seatRafflesAPI.update(selectedRaffle.seatRaffleId, {
        ...settingsForm,
        prizeValue: settingsForm.prizeValue ? parseFloat(settingsForm.prizeValue) : null,
        animationSpeed: parseInt(settingsForm.animationSpeed) || 100,
        animationSteps: parseInt(settingsForm.animationSteps) || 35,
        backgroundOpacity: parseFloat(settingsForm.backgroundOpacity) || 1
      });
      if (response.success) {
        setShowSettingsModal(false);
        setSelectedRaffle(null);
        loadRaffles();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to update settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this raffle?")) return;
    try {
      await seatRafflesAPI.delete(id);
      loadRaffles();
    } catch (err) {
      setError(err.message || "Failed to delete raffle");
    }
  };

  const handleReset = async (id) => {
    if (!confirm("Reset this raffle and clear all winners?")) return;
    try {
      await seatRafflesAPI.reset(id);
      loadRaffles();
    } catch (err) {
      setError(err.message || "Failed to reset raffle");
    }
  };

  const openSettings = async (raffle) => {
    try {
      const response = await seatRafflesAPI.getById(raffle.seatRaffleId);
      if (response.success) {
        const data = response.data;
        setSelectedRaffle(data);
        setSettingsForm({
          name: data.name || "",
          description: data.description || "",
          backgroundImageUrl: data.backgroundImageUrl || "",
          backgroundColor: data.backgroundColor || "#1a1a2e",
          backgroundGradient: data.backgroundGradient || "",
          backgroundOpacity: data.backgroundOpacity ?? 1,
          primaryColor: data.primaryColor || "#a855f7",
          secondaryColor: data.secondaryColor || "#ec4899",
          winnerColor: data.winnerColor || "#22c55e",
          textColor: data.textColor || "#ffffff",
          seatColor: data.seatColor || "#3a3a5a",
          seatHighlightColor: data.seatHighlightColor || "#fbbf24",
          requireOccupied: data.requireOccupied ?? true,
          allowRepeatWinners: data.allowRepeatWinners ?? false,
          animationSpeed: data.animationSpeed || 100,
          animationSteps: data.animationSteps || 35,
          showAttendeeName: data.showAttendeeName ?? true,
          showAttendeePhone: data.showAttendeePhone ?? false,
          prizeName: data.prizeName || "",
          prizeDescription: data.prizeDescription || "",
          prizeValue: data.prizeValue || ""
        });
        // Load prizes
        setPrizes(data.prizes || []);
        resetPrizeForm();
        setShowSettingsModal(true);
      }
    } catch (err) {
      setError(err.message || "Failed to load raffle");
    }
  };

  // Prize management functions
  const resetPrizeForm = () => {
    setPrizeForm({ name: "", description: "", imageUrl: "", value: "", quantity: 1, displayOrder: 0 });
    setEditingPrize(null);
  };

  const handlePrizeImageUpload = async (file) => {
    if (!file) return;
    setPrizeUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await slideShowsAPI.uploadImage(formData);
      if (response.success && response.data) {
        const imageUrl = response.data.url || response.data.filePath;
        setPrizeForm(prev => ({ ...prev, imageUrl }));
      } else {
        setError(response.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setPrizeUploading(false);
    }
  };

  const handleAddPrize = async () => {
    if (!selectedRaffle || !prizeForm.name.trim()) return;
    try {
      setSubmitting(true);
      const response = await seatRafflesAPI.addPrize(selectedRaffle.seatRaffleId, {
        name: prizeForm.name,
        description: prizeForm.description || null,
        imageUrl: prizeForm.imageUrl || null,
        value: prizeForm.value ? parseFloat(prizeForm.value) : null,
        quantity: parseInt(prizeForm.quantity) || 1,
        displayOrder: prizes.length
      });
      if (response.success) {
        setPrizes([...prizes, response.data]);
        resetPrizeForm();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to add prize');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePrize = async () => {
    if (!selectedRaffle || !editingPrize || !prizeForm.name.trim()) return;
    try {
      setSubmitting(true);
      const response = await seatRafflesAPI.updatePrize(selectedRaffle.seatRaffleId, editingPrize.prizeId, {
        name: prizeForm.name,
        description: prizeForm.description || null,
        imageUrl: prizeForm.imageUrl || null,
        value: prizeForm.value ? parseFloat(prizeForm.value) : null,
        quantity: parseInt(prizeForm.quantity) || 1,
        displayOrder: prizeForm.displayOrder
      });
      if (response.success) {
        setPrizes(prizes.map(p => p.prizeId === editingPrize.prizeId ? response.data : p));
        resetPrizeForm();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to update prize');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrize = async (prizeId) => {
    if (!selectedRaffle || !confirm('Delete this prize?')) return;
    try {
      const response = await seatRafflesAPI.deletePrize(selectedRaffle.seatRaffleId, prizeId);
      if (response.success) {
        setPrizes(prizes.filter(p => p.prizeId !== prizeId));
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete prize');
    }
  };

  const handleEditPrize = (prize) => {
    setEditingPrize(prize);
    setPrizeForm({
      name: prize.name || "",
      description: prize.description || "",
      imageUrl: prize.imageUrl || "",
      value: prize.value || "",
      quantity: prize.quantity || 1,
      displayOrder: prize.displayOrder || 0
    });
  };

  const movePrize = async (prizeId, direction) => {
    const index = prizes.findIndex(p => p.prizeId === prizeId);
    if (index < 0) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= prizes.length) return;

    // Swap in local state
    const newPrizes = [...prizes];
    [newPrizes[index], newPrizes[newIndex]] = [newPrizes[newIndex], newPrizes[index]];
    
    // Update displayOrder values
    newPrizes.forEach((p, i) => { p.displayOrder = i; });
    setPrizes(newPrizes);

    // Persist changes - send full prize objects to avoid clearing other fields
    try {
      const prize1 = newPrizes[index];
      const prize2 = newPrizes[newIndex];
      await Promise.all([
        seatRafflesAPI.updatePrize(selectedRaffle.seatRaffleId, prize1.prizeId, {
          name: prize1.name,
          description: prize1.description || null,
          imageUrl: prize1.imageUrl || null,
          value: prize1.value || null,
          quantity: prize1.quantity || 1,
          displayOrder: index
        }),
        seatRafflesAPI.updatePrize(selectedRaffle.seatRaffleId, prize2.prizeId, {
          name: prize2.name,
          description: prize2.description || null,
          imageUrl: prize2.imageUrl || null,
          value: prize2.value || null,
          quantity: prize2.quantity || 1,
          displayOrder: newIndex
        })
      ]);
    } catch (err) {
      console.error('Failed to reorder prizes:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Active": return "bg-green-100 text-green-800";
      case "Running": return "bg-yellow-100 text-yellow-800";
      case "Completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
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
          <h1 className="text-2xl font-bold text-gray-900">Seat Raffles</h1>
          <p className="text-gray-600">Create and run seat-based raffles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Raffle
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Raffles Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {raffles.map((raffle) => (
          <div key={raffle.seatRaffleId} className="card bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{raffle.name}</h3>
                  <p className="text-sm text-gray-500">{raffle.chartName}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(raffle.status)}`}>
                    {raffle.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  <a
                    href={`/seat-raffle/${raffle.seatRaffleId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="Open Raffle Page"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => openSettings(raffle)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(raffle.seatRaffleId)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {raffle.prizeName && (
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{raffle.prizeName}</span>
                  {raffle.prizeValue && (
                    <span className="text-sm text-green-600">${raffle.prizeValue}</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-red-600">{raffle.exclusionCount}</div>
                  <div className="text-xs text-gray-500">Excluded</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">{raffle.targetCount}</div>
                  <div className="text-xs text-gray-500">Targeted</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">{raffle.winnerCount}</div>
                  <div className="text-xs text-gray-500">Winners</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <a
                href={`/seat-raffle/${raffle.seatRaffleId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-sm flex-1 flex items-center justify-center gap-1"
              >
                <Play className="w-4 h-4" />
                Run Raffle
              </a>
              {raffle.winnerCount > 0 && (
                <button
                  onClick={() => handleReset(raffle.seatRaffleId)}
                  className="btn btn-secondary text-sm px-3"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {raffles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No seat raffles yet</h3>
          <p className="text-gray-500 mb-4">Create a raffle from a seating chart</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create Raffle
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Create Seat Raffle</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seating Chart *</label>
                <select
                  value={createForm.chartId}
                  onChange={(e) => setCreateForm({ ...createForm, chartId: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Select a chart...</option>
                  {charts.map((chart) => (
                    <option key={chart.chartId} value={chart.chartId}>
                      {chart.name} ({chart.totalSeats} seats)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raffle Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Grand Prize Drawing"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="input w-full"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Name</label>
                  <input
                    type="text"
                    value={createForm.prizeName}
                    onChange={(e) => setCreateForm({ ...createForm, prizeName: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., iPad Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.prizeValue}
                    onChange={(e) => setCreateForm({ ...createForm, prizeValue: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedRaffle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-bold text-lg">Raffle Settings</h3>
              <button onClick={() => { setShowSettingsModal(false); setSelectedRaffle(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSettings} className="p-4 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Basic Info
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Theme */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Theme
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                    <input
                      type="color"
                      value={settingsForm.backgroundColor}
                      onChange={(e) => setSettingsForm({ ...settingsForm, backgroundColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Primary</label>
                    <input
                      type="color"
                      value={settingsForm.primaryColor}
                      onChange={(e) => setSettingsForm({ ...settingsForm, primaryColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Secondary</label>
                    <input
                      type="color"
                      value={settingsForm.secondaryColor}
                      onChange={(e) => setSettingsForm({ ...settingsForm, secondaryColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Winner</label>
                    <input
                      type="color"
                      value={settingsForm.winnerColor}
                      onChange={(e) => setSettingsForm({ ...settingsForm, winnerColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                    <input
                      type="color"
                      value={settingsForm.textColor}
                      onChange={(e) => setSettingsForm({ ...settingsForm, textColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Seat</label>
                    <input
                      type="color"
                      value={settingsForm.seatColor}
                      onChange={(e) => setSettingsForm({ ...settingsForm, seatColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Highlight</label>
                    <input
                      type="color"
                      value={settingsForm.seatHighlightColor}
                      onChange={(e) => setSettingsForm({ ...settingsForm, seatHighlightColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                  <input
                    type="url"
                    value={settingsForm.backgroundImageUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, backgroundImageUrl: e.target.value })}
                    className="input w-full"
                    placeholder="https://..."
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Opacity: {Math.round(settingsForm.backgroundOpacity * 100)}%
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settingsForm.backgroundOpacity}
                      onChange={(e) => setSettingsForm({ ...settingsForm, backgroundOpacity: parseFloat(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settingsForm.backgroundOpacity}
                      onChange={(e) => setSettingsForm({ ...settingsForm, backgroundOpacity: parseFloat(e.target.value) || 0 })}
                      className="input w-20 text-center"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Controls the opacity of the background image/color overlay
                  </p>
                </div>
              </div>

              {/* Raffle Settings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Raffle Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Animation Speed (ms)</label>
                    <input
                      type="number"
                      min="50"
                      max="500"
                      value={settingsForm.animationSpeed}
                      onChange={(e) => setSettingsForm({ ...settingsForm, animationSpeed: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Animation Steps</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={settingsForm.animationSteps}
                      onChange={(e) => setSettingsForm({ ...settingsForm, animationSteps: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settingsForm.requireOccupied}
                      onChange={(e) => setSettingsForm({ ...settingsForm, requireOccupied: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Only occupied seats can win</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settingsForm.allowRepeatWinners}
                      onChange={(e) => setSettingsForm({ ...settingsForm, allowRepeatWinners: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Allow repeat winners</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settingsForm.showAttendeeName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, showAttendeeName: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Show attendee name</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settingsForm.showAttendeePhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, showAttendeePhone: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Show phone number</span>
                  </label>
                </div>
              </div>

              {/* Multiple Prizes Management */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" /> Multiple Prizes
                </h4>
                
                {/* Prize List */}
                {prizes.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {prizes.sort((a, b) => a.displayOrder - b.displayOrder).map((prize, index) => (
                      <div key={prize.prizeId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {prize.imageUrl ? (
                          <img 
                            src={getAssetUrl(prize.imageUrl)} 
                            alt={prize.name} 
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{prize.name}</div>
                          <div className="text-sm text-gray-500">
                            {prize.value && <span className="text-green-600">${prize.value}</span>}
                            {prize.value && prize.quantity && ' • '}
                            {prize.quantity > 1 && <span>Qty: {prize.quantity}</span>}
                            {prize.winnersCount > 0 && (
                              <span className="ml-2 text-purple-600">({prize.winnersCount} won)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => movePrize(prize.prizeId, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePrize(prize.prizeId, 'down')}
                            disabled={index === prizes.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditPrize(prize)}
                            className="p-1 text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrize(prize.prizeId)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/Edit Prize Form */}
                <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/50">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    {editingPrize ? 'Edit Prize' : 'Add New Prize'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                      <input
                        type="text"
                        value={prizeForm.name}
                        onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                        className="input w-full text-sm"
                        placeholder="e.g., iPad Pro"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Value ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={prizeForm.value}
                        onChange={(e) => setPrizeForm({ ...prizeForm, value: e.target.value })}
                        className="input w-full text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={prizeForm.quantity}
                        onChange={(e) => setPrizeForm({ ...prizeForm, quantity: e.target.value })}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
                      <div className="flex items-center gap-2">
                        {prizeForm.imageUrl ? (
                          <img 
                            src={getAssetUrl(prizeForm.imageUrl)} 
                            alt="Preview" 
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : null}
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handlePrizeImageUpload(e.target.files[0])}
                          />
                          <div className="btn btn-secondary text-xs w-full flex items-center justify-center gap-1">
                            {prizeUploading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-3 h-3" />
                                {prizeForm.imageUrl ? 'Change' : 'Upload'}
                              </>
                            )}
                          </div>
                        </label>
                        {prizeForm.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setPrizeForm({ ...prizeForm, imageUrl: '' })}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input
                      type="text"
                      value={prizeForm.description}
                      onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                      className="input w-full text-sm"
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {editingPrize ? (
                      <>
                        <button
                          type="button"
                          onClick={handleUpdatePrize}
                          disabled={!prizeForm.name.trim() || submitting}
                          className="btn btn-primary text-sm flex-1"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Prize'}
                        </button>
                        <button
                          type="button"
                          onClick={resetPrizeForm}
                          className="btn btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddPrize}
                        disabled={!prizeForm.name.trim() || submitting}
                        className="btn btn-primary text-sm flex items-center gap-1"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add Prize
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowSettingsModal(false); setSelectedRaffle(null); }} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
