import { useState, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, GripVertical,
  Type, Image, Video, Settings, Move, Clock, Play, Square,
  AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { slideShowsAPI, getAssetUrl } from '../../services/api';

// Animation options
const ANIMATIONS_IN = [
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'slideInLeft', label: 'Slide In Left' },
  { value: 'slideInRight', label: 'Slide In Right' },
  { value: 'zoomIn', label: 'Zoom In' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'blurIn', label: 'Blur In' },
];

const ANIMATIONS_OUT = [
  { value: '', label: 'None (Stay on screen)' },
  { value: 'fadeOut', label: 'Fade Out' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'zoomOut', label: 'Zoom Out' },
];

const HORIZONTAL_ALIGN = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
];

const VERTICAL_ALIGN = [
  { value: 'top', label: 'Top', icon: ArrowUp },
  { value: 'middle', label: 'Middle', icon: Minus },
  { value: 'bottom', label: 'Bottom', icon: ArrowDown },
];

const TEXT_SIZES = [
  { value: 'xs', label: 'XS (14px)' },
  { value: 'sm', label: 'Small (16px)' },
  { value: 'base', label: 'Base (18px)' },
  { value: 'lg', label: 'Large (20px)' },
  { value: 'xl', label: 'XL (24px)' },
  { value: '2xl', label: '2XL (30px)' },
  { value: '3xl', label: '3XL (36px)' },
  { value: '4xl', label: '4XL (48px)' },
  { value: '5xl', label: '5XL (60px)' },
  { value: '6xl', label: '6XL (72px)' },
  { value: '7xl', label: '7XL (96px)' },
  { value: '8xl', label: '8XL (128px)' },
];
const IMAGE_SIZES = ['small', 'medium', 'large', 'full'];
const VIDEO_SIZES = ['small', 'medium', 'large'];

// Default properties for each object type
const getDefaultProperties = (objectType) => {
  switch (objectType) {
    case 'text':
      return {
        content: '',
        fontSize: '4xl',
        fontWeight: 'bold',
        fontFamily: '',
        color: '#ffffff',
        backgroundColor: '',
        textAlign: 'center',
        maxWidth: 800,
      };
    case 'image':
      return {
        imageUrl: '',
        size: 'medium',
        objectFit: 'cover',
        borderRadius: 'rounded-lg',
        shadow: '',
        opacity: 100,
      };
    case 'video':
      return {
        videoUrl: '',
        size: 'medium',
        autoPlay: true,
        muted: true,
        loop: true,
        showControls: false,
        borderRadius: 'rounded-lg',
      };
    default:
      return {};
  }
};

export default function SlideObjectEditor({
  slideId,
  objects = [],
  sharedVideos = [],
  sharedImages = [],
  onRefresh,
  onToast,
}) {
  const [expanded, setExpanded] = useState({});
  const [showAddObject, setShowAddObject] = useState(false);
  const [saving, setSaving] = useState(false);

  // Toggle object expansion
  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Add new object
  const handleAddObject = async (objectType) => {
    setSaving(true);
    try {
      const defaultProps = getDefaultProperties(objectType);
      const response = await slideShowsAPI.createSlideObject({
        slideId,
        objectType,
        sortOrder: objects.length,
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        offsetX: 0,
        offsetY: 0,
        animationIn: 'fadeIn',
        animationInDelay: 0,
        animationInDuration: 500,
        animationOut: null,
        animationOutDelay: null,
        animationOutDuration: null,
        stayOnScreen: true,
        properties: JSON.stringify(defaultProps),
      });

      if (response.success) {
        setShowAddObject(false);
        onRefresh?.();
        onToast?.('success', `${objectType} object added`);
        // Auto-expand the new object
        if (response.data?.slideObjectId) {
          setExpanded(prev => ({ ...prev, [response.data.slideObjectId]: true }));
        }
      } else {
        onToast?.('error', response.message || 'Failed to add object');
      }
    } catch (err) {
      onToast?.('error', 'Error adding object: ' + (err.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  // Update object
  const handleUpdateObject = async (objectId, data) => {
    try {
      const response = await slideShowsAPI.updateSlideObject(objectId, data);
      if (response.success) {
        onRefresh?.();
        onToast?.('success', 'Object updated');
      } else {
        onToast?.('error', response.message || 'Failed to update object');
      }
    } catch (err) {
      onToast?.('error', 'Error updating object');
    }
  };

  // Delete object
  const handleDeleteObject = async (objectId) => {
    if (!confirm('Delete this object?')) return;
    try {
      const response = await slideShowsAPI.deleteSlideObject(objectId);
      if (response.success) {
        onRefresh?.();
        onToast?.('success', 'Object deleted');
      } else {
        onToast?.('error', response.message || 'Failed to delete object');
      }
    } catch (err) {
      onToast?.('error', 'Error deleting object');
    }
  };

  // Get icon for object type
  const getObjectIcon = (type) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'video': return Video;
      default: return Square;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Slide Objects ({objects.length})
        </h4>
        <button
          onClick={() => setShowAddObject(!showAddObject)}
          className="btn btn-sm btn-primary flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Object
        </button>
      </div>

      {/* Add Object Panel */}
      {showAddObject && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <p className="text-sm text-gray-600 mb-3">Select object type to add:</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAddObject('text')}
              disabled={saving}
              className="flex-1 flex flex-col items-center gap-2 p-4 bg-white rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Type className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-medium">Text</span>
            </button>
            <button
              onClick={() => handleAddObject('image')}
              disabled={saving}
              className="flex-1 flex flex-col items-center gap-2 p-4 bg-white rounded-lg border hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <Image className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium">Image</span>
            </button>
            <button
              onClick={() => handleAddObject('video')}
              disabled={saving}
              className="flex-1 flex flex-col items-center gap-2 p-4 bg-white rounded-lg border hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <Video className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>
        </div>
      )}

      {/* Object List */}
      {objects.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
          <Settings className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No objects yet. Add text, images, or videos to this slide.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {objects.map((obj, index) => (
            <ObjectItem
              key={obj.slideObjectId}
              object={obj}
              index={index}
              expanded={expanded[obj.slideObjectId]}
              onToggle={() => toggleExpand(obj.slideObjectId)}
              onUpdate={(data) => handleUpdateObject(obj.slideObjectId, data)}
              onDelete={() => handleDeleteObject(obj.slideObjectId)}
              sharedVideos={sharedVideos}
              sharedImages={sharedImages}
              Icon={getObjectIcon(obj.objectType)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Object Item Component
function ObjectItem({
  object,
  index,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  sharedVideos,
  sharedImages,
  Icon,
}) {
  const [localData, setLocalData] = useState(object);
  const [properties, setProperties] = useState(() => {
    try {
      return object.properties ? JSON.parse(object.properties) : getDefaultProperties(object.objectType);
    } catch {
      return getDefaultProperties(object.objectType);
    }
  });

  useEffect(() => {
    setLocalData(object);
    try {
      setProperties(object.properties ? JSON.parse(object.properties) : getDefaultProperties(object.objectType));
    } catch {
      setProperties(getDefaultProperties(object.objectType));
    }
  }, [object]);

  // Save changes
  const handleSave = () => {
    onUpdate({
      ...localData,
      properties: JSON.stringify(properties),
    });
  };

  // Update local data
  const updateLocal = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  // Update properties
  const updateProperty = (field, value) => {
    setProperties(prev => ({ ...prev, [field]: value }));
  };

  // Get color based on object type
  const getTypeColor = () => {
    switch (object.objectType) {
      case 'text': return 'border-blue-500 bg-blue-50';
      case 'image': return 'border-green-500 bg-green-50';
      case 'video': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  // Get object preview/summary
  const getObjectSummary = () => {
    switch (object.objectType) {
      case 'text':
        return properties.content?.substring(0, 50) || 'Empty text';
      case 'image':
        return properties.imageUrl ? 'Image set' : 'No image selected';
      case 'video':
        return properties.videoUrl ? 'Video set' : 'No video selected';
      default:
        return 'Unknown type';
    }
  };

  return (
    <div className={`border-l-4 ${getTypeColor()} rounded-lg shadow-sm overflow-hidden`}>
      {/* Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-3 bg-white cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <Icon className="w-5 h-5" />
          <div>
            <span className="font-medium">{localData.name || `${object.objectType} ${index + 1}`}</span>
            <span className="text-xs text-gray-400 ml-2 capitalize">({object.objectType})</span>
            <span className="text-sm text-gray-500 ml-2">- {getObjectSummary()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 bg-white border-t space-y-6">
          {/* Name/Code */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name/Code</label>
            <input
              type="text"
              value={localData.name || ''}
              onChange={(e) => updateLocal('name', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
              placeholder={`${object.objectType} ${index + 1}`}
            />
          </div>

          {/* Position Settings */}
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Move className="w-4 h-4" />
              Position
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Horizontal Align</label>
                <div className="flex gap-1">
                  {HORIZONTAL_ALIGN.map(({ value, label, icon: AlignIcon }) => (
                    <button
                      key={value}
                      onClick={() => updateLocal('horizontalAlign', value)}
                      className={`flex-1 p-2 rounded border ${localData.horizontalAlign === value ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'}`}
                      title={label}
                    >
                      <AlignIcon className="w-4 h-4 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vertical Align</label>
                <div className="flex gap-1">
                  {VERTICAL_ALIGN.map(({ value, label, icon: AlignIcon }) => (
                    <button
                      key={value}
                      onClick={() => updateLocal('verticalAlign', value)}
                      className={`flex-1 p-2 rounded border ${localData.verticalAlign === value ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'}`}
                      title={label}
                    >
                      <AlignIcon className="w-4 h-4 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offset X (px)</label>
                <input
                  type="number"
                  value={localData.offsetX}
                  onChange={(e) => updateLocal('offsetX', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offset Y (px)</label>
                <input
                  type="number"
                  value={localData.offsetY}
                  onChange={(e) => updateLocal('offsetY', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* Animation In Settings */}
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
              <Play className="w-4 h-4" />
              Animation In (Entry)
            </h5>
            <p className="text-xs text-gray-400 mb-3">All times are measured from when the slide starts</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Animation</label>
                <select
                  value={localData.animationIn}
                  onChange={(e) => updateLocal('animationIn', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  {ANIMATIONS_IN.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start at (ms)</label>
                <input
                  type="number"
                  value={localData.animationInDelay}
                  onChange={(e) => updateLocal('animationInDelay', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="0"
                  step="100"
                  placeholder="0 = slide start"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duration (ms)</label>
                <input
                  type="number"
                  value={localData.animationInDuration}
                  onChange={(e) => updateLocal('animationInDuration', parseInt(e.target.value) || 500)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="100"
                  step="100"
                />
              </div>
            </div>
          </div>

          {/* Animation Out Settings */}
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Animation Out (Exit)
            </h5>
            <div className="mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localData.stayOnScreen}
                  onChange={(e) => updateLocal('stayOnScreen', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Stay on screen (no exit animation)</span>
              </label>
            </div>
            {!localData.stayOnScreen && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Animation</label>
                  <select
                    value={localData.animationOut || ''}
                    onChange={(e) => updateLocal('animationOut', e.target.value || null)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    {ANIMATIONS_OUT.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Exit at (ms from slide start)</label>
                  <input
                    type="number"
                    value={localData.animationOutDelay || 0}
                    onChange={(e) => updateLocal('animationOutDelay', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="0"
                    step="100"
                    placeholder="from slide start"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Duration (ms)</label>
                  <input
                    type="number"
                    value={localData.animationOutDuration || 500}
                    onChange={(e) => updateLocal('animationOutDuration', parseInt(e.target.value) || 500)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="100"
                    step="100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Type-Specific Properties */}
          <div className="border-t pt-4">
            <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {object.objectType.charAt(0).toUpperCase() + object.objectType.slice(1)} Properties
            </h5>

            {object.objectType === 'text' && (
              <TextProperties
                properties={properties}
                onChange={updateProperty}
              />
            )}

            {object.objectType === 'image' && (
              <ImageProperties
                properties={properties}
                onChange={updateProperty}
                sharedImages={sharedImages}
              />
            )}

            {object.objectType === 'video' && (
              <VideoProperties
                properties={properties}
                onChange={updateProperty}
                sharedVideos={sharedVideos}
              />
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Text Properties Component
function TextProperties({ properties, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Text Content</label>
        <textarea
          value={properties.content || ''}
          onChange={(e) => onChange('content', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          rows={3}
          placeholder="Enter your text..."
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Size</label>
          <select
            value={properties.fontSize || '4xl'}
            onChange={(e) => onChange('fontSize', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            {TEXT_SIZES.map(size => (
              <option key={size.value} value={size.value}>{size.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Weight</label>
          <select
            value={properties.fontWeight || 'bold'}
            onChange={(e) => onChange('fontWeight', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="semibold">Semi Bold</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color</label>
          <input
            type="color"
            value={properties.color || '#ffffff'}
            onChange={(e) => onChange('color', e.target.value)}
            className="w-full h-8 border rounded cursor-pointer"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Text Align</label>
          <select
            value={properties.textAlign || 'center'}
            onChange={(e) => onChange('textAlign', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Width (px)</label>
          <input
            type="number"
            value={properties.maxWidth || 800}
            onChange={(e) => onChange('maxWidth', parseInt(e.target.value) || 800)}
            className="w-full px-2 py-1 border rounded text-sm"
            min="100"
            step="50"
          />
        </div>
      </div>
    </div>
  );
}

// Image Properties Component
function ImageProperties({ properties, onChange, sharedImages }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Image</label>
        {properties.imageUrl ? (
          <div className="flex items-center gap-3">
            <img
              src={getAssetUrl(properties.imageUrl)}
              alt="Selected"
              className="w-20 h-20 object-cover rounded border"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600 truncate">{properties.imageUrl}</p>
              <button
                onClick={() => setShowPicker(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Change image
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            className="w-full py-4 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600"
          >
            <Image className="w-8 h-8 mx-auto mb-1" />
            <span className="text-sm">Select Image</span>
          </button>
        )}
      </div>

      {showPicker && (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <p className="text-xs text-gray-500 mb-2">Select from shared images:</p>
          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {sharedImages.map(img => (
              <button
                key={img.imageId}
                onClick={() => {
                  onChange('imageUrl', img.url);
                  setShowPicker(false);
                }}
                className="aspect-square rounded border overflow-hidden hover:ring-2 ring-blue-500"
              >
                <img src={getAssetUrl(img.url)} alt={img.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Or enter URL:</label>
            <input
              type="text"
              value={properties.imageUrl || ''}
              onChange={(e) => onChange('imageUrl', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="https://..."
            />
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Size</label>
          <select
            value={properties.size || 'medium'}
            onChange={(e) => onChange('size', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            {IMAGE_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
          <select
            value={properties.borderRadius || 'rounded-lg'}
            onChange={(e) => onChange('borderRadius', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="">None</option>
            <option value="rounded">Small</option>
            <option value="rounded-lg">Medium</option>
            <option value="rounded-xl">Large</option>
            <option value="rounded-full">Full</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Opacity (%)</label>
          <input
            type="number"
            value={properties.opacity || 100}
            onChange={(e) => onChange('opacity', parseInt(e.target.value) || 100)}
            className="w-full px-2 py-1 border rounded text-sm"
            min="0"
            max="100"
          />
        </div>
      </div>
    </div>
  );
}

// Video Properties Component
function VideoProperties({ properties, onChange, sharedVideos }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Video</label>
        {properties.videoUrl ? (
          <div className="flex items-center gap-3">
            <video
              src={getAssetUrl(properties.videoUrl)}
              className="w-32 h-20 object-cover rounded border"
              muted
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600 truncate">{properties.videoUrl}</p>
              <button
                onClick={() => setShowPicker(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Change video
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            className="w-full py-4 border-2 border-dashed rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-600"
          >
            <Video className="w-8 h-8 mx-auto mb-1" />
            <span className="text-sm">Select Video</span>
          </button>
        )}
      </div>

      {showPicker && (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <p className="text-xs text-gray-500 mb-2">Select from shared videos:</p>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {sharedVideos.map(vid => (
              <button
                key={vid.videoId}
                onClick={() => {
                  onChange('videoUrl', vid.url);
                  setShowPicker(false);
                }}
                className="aspect-video rounded border overflow-hidden hover:ring-2 ring-purple-500"
              >
                <video src={getAssetUrl(vid.url)} className="w-full h-full object-cover" muted />
              </button>
            ))}
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Or enter URL:</label>
            <input
              type="text"
              value={properties.videoUrl || ''}
              onChange={(e) => onChange('videoUrl', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="https://..."
            />
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Size</label>
          <select
            value={properties.size || 'medium'}
            onChange={(e) => onChange('size', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            {VIDEO_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
          <select
            value={properties.borderRadius || 'rounded-lg'}
            onChange={(e) => onChange('borderRadius', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="">None</option>
            <option value="rounded">Small</option>
            <option value="rounded-lg">Medium</option>
            <option value="rounded-xl">Large</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={properties.autoPlay !== false}
            onChange={(e) => onChange('autoPlay', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Auto Play</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={properties.muted !== false}
            onChange={(e) => onChange('muted', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Muted</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={properties.loop !== false}
            onChange={(e) => onChange('loop', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Loop</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={properties.showControls === true}
            onChange={(e) => onChange('showControls', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Controls</span>
        </label>
      </div>
    </div>
  );
}
