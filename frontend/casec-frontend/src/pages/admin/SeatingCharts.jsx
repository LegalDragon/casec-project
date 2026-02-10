import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit, Trash2, Users, Grid3X3, Eye, Loader2, X,
  Upload, Download, ChevronRight, Check, Table2
} from "lucide-react";
import { seatingChartsAPI, eventsAPI } from "../../services/api";

export default function AdminSeatingCharts() {
  const [charts, setCharts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [chartForm, setChartForm] = useState({ name: "", description: "", eventId: "" });
  const [sectionForm, setSectionForm] = useState({
    name: "", shortName: "", displayOrder: 0, seatsPerRow: 10, rowLabels: "", startSeatNumber: 1
  });

  useEffect(() => {
    loadCharts();
    loadEvents();
  }, []);

  const loadCharts = async () => {
    try {
      setLoading(true);
      const response = await seatingChartsAPI.getAll();
      if (response.success) {
        setCharts(response.data || []);
      }
    } catch (err) {
      setError("Failed to load seating charts");
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      if (response.success) {
        setEvents(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  const handleCreateChart = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await seatingChartsAPI.create({
        name: chartForm.name,
        description: chartForm.description || null,
        eventId: chartForm.eventId ? parseInt(chartForm.eventId) : null
      });
      if (response.success) {
        setShowChartModal(false);
        setChartForm({ name: "", description: "", eventId: "" });
        loadCharts();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to create chart");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateChart = async (e) => {
    e.preventDefault();
    if (!selectedChart) return;
    try {
      setSubmitting(true);
      const response = await seatingChartsAPI.update(selectedChart.chartId, {
        name: chartForm.name,
        description: chartForm.description || null,
        eventId: chartForm.eventId ? parseInt(chartForm.eventId) : null
      });
      if (response.success) {
        setShowChartModal(false);
        setSelectedChart(null);
        setChartForm({ name: "", description: "", eventId: "" });
        loadCharts();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to update chart");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChart = async (chartId) => {
    if (!confirm("Delete this seating chart and all its seats?")) return;
    try {
      await seatingChartsAPI.delete(chartId);
      loadCharts();
    } catch (err) {
      setError(err.message || "Failed to delete chart");
    }
  };

  const openEditChart = (chart) => {
    setSelectedChart(chart);
    setChartForm({
      name: chart.name,
      description: chart.description || "",
      eventId: chart.eventId || ""
    });
    setShowChartModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Active": return "bg-green-100 text-green-800";
      case "Archived": return "bg-blue-100 text-blue-800";
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
          <h1 className="text-2xl font-bold text-gray-900">Seating Charts</h1>
          <p className="text-gray-600">Manage seating layouts for events</p>
        </div>
        <button
          onClick={() => {
            setSelectedChart(null);
            setChartForm({ name: "", description: "", eventId: "" });
            setShowChartModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Chart
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {charts.map((chart) => (
          <div key={chart.chartId} className="card bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{chart.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(chart.status)}`}>
                    {chart.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Link
                    to={`/admin/seating-charts/${chart.chartId}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit Chart"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteChart(chart.chartId)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {chart.description && (
                <p className="text-sm text-gray-600 mb-3">{chart.description}</p>
              )}
              
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{chart.sectionCount}</div>
                  <div className="text-xs text-gray-500">Sections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{chart.totalSeats}</div>
                  <div className="text-xs text-gray-500">Total Seats</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{chart.occupiedSeats}</div>
                  <div className="text-xs text-gray-500">Occupied</div>
                </div>
              </div>

              {chart.eventName && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Table2 className="w-4 h-4" />
                  {chart.eventName}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <Link
                to={`/admin/seating-charts/${chart.chartId}`}
                className="btn btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
              >
                <Grid3X3 className="w-4 h-4" />
                Manage
              </Link>
              <button
                onClick={() => openEditChart(chart)}
                className="btn btn-secondary text-sm px-3"
                title="Settings"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {charts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Grid3X3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No seating charts yet</h3>
          <p className="text-gray-500 mb-4">Create your first seating chart to get started</p>
          <button
            onClick={() => {
              setSelectedChart(null);
              setChartForm({ name: "", description: "", eventId: "" });
              setShowChartModal(true);
            }}
            className="btn btn-primary"
          >
            Create Chart
          </button>
        </div>
      )}

      {/* Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {selectedChart ? "Edit Chart" : "Create Seating Chart"}
              </h3>
              <button onClick={() => setShowChartModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={selectedChart ? handleUpdateChart : handleCreateChart} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={chartForm.name}
                  onChange={(e) => setChartForm({ ...chartForm, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Spring Gala 2026"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={chartForm.description}
                  onChange={(e) => setChartForm({ ...chartForm, description: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Event</label>
                <select
                  value={chartForm.eventId}
                  onChange={(e) => setChartForm({ ...chartForm, eventId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">-- No Event --</option>
                  {events.map((event) => (
                    <option key={event.eventId} value={event.eventId}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowChartModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : selectedChart ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
