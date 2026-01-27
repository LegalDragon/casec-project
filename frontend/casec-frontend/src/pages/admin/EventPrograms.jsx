import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Save,
  X,
  Loader2,
  Music,
  Users,
  Calendar,
  MapPin,
  GripVertical,
  ExternalLink,
  Star,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { eventProgramsAPI, slideShowsAPI, performersAPI, getAssetUrl } from "../../services/api";

// Inline URL Copy Component for card view
function ProgramUrlCopy({ slug }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${window.location.origin}/program/${slug}`;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-400 font-mono truncate max-w-[200px]">
        /program/{slug}
      </span>
      <button
        onClick={handleCopy}
        className={`p-0.5 rounded transition-colors ${
          copied ? "text-green-600" : "text-gray-400 hover:text-gray-600"
        }`}
        title={copied ? "Copied!" : "Copy full URL"}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

// Copyable URL Component
function CopyableUrl({ slug }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${window.location.origin}/program/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
      <span className="text-sm text-gray-600 truncate flex-1 font-mono">
        {fullUrl}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className={`p-1.5 rounded-md transition-colors ${
          copied
            ? "bg-green-100 text-green-600"
            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
        }`}
        title="Copy URL"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300"
        title="Open in new tab"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

export default function AdminEventPrograms() {
  const [programs, setPrograms] = useState([]);
  const [slideshows, setSlideshows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    titleZh: "",
    titleEn: "",
    subtitle: "",
    subtitleZh: "",
    subtitleEn: "",
    description: "",
    descriptionZh: "",
    descriptionEn: "",
    imageUrl: "",
    eventDate: "",
    venue: "",
    venueAddress: "",
    slideShowIds: [],
    slug: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programsRes, slideshowsRes] = await Promise.all([
        eventProgramsAPI.getAll(true),
        slideShowsAPI.getAllAdmin(),
      ]);

      if (programsRes.success) {
        setPrograms(programsRes.data);
      }
      if (slideshowsRes.success) {
        setSlideshows(slideshowsRes.data);
      }
    } catch (err) {
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (programId) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
      } else {
        next.add(programId);
      }
      return next;
    });
  };

  const handleCreate = () => {
    setEditingProgram(null);
    setFormData({
      title: "",
      titleZh: "",
      titleEn: "",
      subtitle: "",
      subtitleZh: "",
      subtitleEn: "",
      description: "",
      descriptionZh: "",
      descriptionEn: "",
      imageUrl: "",
      eventDate: "",
      venue: "",
      venueAddress: "",
      slideShowIds: [],
      slug: "",
    });
    setShowForm(true);
  };

  const handleEdit = async (program) => {
    try {
      const response = await eventProgramsAPI.getById(program.programId);
      if (response.success) {
        const p = response.data;
        setEditingProgram(p);
        setFormData({
          title: p.title || "",
          titleZh: p.titleZh || "",
          titleEn: p.titleEn || "",
          subtitle: p.subtitle || "",
          subtitleZh: p.subtitleZh || "",
          subtitleEn: p.subtitleEn || "",
          description: p.description || "",
          descriptionZh: p.descriptionZh || "",
          descriptionEn: p.descriptionEn || "",
          imageUrl: p.imageUrl || "",
          eventDate: p.eventDate ? p.eventDate.split("T")[0] : "",
          venue: p.venue || "",
          venueAddress: p.venueAddress || "",
          slideShowIds: p.slideShowIds || [],
          slug: p.slug || "",
          status: p.status || "Draft",
          isFeatured: p.isFeatured || false,
        });
        setShowForm(true);
      }
    } catch (err) {
      setError(err?.message || "Failed to load program");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let response;

      if (editingProgram) {
        response = await eventProgramsAPI.update(editingProgram.programId, {
          ...formData,
          eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : null,
        });
      } else {
        response = await eventProgramsAPI.create({
          ...formData,
          eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : null,
        });
      }

      if (response.success) {
        setShowForm(false);
        loadData();
      } else {
        setError(response.message || "Failed to save");
      }
    } catch (err) {
      setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (programId) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      const response = await eventProgramsAPI.delete(programId);
      if (response.success) {
        loadData();
      } else {
        setError(response.message || "Failed to delete");
      }
    } catch (err) {
      setError(err?.message || "Failed to delete");
    }
  };

  const handleStatusChange = async (program, newStatus) => {
    try {
      const response = await eventProgramsAPI.update(program.programId, {
        status: newStatus,
      });
      if (response.success) {
        loadData();
      }
    } catch (err) {
      setError(err?.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Programs</h1>
          <p className="text-gray-500 mt-1">
            Manage event programs and their content
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Program
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Programs List */}
      <div className="space-y-4">
        {programs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            No programs yet. Create your first program!
          </div>
        ) : (
          programs.map((program) => (
            <ProgramCard
              key={program.programId}
              program={program}
              expanded={expandedPrograms.has(program.programId)}
              onToggle={() => toggleExpand(program.programId)}
              onEdit={() => handleEdit(program)}
              onDelete={() => handleDelete(program.programId)}
              onStatusChange={(status) => handleStatusChange(program, status)}
              onReload={loadData}
            />
          ))
        )}
      </div>

      {/* Edit/Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingProgram ? "Edit Program" : "New Program"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Title Section */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Title *
                  <span className="text-xs text-gray-400">(Bilingual)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Chinese 中文</label>
                    <input
                      type="text"
                      value={formData.titleZh}
                      onChange={(e) =>
                        setFormData({ ...formData, titleZh: e.target.value, title: e.target.value || formData.title })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="中文标题"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">English</label>
                    <input
                      type="text"
                      value={formData.titleEn}
                      onChange={(e) =>
                        setFormData({ ...formData, titleEn: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="English title"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle Section */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Subtitle
                  <span className="text-xs text-gray-400">(Bilingual)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Chinese 中文</label>
                    <input
                      type="text"
                      value={formData.subtitleZh}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitleZh: e.target.value, subtitle: e.target.value || formData.subtitle })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="中文副标题"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">English</label>
                    <input
                      type="text"
                      value={formData.subtitleEn}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitleEn: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="English subtitle"
                    />
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Description
                  <span className="text-xs text-gray-400">(Bilingual, supports HTML)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Chinese 中文</label>
                    <HtmlEditor
                      value={formData.descriptionZh}
                      onChange={(val) =>
                        setFormData({ ...formData, descriptionZh: val, description: val || formData.description })
                      }
                      placeholder="中文描述..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">English</label>
                    <HtmlEditor
                      value={formData.descriptionEn}
                      onChange={(val) =>
                        setFormData({ ...formData, descriptionEn: val })
                      }
                      placeholder="English description..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Address
                </label>
                <input
                  type="text"
                  value={formData.venueAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, venueAddress: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 2026-spring-gala"
                />
                {(editingProgram || formData.slug) && (
                  <CopyableUrl slug={formData.slug || editingProgram?.programId} />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slideshows
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {slideshows.map((slideshow) => (
                    <label
                      key={slideshow.slideShowId}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={formData.slideShowIds?.includes(
                          slideshow.slideShowId
                        )}
                        onChange={(e) => {
                          const ids = formData.slideShowIds || [];
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              slideShowIds: [...ids, slideshow.slideShowId],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              slideShowIds: ids.filter(
                                (id) => id !== slideshow.slideShowId
                              ),
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{slideshow.name}</span>
                    </label>
                  ))}
                  {slideshows.length === 0 && (
                    <p className="text-gray-400 text-sm">No slideshows available</p>
                  )}
                </div>
              </div>

              {editingProgram && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({ ...formData, isFeatured: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Featured Program</span>
                  </label>
                </>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Program Card Component with expandable sections
function ProgramCard({
  program,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onStatusChange,
  onReload,
}) {
  const [fullProgram, setFullProgram] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (expanded && !fullProgram) {
      loadFullProgram();
    }
  }, [expanded]);

  const loadFullProgram = async () => {
    try {
      setLoadingDetails(true);
      const response = await eventProgramsAPI.getById(program.programId);
      if (response.success) {
        setFullProgram(response.data);
      }
    } catch (err) {
      console.error("Error loading program:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const statusColors = {
    Draft: "bg-gray-100 text-gray-600",
    Published: "bg-green-100 text-green-600",
    Archived: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}

        {program.imageUrl && (
          <img
            src={getAssetUrl(program.imageUrl)}
            alt={program.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 truncate">{program.title}</h3>
            {program.isFeatured && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          {program.subtitle && (
            <p className="text-gray-500 text-sm truncate">{program.subtitle}</p>
          )}
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
            {program.eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(program.eventDate).toLocaleDateString()}
              </span>
            )}
            <span>{program.sectionCount} sections</span>
            <span>{program.itemCount} items</span>
          </div>
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <ProgramUrlCopy slug={program.slug || program.programId} />
          </div>
        </div>

        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[program.status]}`}>
          {program.status}
        </span>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <a
            href={`/program/${program.slug || program.programId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t p-4">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : fullProgram ? (
            <ProgramEditor
              program={fullProgram}
              onReload={() => {
                loadFullProgram();
                onReload();
              }}
            />
          ) : (
            <p className="text-gray-400 text-center py-4">Failed to load details</p>
          )}
        </div>
      )}
    </div>
  );
}

// Program Editor Component
function ProgramEditor({ program, onReload }) {
  const [editingSection, setEditingSection] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [performers, setPerformers] = useState([]);

  // Load performers list on mount
  useEffect(() => {
    const loadPerformers = async () => {
      try {
        const response = await performersAPI.getAllAdmin();
        if (response.success) {
          setPerformers(response.data);
        }
      } catch (err) {
        console.error("Error loading performers:", err);
      }
    };
    loadPerformers();
  }, []);

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      setSaving(true);
      const response = await eventProgramsAPI.createSection(program.programId, {
        title: newSectionTitle,
        displayOrder: program.sections?.length || 0,
      });
      if (response.success) {
        setNewSectionTitle("");
        onReload();
      }
    } catch (err) {
      console.error("Error adding section:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm("Delete this section and all its items?")) return;

    try {
      const response = await eventProgramsAPI.deleteSection(sectionId);
      if (response.success) {
        onReload();
      }
    } catch (err) {
      console.error("Error deleting section:", err);
    }
  };

  const handleAddItem = async (sectionId) => {
    try {
      const response = await eventProgramsAPI.createItem(sectionId, {
        title: "New Item",
        itemNumber: 1,
        displayOrder: 0,
      });
      if (response.success) {
        onReload();
        setEditingItem(response.data);
      }
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Delete this item?")) return;

    try {
      const response = await eventProgramsAPI.deleteItem(itemId);
      if (response.success) {
        onReload();
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const handleMoveSection = async (sectionId, direction) => {
    const sections = [...(program.sections || [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sections.findIndex(s => s.sectionId === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    // Swap the sections
    [sections[currentIndex], sections[newIndex]] = [sections[newIndex], sections[currentIndex]];

    // Create new order
    const sectionOrder = sections.map((s, idx) => ({
      sectionId: s.sectionId,
      displayOrder: idx,
    }));

    try {
      setSaving(true);
      const response = await eventProgramsAPI.reorderSections(program.programId, sectionOrder);
      if (response.success) {
        onReload();
      }
    } catch (err) {
      console.error("Error reordering sections:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveItem = async (sectionId, itemId, direction) => {
    const section = program.sections?.find(s => s.sectionId === sectionId);
    if (!section) return;

    const items = [...(section.items || [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = items.findIndex(i => i.itemId === itemId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    // Swap the items
    [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

    // Create new order
    const itemOrder = items.map((i, idx) => ({
      itemId: i.itemId,
      displayOrder: idx,
    }));

    try {
      setSaving(true);
      const response = await eventProgramsAPI.reorderItems(sectionId, itemOrder);
      if (response.success) {
        onReload();
      }
    } catch (err) {
      console.error("Error reordering items:", err);
    } finally {
      setSaving(false);
    }
  };

  // Sort sections by displayOrder
  const sortedSections = [...(program.sections || [])].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-4">
      {/* Sections */}
      {sortedSections.map((section, sectionIdx) => (
        <div key={section.sectionId} className={`border rounded-lg overflow-hidden ${section.isActive === false ? 'opacity-60' : ''}`}>
          {/* Section Header */}
          <div className={`p-3 flex items-center justify-between ${section.isActive === false ? 'bg-gray-200' : 'bg-gray-50'}`}>
            {editingSection?.sectionId === section.sectionId ? (
              <SectionEditor
                section={section}
                onSave={async (data) => {
                  try {
                    await eventProgramsAPI.updateSection(section.sectionId, data);
                    setEditingSection(null);
                    onReload();
                  } catch (err) {
                    console.error("Error updating section:", err);
                  }
                }}
                onCancel={() => setEditingSection(null)}
              />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {/* Section Move Buttons */}
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleMoveSection(section.sectionId, 'up')}
                      disabled={sectionIdx === 0 || saving}
                      className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move section up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(section.sectionId, 'down')}
                      disabled={sectionIdx === sortedSections.length - 1 || saving}
                      className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move section down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{section.title}</h4>
                      {section.isActive === false && (
                        <span className="text-xs bg-gray-400 text-white px-1.5 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    {section.subtitle && (
                      <p className="text-gray-500 text-sm">{section.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddItem(section.sectionId)}
                    className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-200"
                  >
                    + Add Item
                  </button>
                  <button
                    onClick={() => setEditingSection(section)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.sectionId)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Section Items */}
          <div className="divide-y">
            {[...(section.items || [])].sort((a, b) => a.displayOrder - b.displayOrder).map((item, itemIdx, sortedItems) => (
              <div
                key={item.itemId}
                className={`p-3 flex items-center gap-3 hover:bg-gray-50 ${item.isActive === false ? 'opacity-50 bg-gray-100' : ''}`}
              >
                {/* Item Move Buttons */}
                <div className="flex flex-col">
                  <button
                    onClick={() => handleMoveItem(section.sectionId, item.itemId, 'up')}
                    disabled={itemIdx === 0 || saving}
                    className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move item up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMoveItem(section.sectionId, item.itemId, 'down')}
                    disabled={itemIdx === sortedItems.length - 1 || saving}
                    className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move item down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-gray-400 text-sm w-8">{item.itemNumber}:</span>

                {editingItem?.itemId === item.itemId ? (
                  <ItemEditor
                    item={item}
                    performers={performers}
                    onSave={async (data) => {
                      try {
                        await eventProgramsAPI.updateItem(item.itemId, data);
                        setEditingItem(null);
                        onReload();
                      } catch (err) {
                        console.error("Error updating item:", err);
                      }
                    }}
                    onCancel={() => setEditingItem(null)}
                  />
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.title}</span>
                      {item.performanceType && (
                        <span className="text-gray-400 text-sm ml-2">
                          ({item.performanceType})
                        </span>
                      )}
                      {item.isActive === false && (
                        <span className="text-xs bg-gray-400 text-white px-1.5 py-0.5 rounded ml-2">Inactive</span>
                      )}
                    </div>
                    {item.performerNames && (
                      <span className="text-emerald-600 text-sm">
                        {item.performerNames}
                      </span>
                    )}
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.itemId)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {(!section.items || section.items.length === 0) && (
              <p className="p-3 text-gray-400 text-sm text-center">
                No items yet
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Add New Section */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title (e.g., 第一乐章)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
        />
        <button
          onClick={handleAddSection}
          disabled={saving || !newSectionTitle.trim()}
          className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>
    </div>
  );
}

// Simple HTML Editor Component
function HtmlEditor({ value, onChange, placeholder, rows = 3 }) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsHtmlMode(!isHtmlMode)}
          className={`text-xs px-2 py-0.5 rounded ${isHtmlMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
        >
          {isHtmlMode ? 'HTML' : 'Text'}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded px-2 py-1 text-sm ${isHtmlMode ? 'font-mono text-xs bg-gray-50' : ''}`}
        rows={rows}
        placeholder={isHtmlMode ? '<p>HTML content...</p>' : placeholder}
      />
      {isHtmlMode && value && (
        <div className="text-xs text-gray-500 border-t pt-1 mt-1">
          <span className="font-medium">Preview:</span>
          <div
            className="mt-1 p-2 bg-white border rounded prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}
    </div>
  );
}

// Section Editor Component
function SectionEditor({ section, onSave, onCancel }) {
  const [data, setData] = useState({
    title: section.title || "",
    titleZh: section.titleZh || "",
    titleEn: section.titleEn || "",
    subtitle: section.subtitle || "",
    subtitleZh: section.subtitleZh || "",
    subtitleEn: section.subtitleEn || "",
    description: section.description || "",
    descriptionZh: section.descriptionZh || "",
    descriptionEn: section.descriptionEn || "",
    displayOrder: section.displayOrder ?? 0,
    isActive: section.isActive ?? true,
  });

  return (
    <div className="flex-1 space-y-3 p-3 bg-white rounded-lg border">
      {/* Display Order & Active Status */}
      <div className="flex items-center gap-6">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Display Order</label>
          <input
            type="number"
            value={data.displayOrder}
            onChange={(e) => setData({ ...data, displayOrder: parseInt(e.target.value) || 0 })}
            className="w-24 border rounded px-2 py-1 text-sm"
            min="0"
          />
          <span className="text-xs text-gray-400 ml-2">Lower numbers appear first</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isActive}
            onChange={(e) => setData({ ...data, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
          <span className="text-xs text-gray-400">(visible to public)</span>
        </label>
      </div>

      {/* Title - Bilingual */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Title (Bilingual)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={data.titleZh}
            onChange={(e) => setData({ ...data, titleZh: e.target.value, title: e.target.value || data.title })}
            className="border rounded px-2 py-1 text-sm"
            placeholder="中文标题"
          />
          <input
            type="text"
            value={data.titleEn}
            onChange={(e) => setData({ ...data, titleEn: e.target.value })}
            className="border rounded px-2 py-1 text-sm"
            placeholder="English Title"
          />
        </div>
      </div>

      {/* Subtitle - Bilingual */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Subtitle (Bilingual, optional)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={data.subtitleZh}
            onChange={(e) => setData({ ...data, subtitleZh: e.target.value, subtitle: e.target.value || data.subtitle })}
            className="border rounded px-2 py-1 text-sm"
            placeholder="中文副标题"
          />
          <input
            type="text"
            value={data.subtitleEn}
            onChange={(e) => setData({ ...data, subtitleEn: e.target.value })}
            className="border rounded px-2 py-1 text-sm"
            placeholder="English Subtitle"
          />
        </div>
      </div>

      {/* Description - Bilingual with HTML support */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Description (Bilingual, supports HTML)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-gray-400">Chinese 中文</span>
            <HtmlEditor
              value={data.descriptionZh}
              onChange={(val) => setData({ ...data, descriptionZh: val, description: val || data.description })}
              placeholder="中文描述..."
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">English</span>
            <HtmlEditor
              value={data.descriptionEn}
              onChange={(val) => setData({ ...data, descriptionEn: val })}
              placeholder="English description..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 px-3 py-1 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(data)}
          className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
}

// Item Editor Component
function ItemEditor({ item, performers = [], onSave, onCancel }) {
  // Find initial performer IDs from existing linked performers or by name match
  const getInitialPerformerIds = () => {
    const ids = [];
    // Check if item has linked performers
    if (item.performers?.length > 0) {
      item.performers.forEach(p => {
        if (p.performerId) ids.push(p.performerId);
      });
    }
    // If no linked performers, try to match by name
    if (ids.length === 0 && item.performerNames) {
      const p1 = performers.find(p =>
        p.name === item.performerNames || p.chineseName === item.performerNames || p.englishName === item.performerNames
      );
      if (p1) ids.push(p1.performerId);
    }
    if (ids.length < 2 && item.performerNames2) {
      const p2 = performers.find(p =>
        p.name === item.performerNames2 || p.chineseName === item.performerNames2 || p.englishName === item.performerNames2
      );
      if (p2) ids.push(p2.performerId);
    }
    return ids;
  };

  const [data, setData] = useState({
    itemNumber: item.itemNumber,
    displayOrder: item.displayOrder ?? 0,
    isActive: item.isActive ?? true,
    title: item.title || "",
    titleZh: item.titleZh || "",
    titleEn: item.titleEn || "",
    performanceType: item.performanceType || "",
    performanceTypeZh: item.performanceTypeZh || "",
    performanceTypeEn: item.performanceTypeEn || "",
    performerNames: item.performerNames || "",
    performerNames2: item.performerNames2 || "",
    description: item.description || "",
    descriptionZh: item.descriptionZh || "",
    descriptionEn: item.descriptionEn || "",
    performerIds: getInitialPerformerIds(),
  });

  // Handle performer selection from dropdown
  const handlePerformerSelect = (performerId, fieldName, index) => {
    const id = performerId ? parseInt(performerId) : null;
    const performer = id ? performers.find(p => p.performerId === id) : null;
    const displayName = performer ? (performer.name || performer.chineseName || performer.englishName || "") : "";

    // Update performer IDs array
    const newIds = [...(data.performerIds || [])];
    if (index === 0) {
      newIds[0] = id;
    } else {
      newIds[1] = id;
    }
    // Filter out nulls and keep valid IDs
    const filteredIds = newIds.filter(pid => pid != null);

    setData({ ...data, [fieldName]: displayName, performerIds: filteredIds });
  };

  // Find matching performer ID from name (for dropdown default selection)
  const findPerformerIdByName = (name) => {
    if (!name) return "";
    const performer = performers.find(p =>
      p.name === name || p.chineseName === name || p.englishName === name
    );
    return performer ? performer.performerId : "";
  };

  return (
    <div className="flex-1 space-y-3 p-3 bg-white rounded-lg border">
      {/* Row 1: Item Number + Display Order + Title (Bilingual) */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-1">
          <label className="text-xs font-medium text-gray-600">#</label>
          <input
            type="number"
            value={data.itemNumber}
            onChange={(e) => setData({ ...data, itemNumber: parseInt(e.target.value) || 1 })}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="#"
          />
        </div>
        <div className="col-span-1">
          <label className="text-xs font-medium text-gray-600">Order</label>
          <input
            type="number"
            value={data.displayOrder}
            onChange={(e) => setData({ ...data, displayOrder: parseInt(e.target.value) || 0 })}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="0"
            min="0"
            title="Display order - lower numbers appear first"
          />
        </div>
        <div className="col-span-3">
          <label className="text-xs font-medium text-gray-600">Title 中文</label>
          <input
            type="text"
            value={data.titleZh}
            onChange={(e) => setData({ ...data, titleZh: e.target.value, title: e.target.value || data.title })}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="中文标题"
          />
        </div>
        <div className="col-span-4">
          <label className="text-xs font-medium text-gray-600">Title English</label>
          <input
            type="text"
            value={data.titleEn}
            onChange={(e) => setData({ ...data, titleEn: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="English Title"
          />
        </div>
        <div className="col-span-3">
          <label className="text-xs font-medium text-gray-600">Performer 1</label>
          <select
            value={findPerformerIdByName(data.performerNames)}
            onChange={(e) => handlePerformerSelect(e.target.value, "performerNames", 0)}
            className="w-full border rounded px-2 py-1 text-sm mb-1"
          >
            <option value="">-- Select --</option>
            {performers.map(p => (
              <option key={p.performerId} value={p.performerId}>
                {p.name || p.chineseName}{p.englishName && p.name !== p.englishName ? ` (${p.englishName})` : ""}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={data.performerNames}
            onChange={(e) => setData({ ...data, performerNames: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Or type name"
          />
        </div>
      </div>

      {/* Row 1b: Performer 2 */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-9"></div>
        <div className="col-span-3">
          <label className="text-xs font-medium text-gray-600">Performer 2</label>
          <select
            value={findPerformerIdByName(data.performerNames2)}
            onChange={(e) => handlePerformerSelect(e.target.value, "performerNames2", 1)}
            className="w-full border rounded px-2 py-1 text-sm mb-1"
          >
            <option value="">-- None --</option>
            {performers.map(p => (
              <option key={p.performerId} value={p.performerId}>
                {p.name || p.chineseName}{p.englishName && p.name !== p.englishName ? ` (${p.englishName})` : ""}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={data.performerNames2}
            onChange={(e) => setData({ ...data, performerNames2: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Or type name"
          />
        </div>
      </div>

      {/* Row 2: Performance Type (Bilingual) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-gray-600">Type 中文</label>
          <input
            type="text"
            value={data.performanceTypeZh}
            onChange={(e) => setData({ ...data, performanceTypeZh: e.target.value, performanceType: e.target.value || data.performanceType })}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="中文类型 (e.g., 芭蕾舞)"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Type English</label>
          <input
            type="text"
            value={data.performanceTypeEn}
            onChange={(e) => setData({ ...data, performanceTypeEn: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="English Type (e.g., Ballet)"
          />
        </div>
      </div>

      {/* Row 3: Description (Bilingual with HTML support) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-gray-600">Description 中文 (supports HTML)</label>
          <HtmlEditor
            value={data.descriptionZh}
            onChange={(val) => setData({ ...data, descriptionZh: val, description: val || data.description })}
            placeholder="中文描述..."
            rows={2}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Description English (supports HTML)</label>
          <HtmlEditor
            value={data.descriptionEn}
            onChange={(val) => setData({ ...data, descriptionEn: val })}
            placeholder="English description..."
            rows={2}
          />
        </div>
      </div>

      {/* Active Status & Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isActive}
            onChange={(e) => setData({ ...data, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
          <span className="text-xs text-gray-400">(visible to public)</span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 px-3 py-1 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(data)}
            className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
