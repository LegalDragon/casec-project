import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Image,
  Video,
  LayoutGrid,
  Users,
  Music,
  ChevronDown,
} from "lucide-react";
import { contentCardsAPI, getAssetUrl } from "../../services/api";

const ENTITY_TYPES = [
  { value: "ProgramItem", label: "Program Item", icon: Music },
  { value: "Performer", label: "Performer", icon: Users },
];

const MEDIA_TYPES = [
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
];

const LAYOUT_TYPES = [
  { value: "left", label: "Media Left" },
  { value: "right", label: "Media Right" },
  { value: "top", label: "Media Top" },
  { value: "bottom", label: "Media Bottom" },
  { value: "overlay", label: "Overlay" },
  { value: "fullwidth", label: "Full Width" },
];

export default function AdminContentCards() {
  const [cards, setCards] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [programItems, setProgramItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");

  const [formData, setFormData] = useState({
    entityType: "ProgramItem",
    entityId: "",
    titleZh: "",
    titleEn: "",
    bodyTextZh: "",
    bodyTextEn: "",
    mediaUrl: "",
    mediaType: "image",
    layoutType: "left",
    displayOrder: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsRes, performersRes, itemsRes] = await Promise.all([
        contentCardsAPI.getAll(),
        contentCardsAPI.getPerformersWithCards(),
        contentCardsAPI.getProgramItemsWithCards(),
      ]);

      if (cardsRes.success) setCards(cardsRes.data);
      if (performersRes.success) setPerformers(performersRes.data);
      if (itemsRes.success) setProgramItems(itemsRes.data);
    } catch (err) {
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCard(null);
    setFormData({
      entityType: "ProgramItem",
      entityId: "",
      titleZh: "",
      titleEn: "",
      bodyTextZh: "",
      bodyTextEn: "",
      mediaUrl: "",
      mediaType: "image",
      layoutType: "left",
      displayOrder: 0,
    });
    setShowForm(true);
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      entityType: card.entityType,
      entityId: card.entityId.toString(),
      titleZh: card.titleZh || "",
      titleEn: card.titleEn || "",
      bodyTextZh: card.bodyTextZh || "",
      bodyTextEn: card.bodyTextEn || "",
      mediaUrl: card.mediaUrl || "",
      mediaType: card.mediaType || "image",
      layoutType: card.layoutType || "left",
      displayOrder: card.displayOrder || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.entityId) {
      setError("Please select an entity");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        entityId: parseInt(formData.entityId),
        displayOrder: parseInt(formData.displayOrder) || 0,
      };

      if (editingCard) {
        await contentCardsAPI.update(editingCard.cardId, payload);
      } else {
        await contentCardsAPI.create(payload);
      }

      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err?.message || "Failed to save card");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (card) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      await contentCardsAPI.delete(card.cardId);
      loadData();
    } catch (err) {
      setError(err?.message || "Failed to delete card");
    }
  };

  const getEntityName = (card) => {
    if (card.entityType === "Performer") {
      const performer = performers.find((p) => p.performerId === card.entityId);
      return performer?.name || `Performer #${card.entityId}`;
    } else {
      const item = programItems.find((i) => i.itemId === card.entityId);
      return item?.title || `Item #${card.entityId}`;
    }
  };

  const getEntityOptions = () => {
    if (formData.entityType === "Performer") {
      return performers.map((p) => ({
        value: p.performerId.toString(),
        label: p.chineseName ? `${p.name} (${p.chineseName})` : p.name,
      }));
    } else {
      return programItems.map((i) => ({
        value: i.itemId.toString(),
        label: `${i.title}${i.programTitle ? ` - ${i.programTitle}` : ""}`,
      }));
    }
  };

  const filteredCards = cards.filter((card) => {
    if (filterType === "all") return true;
    return card.entityType === filterType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Cards</h1>
          <p className="text-gray-600 mt-1">
            Manage cards that display detailed information about program items and
            performers
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Card
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({cards.length})
        </button>
        <button
          onClick={() => setFilterType("ProgramItem")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === "ProgramItem"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Music className="w-4 h-4" />
          Program Items (
          {cards.filter((c) => c.entityType === "ProgramItem").length})
        </button>
        <button
          onClick={() => setFilterType("Performer")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === "Performer"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Performers ({cards.filter((c) => c.entityType === "Performer").length})
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <div
            key={card.cardId}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card Preview */}
            {card.mediaUrl && (
              <div className="aspect-video bg-gray-100 relative">
                {card.mediaType === "video" ? (
                  <video
                    src={getAssetUrl(card.mediaUrl)}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={getAssetUrl(card.mediaUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                  {card.layoutType}
                </div>
              </div>
            )}

            {/* Card Info */}
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                {card.entityType === "Performer" ? (
                  <Users className="w-3 h-3" />
                ) : (
                  <Music className="w-3 h-3" />
                )}
                <span>{card.entityType}</span>
              </div>

              <h3 className="font-medium text-gray-900 mb-1">
                {getEntityName(card)}
              </h3>

              {(card.titleZh || card.titleEn) && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {card.titleZh || card.titleEn}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Order: {card.displayOrder}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(card)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(card)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredCards.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No cards found. Create one to get started.
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">
                {editingCard ? "Edit Card" : "Create Card"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Entity Type & Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type
                  </label>
                  <select
                    value={formData.entityType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entityType: e.target.value,
                        entityId: "",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!!editingCard}
                  >
                    {ENTITY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.entityType === "Performer"
                      ? "Select Performer"
                      : "Select Program Item"}
                  </label>
                  <select
                    value={formData.entityId}
                    onChange={(e) =>
                      setFormData({ ...formData, entityId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!editingCard}
                  >
                    <option value="">Select...</option>
                    {getEntityOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Chinese)
                  </label>
                  <input
                    type="text"
                    value={formData.titleZh}
                    onChange={(e) =>
                      setFormData({ ...formData, titleZh: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="中文标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) =>
                      setFormData({ ...formData, titleEn: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="English title"
                  />
                </div>
              </div>

              {/* Body Text */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Text (Chinese)
                  </label>
                  <textarea
                    value={formData.bodyTextZh}
                    onChange={(e) =>
                      setFormData({ ...formData, bodyTextZh: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="中文内容..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Text (English)
                  </label>
                  <textarea
                    value={formData.bodyTextEn}
                    onChange={(e) =>
                      setFormData({ ...formData, bodyTextEn: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="English content..."
                  />
                </div>
              </div>

              {/* Media */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Media URL
                  </label>
                  <input
                    type="text"
                    value={formData.mediaUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, mediaUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="/uploads/image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Media Type
                  </label>
                  <div className="flex gap-2">
                    {MEDIA_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, mediaType: type.value })
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                          formData.mediaType === type.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Layout & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layout
                  </label>
                  <select
                    value={formData.layoutType}
                    onChange={(e) =>
                      setFormData({ ...formData, layoutType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {LAYOUT_TYPES.map((layout) => (
                      <option key={layout.value} value={layout.value}>
                        {layout.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Media Preview */}
              {formData.mediaUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-sm">
                    {formData.mediaType === "video" ? (
                      <video
                        src={getAssetUrl(formData.mediaUrl)}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={getAssetUrl(formData.mediaUrl)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingCard ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
