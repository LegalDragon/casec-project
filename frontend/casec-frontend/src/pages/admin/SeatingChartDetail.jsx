import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit, Trash2, Users, Grid3X3, Loader2, X,
  Upload, Download, Check, Save, RefreshCw, User, Filter
} from "lucide-react";
import { seatingChartsAPI } from "../../services/api";

export default function AdminSeatingChartDetail() {
  const { chartId } = useParams();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [filter, setFilter] = useState("all"); // all, occupied, empty, vip

  const [sectionForm, setSectionForm] = useState({
    name: "", shortName: "", displayOrder: 0, seatsPerRow: 10, rowLabels: "", startSeatNumber: 1, seatIncrement: 1, direction: "LTR"
  });

  const [seatForm, setSeatForm] = useState({
    attendeeName: "", attendeePhone: "", attendeeEmail: "", attendeeNotes: "", isVIP: false
  });

  const [importData, setImportData] = useState("");

  useEffect(() => {
    loadChart();
  }, [chartId]);

  const loadChart = async () => {
    try {
      setLoading(true);
      const response = await seatingChartsAPI.getById(chartId);
      if (response.success) {
        setChart(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to load chart");
    } finally {
      setLoading(false);
    }
  };

  // Group seats by section
  const seatsBySection = useMemo(() => {
    if (!chart?.seats) return {};
    const grouped = {};
    chart.sections.forEach(section => {
      grouped[section.sectionId] = chart.seats
        .filter(s => s.sectionId === section.sectionId)
        .sort((a, b) => {
          if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel);
          return a.seatNumber - b.seatNumber;
        });
    });
    return grouped;
  }, [chart]);

  // Get unique rows for each section
  const getRowsForSection = (sectionId) => {
    const seats = seatsBySection[sectionId] || [];
    const rows = [...new Set(seats.map(s => s.rowLabel))].sort();
    return rows;
  };

  // Get seats for a specific row
  const getSeatsForRow = (sectionId, rowLabel) => {
    return (seatsBySection[sectionId] || [])
      .filter(s => s.rowLabel === rowLabel)
      .sort((a, b) => a.seatNumber - b.seatNumber);
  };

  // Filter seats
  const filterSeat = (seat) => {
    switch (filter) {
      case "occupied": return seat.status === "Occupied" || seat.attendeeName;
      case "empty": return seat.status !== "Occupied" && !seat.attendeeName;
      case "vip": return seat.isVIP;
      default: return true;
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await seatingChartsAPI.addSection(chartId, sectionForm);
      if (response.success) {
        setShowSectionModal(false);
        setSectionForm({ name: "", shortName: "", displayOrder: 0, seatsPerRow: 10, rowLabels: "", startSeatNumber: 1, seatIncrement: 1, direction: "LTR" });
        loadChart();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to add section");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    if (!editingSection) return;
    try {
      setSaving(true);
      await seatingChartsAPI.updateSection(chartId, editingSection.sectionId, sectionForm);
      setShowSectionModal(false);
      setEditingSection(null);
      loadChart();
    } catch (err) {
      setError(err.message || "Failed to update section");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm("Delete this section and all its seats?")) return;
    try {
      await seatingChartsAPI.deleteSection(chartId, sectionId);
      loadChart();
    } catch (err) {
      setError(err.message || "Failed to delete section");
    }
  };

  const handleGenerateSeats = async (sectionId) => {
    if (!confirm("This will regenerate all seats for this section. Continue?")) return;
    try {
      setSaving(true);
      const response = await seatingChartsAPI.generateSeats(chartId, sectionId);
      if (response.success) {
        loadChart();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to generate seats");
    } finally {
      setSaving(false);
    }
  };

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setSeatForm({
      attendeeName: seat.attendeeName || "",
      attendeePhone: seat.attendeePhone || "",
      attendeeEmail: seat.attendeeEmail || "",
      attendeeNotes: seat.attendeeNotes || "",
      isVIP: seat.isVIP
    });
    setShowSeatModal(true);
  };

  const handleUpdateSeat = async (e) => {
    e.preventDefault();
    if (!selectedSeat) return;
    try {
      setSaving(true);
      await seatingChartsAPI.updateSeat(chartId, selectedSeat.seatId, seatForm);
      setShowSeatModal(false);
      setSelectedSeat(null);
      loadChart();
    } catch (err) {
      setError(err.message || "Failed to update seat");
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    try {
      setSaving(true);
      // Parse CSV/JSON data
      let seats = [];
      try {
        // Try JSON first
        seats = JSON.parse(importData);
      } catch {
        // Try CSV
        const lines = importData.trim().split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((h, idx) => {
            if (h.includes('section')) row.sectionName = values[idx];
            else if (h.includes('row')) row.rowLabel = values[idx];
            else if (h.includes('seat') && !h.includes('name')) row.seatNumber = parseInt(values[idx]) || 1;
            else if (h.includes('name')) row.attendeeName = values[idx];
            else if (h.includes('phone')) row.attendeePhone = values[idx];
            else if (h.includes('email')) row.attendeeEmail = values[idx];
            else if (h.includes('vip')) row.isVIP = values[idx]?.toLowerCase() === 'true' || values[idx] === '1';
            else if (h.includes('table')) row.tableNumber = parseInt(values[idx]) || null;
          });
          if (row.rowLabel && row.seatNumber) seats.push(row);
        }
      }

      const response = await seatingChartsAPI.importSeats(chartId, { seats });
      if (response.success) {
        const result = response.data;
        alert(`Import complete: ${result.imported} imported, ${result.updated} updated${result.errors?.length ? `, ${result.errors.length} errors` : ''}`);
        setShowImportModal(false);
        setImportData("");
        loadChart();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to import seats");
    } finally {
      setSaving(false);
    }
  };

  const openEditSection = (section) => {
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      shortName: section.shortName,
      displayOrder: section.displayOrder,
      seatsPerRow: section.seatsPerRow,
      rowLabels: section.rowLabels || "",
      startSeatNumber: section.startSeatNumber,
      seatIncrement: section.seatIncrement || 1,
      direction: section.direction || "LTR"
    });
    setShowSectionModal(true);
  };

  const getSeatColor = (seat) => {
    if (seat.isVIP) return "bg-purple-500 border-purple-600";
    if (seat.status === "Occupied" || seat.attendeeName) return "bg-green-500 border-green-600";
    if (seat.status === "Reserved") return "bg-yellow-500 border-yellow-600";
    if (seat.status === "Blocked") return "bg-red-500 border-red-600";
    return "bg-gray-400 border-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-custom" />
      </div>
    );
  }

  if (!chart) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Chart not found</p>
        <Link to="/admin/seating-charts" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Charts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/seating-charts" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{chart.name}</h1>
            <p className="text-gray-500">
              {chart.totalSeats} seats • {chart.occupiedSeats} occupied
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => {
              setEditingSection(null);
              setSectionForm({ name: "", shortName: "", displayOrder: chart.sections.length, seatsPerRow: 10, rowLabels: "", startSeatNumber: 1, seatIncrement: 1, direction: "LTR" });
              setShowSectionModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-40"
        >
          <option value="all">All Seats</option>
          <option value="occupied">Occupied</option>
          <option value="empty">Empty</option>
          <option value="vip">VIP</option>
        </select>
        <div className="flex gap-4 ml-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500"></span> Occupied
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-400"></span> Empty
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-purple-500"></span> VIP
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {chart.sections.map((section) => (
          <div key={section.sectionId} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{section.name}</h3>
                <p className="text-sm text-gray-500">
                  {section.seatCount || (seatsBySection[section.sectionId]?.length || 0)} seats • 
                  {section.seatsPerRow} per row • 
                  Start #{section.startSeatNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateSeats(section.sectionId)}
                  className="btn btn-secondary text-sm flex items-center gap-1"
                  title="Regenerate seats from row labels"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate
                </button>
                <button
                  onClick={() => openEditSection(section)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSection(section.sectionId)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {getRowsForSection(section.sectionId).length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No seats yet. Set row labels (e.g., "A,B,C,D,E") and click Generate.
                </p>
              ) : (
                <div className="space-y-2">
                  {getRowsForSection(section.sectionId).map((rowLabel) => (
                    <div key={rowLabel} className="flex items-center gap-2">
                      <span className="w-8 text-right text-sm font-medium text-gray-500">{rowLabel}</span>
                      <div className="flex gap-1 flex-wrap">
                        {getSeatsForRow(section.sectionId, rowLabel)
                          .filter(filterSeat)
                          .map((seat) => (
                            <button
                              key={seat.seatId}
                              onClick={() => handleSeatClick(seat)}
                              className={`w-8 h-8 rounded text-xs font-medium text-white border-2 
                                ${getSeatColor(seat)} hover:opacity-80 transition-opacity
                                flex items-center justify-center`}
                              title={`${section.shortName} ${rowLabel}-${seat.seatNumber}${seat.attendeeName ? `: ${seat.attendeeName}` : ''}`}
                            >
                              {seat.seatNumber}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {chart.sections.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Grid3X3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
          <p className="text-gray-500 mb-4">Add sections to define your seating layout</p>
          <button
            onClick={() => {
              setEditingSection(null);
              setSectionForm({ name: "", shortName: "", displayOrder: 0, seatsPerRow: 10, rowLabels: "", startSeatNumber: 1, seatIncrement: 1, direction: "LTR" });
              setShowSectionModal(true);
            }}
            className="btn btn-primary"
          >
            Add Section
          </button>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editingSection ? "Edit Section" : "Add Section"}
              </h3>
              <button onClick={() => { setShowSectionModal(false); setEditingSection(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingSection ? handleUpdateSection : handleAddSection} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Orchestra Center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                  <input
                    type="text"
                    value={sectionForm.shortName}
                    onChange={(e) => setSectionForm({ ...sectionForm, shortName: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Orch-Center"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={sectionForm.displayOrder}
                    onChange={(e) => setSectionForm({ ...sectionForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seats/Row</label>
                  <input
                    type="number"
                    min="1"
                    value={sectionForm.seatsPerRow}
                    onChange={(e) => setSectionForm({ ...sectionForm, seatsPerRow: parseInt(e.target.value) || 10 })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start #</label>
                  <input
                    type="number"
                    min="1"
                    value={sectionForm.startSeatNumber}
                    onChange={(e) => setSectionForm({ ...sectionForm, startSeatNumber: parseInt(e.target.value) || 1 })}
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seat Increment</label>
                  <select
                    value={sectionForm.seatIncrement}
                    onChange={(e) => setSectionForm({ ...sectionForm, seatIncrement: parseInt(e.target.value) })}
                    className="input w-full"
                  >
                    <option value={1}>Consecutive (1,2,3...)</option>
                    <option value={2}>Skip (odd or even)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Use "Skip" for theaters with odd/even split
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                  <select
                    value={sectionForm.direction}
                    onChange={(e) => setSectionForm({ ...sectionForm, direction: e.target.value })}
                    className="input w-full"
                  >
                    <option value="LTR">Left to Right</option>
                    <option value="RTL">Right to Left</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Row Labels</label>
                <input
                  type="text"
                  value={sectionForm.rowLabels}
                  onChange={(e) => setSectionForm({ ...sectionForm, rowLabels: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., A,B,C,D,E,F,G,H,J,K (comma-separated)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter row labels separated by commas. Click "Generate" to create seats.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowSectionModal(false); setEditingSection(null); }} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editingSection ? "Update" : "Add Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seat Modal */}
      {showSeatModal && selectedSeat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Edit Seat</h3>
                <p className="text-sm text-gray-500">
                  {chart.sections.find(s => s.sectionId === selectedSeat.sectionId)?.name} - 
                  Row {selectedSeat.rowLabel}, Seat {selectedSeat.seatNumber}
                </p>
              </div>
              <button onClick={() => { setShowSeatModal(false); setSelectedSeat(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSeat} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendee Name</label>
                <input
                  type="text"
                  value={seatForm.attendeeName}
                  onChange={(e) => setSeatForm({ ...seatForm, attendeeName: e.target.value })}
                  className="input w-full"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={seatForm.attendeePhone}
                  onChange={(e) => setSeatForm({ ...seatForm, attendeePhone: e.target.value })}
                  className="input w-full"
                  placeholder="555-123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={seatForm.attendeeEmail}
                  onChange={(e) => setSeatForm({ ...seatForm, attendeeEmail: e.target.value })}
                  className="input w-full"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={seatForm.attendeeNotes}
                  onChange={(e) => setSeatForm({ ...seatForm, attendeeNotes: e.target.value })}
                  className="input w-full"
                  placeholder="Special requests, dietary, etc."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVIP"
                  checked={seatForm.isVIP}
                  onChange={(e) => setSeatForm({ ...seatForm, isVIP: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isVIP" className="text-sm text-gray-700">VIP Seat</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowSeatModal(false); setSelectedSeat(null); }} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Import Seats</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Paste CSV or JSON data. CSV should have headers: section, row, seat, name, phone, email, vip
              </p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="input w-full h-64 font-mono text-sm"
                placeholder={`section,row,seat,name,phone,email,vip
Orch-Center,A,1,John Smith,555-1234,john@email.com,false
Orch-Center,A,2,Jane Doe,555-5678,jane@email.com,true`}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowImportModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleImport} disabled={saving || !importData.trim()} className="btn btn-primary flex-1">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
