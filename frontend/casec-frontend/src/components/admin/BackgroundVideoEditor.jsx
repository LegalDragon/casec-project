import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Film } from 'lucide-react';
import { getAssetUrl } from '../../services/api';

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
  sharedImages = [],
  onUpdate,
}) {
  const [localBackgroundType, setLocalBackgroundType] = useState(backgroundType);
  const [localBackgroundColor, setLocalBackgroundColor] = useState(backgroundColor || '#000000');
  const [localBackgroundImageUrl, setLocalBackgroundImageUrl] = useState(backgroundImageUrl || '');
  const [localUseRandom, setLocalUseRandom] = useState(useRandomHeroVideos);
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
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
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
            <p className="text-sm text-gray-500">
              Uses videos from the shared video pool as background.
            </p>
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
