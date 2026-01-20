import { useState, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, GripVertical,
  Video, Shuffle, Clock, Film, Settings
} from 'lucide-react';
import { slideShowsAPI, getAssetUrl } from '../../services/api';

// Background types
const BACKGROUND_TYPES = [
  { value: 'heroVideos', label: 'Hero Videos', description: 'Cycle through video backgrounds' },
  { value: 'color', label: 'Solid Color', description: 'Single color background' },
  { value: 'image', label: 'Static Image', description: 'Single image background' },
  { value: 'none', label: 'None', description: 'Transparent/no background' },
];

export default function BackgroundVideoEditor({
  slideId,
  backgroundType = 'heroVideos',
  backgroundColor,
  backgroundImageUrl,
  useRandomHeroVideos = false,
  backgroundVideos = [],
  sharedVideos = [],
  sharedImages = [],
  onUpdate,
  onRefresh,
  onToast,
}) {
  const [localBackgroundType, setLocalBackgroundType] = useState(backgroundType);
  const [localBackgroundColor, setLocalBackgroundColor] = useState(backgroundColor || '#000000');
  const [localBackgroundImageUrl, setLocalBackgroundImageUrl] = useState(backgroundImageUrl || '');
  const [localUseRandom, setLocalUseRandom] = useState(useRandomHeroVideos);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get background type label for collapsed view
  const getBackgroundLabel = () => {
    const type = BACKGROUND_TYPES.find(t => t.value === localBackgroundType);
    return type?.label || 'Hero Videos';
  };

  useEffect(() => {
    setLocalBackgroundType(backgroundType);
    setLocalBackgroundColor(backgroundColor || '#000000');
    setLocalBackgroundImageUrl(backgroundImageUrl || '');
    setLocalUseRandom(useRandomHeroVideos);
  }, [backgroundType, backgroundColor, backgroundImageUrl, useRandomHeroVideos]);

  // Save background settings
  const handleSaveSettings = () => {
    onUpdate({
      backgroundType: localBackgroundType,
      backgroundColor: localBackgroundColor,
      backgroundImageUrl: localBackgroundImageUrl,
      useRandomHeroVideos: localUseRandom,
    });
  };

  // Add background video
  const handleAddBackgroundVideo = async (videoData) => {
    setSaving(true);
    try {
      const response = await slideShowsAPI.createSlideBackgroundVideo({
        slideId,
        videoId: videoData.videoId || null,
        videoUrl: videoData.videoUrl || null,
        duration: videoData.duration || 5000,
        sortOrder: backgroundVideos.length,
        useRandom: videoData.useRandom || false,
      });

      if (response.success) {
        setShowAddVideo(false);
        onRefresh?.();
        onToast?.('success', 'Background video added');
      } else {
        onToast?.('error', response.message || 'Failed to add background video');
      }
    } catch (err) {
      onToast?.('error', 'Error adding background video');
    } finally {
      setSaving(false);
    }
  };

  // Update background video
  const handleUpdateBackgroundVideo = async (videoId, data) => {
    try {
      const response = await slideShowsAPI.updateSlideBackgroundVideo(videoId, data);
      if (response.success) {
        onRefresh?.();
        onToast?.('success', 'Background video updated');
      } else {
        onToast?.('error', response.message || 'Failed to update background video');
      }
    } catch (err) {
      onToast?.('error', 'Error updating background video');
    }
  };

  // Delete background video
  const handleDeleteBackgroundVideo = async (videoId) => {
    if (!confirm('Remove this background video?')) return;
    try {
      const response = await slideShowsAPI.deleteSlideBackgroundVideo(videoId);
      if (response.success) {
        onRefresh?.();
        onToast?.('success', 'Background video removed');
      } else {
        onToast?.('error', response.message || 'Failed to remove background video');
      }
    } catch (err) {
      onToast?.('error', 'Error removing background video');
    }
  };

  return (
    <div className="border-t pt-4">
      {/* Collapsible Header */}
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Film className="w-4 h-4" />
          Background Settings
          <span className="text-sm font-normal text-gray-500">({getBackgroundLabel()})</span>
        </h4>
        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-4 mt-4">
          {/* Background Type Selector */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Background Type</label>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setLocalBackgroundType(type.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    localBackgroundType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-sm">{type.label}</span>
                  <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific settings */}
          {localBackgroundType === 'color' && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={localBackgroundColor}
                  onChange={(e) => setLocalBackgroundColor(e.target.value)}
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={localBackgroundColor}
                  onChange={(e) => setLocalBackgroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>
          )}

          {localBackgroundType === 'image' && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">Background Image</label>
              {localBackgroundImageUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={getAssetUrl(localBackgroundImageUrl)}
                    alt="Background"
                    className="w-24 h-16 object-cover rounded border"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 truncate">{localBackgroundImageUrl}</p>
                    <button
                      onClick={() => setShowImagePicker(true)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Change image
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowImagePicker(true)}
                  className="w-full py-4 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-500"
                >
                  Select Background Image
                </button>
              )}

              {showImagePicker && (
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-2">Select from shared images:</p>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {sharedImages.map(img => (
                      <button
                        key={img.imageId}
                        onClick={() => {
                          setLocalBackgroundImageUrl(img.url);
                          setShowImagePicker(false);
                        }}
                        className="aspect-video rounded border overflow-hidden hover:ring-2 ring-blue-500"
                      >
                        <img src={getAssetUrl(img.url)} alt={img.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={localBackgroundImageUrl}
                    onChange={(e) => setLocalBackgroundImageUrl(e.target.value)}
                    className="w-full mt-2 px-2 py-1 border rounded text-sm"
                    placeholder="Or enter URL..."
                  />
                  <button
                    onClick={() => setShowImagePicker(false)}
                    className="mt-2 text-sm text-gray-500"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}

          {localBackgroundType === 'heroVideos' && (
            <div className="space-y-4">
              {/* Random option */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={localUseRandom}
                    onChange={(e) => setLocalUseRandom(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="font-medium text-sm flex items-center gap-1">
                      <Shuffle className="w-4 h-4" />
                      Use Random Videos
                    </span>
                    <p className="text-xs text-gray-500">
                      Randomly select from shared video pool instead of specific videos below
                    </p>
                  </div>
                </label>
              </div>

              {/* Video List (only shown if not using random) */}
              {!localUseRandom && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600">
                      Background Videos ({backgroundVideos.length})
                    </label>
                    <button
                      onClick={() => setShowAddVideo(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Video
                    </button>
                  </div>

                  {backgroundVideos.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed text-gray-500 text-sm">
                      No background videos. Add videos or enable random selection.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {backgroundVideos.map((bgVideo, index) => (
                        <BackgroundVideoItem
                          key={bgVideo.slideBackgroundVideoId}
                          bgVideo={bgVideo}
                          index={index}
                          sharedVideos={sharedVideos}
                          onUpdate={(data) => handleUpdateBackgroundVideo(bgVideo.slideBackgroundVideoId, data)}
                          onDelete={() => handleDeleteBackgroundVideo(bgVideo.slideBackgroundVideoId)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Add Video Panel */}
                  {showAddVideo && (
                    <AddBackgroundVideoPanel
                      sharedVideos={sharedVideos}
                      onAdd={handleAddBackgroundVideo}
                      onCancel={() => setShowAddVideo(false)}
                      saving={saving}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Save Button - always visible when expanded */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSettings}
              className="btn btn-primary"
            >
              Save Background Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Background Video Item Component
function BackgroundVideoItem({ bgVideo, index, sharedVideos, onUpdate, onDelete }) {
  const [localDuration, setLocalDuration] = useState(bgVideo.duration);
  const [localUseRandom, setLocalUseRandom] = useState(bgVideo.useRandom);

  useEffect(() => {
    setLocalDuration(bgVideo.duration);
    setLocalUseRandom(bgVideo.useRandom);
  }, [bgVideo]);

  const videoUrl = bgVideo.video?.url || bgVideo.videoUrl;

  const handleSave = () => {
    onUpdate({
      videoId: bgVideo.videoId,
      videoUrl: bgVideo.videoUrl,
      duration: localDuration,
      sortOrder: bgVideo.sortOrder,
      useRandom: localUseRandom,
    });
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
      <span className="text-sm text-gray-400 w-6">#{index + 1}</span>

      {localUseRandom ? (
        <div className="flex-1 flex items-center gap-2 text-purple-600">
          <Shuffle className="w-5 h-5" />
          <span className="text-sm">Random from pool</span>
        </div>
      ) : videoUrl ? (
        <video
          src={getAssetUrl(videoUrl)}
          className="w-24 h-14 object-cover rounded"
          muted
        />
      ) : (
        <div className="w-24 h-14 bg-gray-100 rounded flex items-center justify-center text-gray-400">
          <Video className="w-6 h-6" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <input
          type="number"
          value={localDuration}
          onChange={(e) => setLocalDuration(parseInt(e.target.value) || 5000)}
          className="w-20 px-2 py-1 border rounded text-sm"
          min="1000"
          step="500"
        />
        <span className="text-xs text-gray-500">ms</span>
      </div>

      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={localUseRandom}
          onChange={(e) => setLocalUseRandom(e.target.checked)}
          className="rounded"
        />
        <Shuffle className="w-3 h-3" />
      </label>

      <button
        onClick={handleSave}
        className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
      >
        Save
      </button>

      <button
        onClick={onDelete}
        className="p-1 text-red-500 hover:bg-red-50 rounded"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Add Background Video Panel
function AddBackgroundVideoPanel({ sharedVideos, onAdd, onCancel, saving }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [duration, setDuration] = useState(5000);
  const [useRandom, setUseRandom] = useState(false);

  const handleAdd = () => {
    onAdd({
      videoId: selectedVideo?.videoId || null,
      videoUrl: selectedVideo?.url || null,
      duration,
      useRandom,
    });
  };

  return (
    <div className="mt-3 bg-gray-50 p-4 rounded-lg border">
      <h5 className="font-medium text-sm mb-3">Add Background Video</h5>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useRandom}
            onChange={(e) => {
              setUseRandom(e.target.checked);
              if (e.target.checked) setSelectedVideo(null);
            }}
            className="rounded"
          />
          <span className="text-sm">Use random video from pool</span>
        </label>

        {!useRandom && (
          <div>
            <label className="block text-xs text-gray-500 mb-2">Select Video:</label>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
              {sharedVideos.map(vid => (
                <button
                  key={vid.videoId}
                  onClick={() => setSelectedVideo(vid)}
                  className={`aspect-video rounded border overflow-hidden ${
                    selectedVideo?.videoId === vid.videoId ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <video src={getAssetUrl(vid.url)} className="w-full h-full object-cover" muted />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-500 mb-1">Duration (ms)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 5000)}
            className="w-full px-3 py-2 border rounded text-sm"
            min="1000"
            step="500"
          />
          <p className="text-xs text-gray-400 mt-1">How long to show this video before switching</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="btn btn-primary"
            disabled={saving || (!useRandom && !selectedVideo)}
          >
            {saving ? 'Adding...' : 'Add Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
