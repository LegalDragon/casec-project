import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
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
} from "lucide-react";
import { eventProgramsAPI, slideShowsAPI, getAssetUrl } from "../../services/api";

export default function AdminEventPrograms() {
  const [programs, setPrograms] = useState([]);
  const [slideshows, setSlideshows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
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
      subtitle: "",
      description: "",
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
          subtitle: p.subtitle || "",
          description: p.description || "",
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 2026 佛罗里达华人春晚节目单"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 一马当先·光耀世界"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
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

  return (
    <div className="space-y-4">
      {/* Sections */}
      {program.sections?.map((section, sectionIdx) => (
        <div key={section.sectionId} className="border rounded-lg overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-50 p-3 flex items-center justify-between">
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
                <div>
                  <h4 className="font-bold text-gray-900">{section.title}</h4>
                  {section.subtitle && (
                    <p className="text-gray-500 text-sm">{section.subtitle}</p>
                  )}
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
            {section.items?.map((item, itemIdx) => (
              <div
                key={item.itemId}
                className="p-3 flex items-center gap-3 hover:bg-gray-50"
              >
                <span className="text-gray-400 text-sm w-8">{item.itemNumber}:</span>

                {editingItem?.itemId === item.itemId ? (
                  <ItemEditor
                    item={item}
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

// Section Editor Component
function SectionEditor({ section, onSave, onCancel }) {
  const [data, setData] = useState({
    title: section.title,
    subtitle: section.subtitle || "",
    description: section.description || "",
  });

  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        type="text"
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        className="flex-1 border rounded px-2 py-1 text-sm"
        placeholder="Section title"
      />
      <input
        type="text"
        value={data.subtitle}
        onChange={(e) => setData({ ...data, subtitle: e.target.value })}
        className="flex-1 border rounded px-2 py-1 text-sm"
        placeholder="Subtitle (optional)"
      />
      <button
        onClick={() => onSave(data)}
        className="p-1 text-emerald-600 hover:text-emerald-700"
      >
        <Save className="w-4 h-4" />
      </button>
      <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Item Editor Component
function ItemEditor({ item, onSave, onCancel }) {
  const [data, setData] = useState({
    itemNumber: item.itemNumber,
    title: item.title,
    performanceType: item.performanceType || "",
    performerNames: item.performerNames || "",
    description: item.description || "",
  });

  return (
    <div className="flex-1 grid grid-cols-5 gap-2">
      <input
        type="number"
        value={data.itemNumber}
        onChange={(e) => setData({ ...data, itemNumber: parseInt(e.target.value) || 1 })}
        className="border rounded px-2 py-1 text-sm w-16"
        placeholder="#"
      />
      <input
        type="text"
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        className="border rounded px-2 py-1 text-sm col-span-2"
        placeholder="Title (e.g., 《天鹅湖》)"
      />
      <input
        type="text"
        value={data.performanceType}
        onChange={(e) => setData({ ...data, performanceType: e.target.value })}
        className="border rounded px-2 py-1 text-sm"
        placeholder="Type (e.g., 芭蕾舞)"
      />
      <input
        type="text"
        value={data.performerNames}
        onChange={(e) => setData({ ...data, performerNames: e.target.value })}
        className="border rounded px-2 py-1 text-sm"
        placeholder="Performers"
      />
      <div className="col-span-5 flex justify-end gap-2">
        <button
          onClick={() => onSave(data)}
          className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 px-2 py-1 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
