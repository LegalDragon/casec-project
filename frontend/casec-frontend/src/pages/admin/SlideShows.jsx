import { useState, useEffect } from 'react';
import {
  Play, Plus, Edit2, Trash2, ChevronRight, ChevronDown, GripVertical,
  Image, Video, Settings, Eye, Copy, Check, X, Film, Layers
} from 'lucide-react';
import { slideShowsAPI, getAssetUrl } from '../../services/api';

// Animation options
const ANIMATIONS = ['fadeIn', 'slideUp', 'slideDown', 'zoomIn', 'typewriter'];
const LAYOUTS = ['center', 'left', 'right', 'split'];
const OVERLAYS = ['dark', 'light', 'gradient', 'none'];
const POSITIONS = ['center', 'left', 'right', 'bottom-left', 'bottom-right', 'top-left', 'top-right'];
const SIZES = ['small', 'medium', 'large', 'full'];

export default function AdminSlideShows() {
  const [slideShows, setSlideShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('slideshows'); // slideshows, videos, images
  const [selectedShow, setSelectedShow] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [saving, setSaving] = useState(false);

  // Shared media
  const [sharedVideos, setSharedVideos] = useState([]);
  const [sharedImages, setSharedImages] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    transitionType: 'fade',
    transitionDuration: 500,
    showProgress: true,
    allowSkip: true,
    loop: false,
    autoPlay: true
  });

  useEffect(() => {
    loadSlideShows();
    loadSharedMedia();
  }, []);

  const loadSlideShows = async () => {
    try {
      const response = await slideShowsAPI.getAllAdmin();
      if (response.success) {
        setSlideShows(response.data);
      }
    } catch (err) {
      console.error('Failed to load slideshows:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedMedia = async () => {
    try {
      const [videosRes, imagesRes] = await Promise.all([
        slideShowsAPI.getAllVideosAdmin(),
        slideShowsAPI.getAllImagesAdmin()
      ]);
      if (videosRes.success) setSharedVideos(videosRes.data);
      if (imagesRes.success) setSharedImages(imagesRes.data);
    } catch (err) {
      console.error('Failed to load shared media:', err);
    }
  };

  const loadSlideShowDetails = async (id) => {
    try {
      const response = await slideShowsAPI.getAdmin(id);
      if (response.success) {
        setSelectedShow(response.data);
      }
    } catch (err) {
      console.error('Failed to load slideshow details:', err);
    }
  };

  const handleCreateShow = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      isActive: true,
      transitionType: 'fade',
      transitionDuration: 500,
      showProgress: true,
      allowSkip: true,
      loop: false,
      autoPlay: true
    });
    setShowForm(true);
  };

  const handleEditShow = (show) => {
    setFormData({
      code: show.code,
      name: show.name,
      description: show.description || '',
      isActive: show.isActive,
      transitionType: show.transitionType,
      transitionDuration: show.transitionDuration,
      showProgress: show.showProgress,
      allowSkip: show.allowSkip,
      loop: show.loop,
      autoPlay: show.autoPlay
    });
    setShowForm(true);
  };

  const handleSaveShow = async () => {
    setSaving(true);
    try {
      let response;
      if (selectedShow) {
        response = await slideShowsAPI.update(selectedShow.slideShowId, formData);
      } else {
        response = await slideShowsAPI.create(formData);
      }

      if (response.success) {
        setShowForm(false);
        loadSlideShows();
        if (selectedShow) {
          loadSlideShowDetails(selectedShow.slideShowId);
        }
      } else {
        alert(response.message || 'Failed to save slideshow');
      }
    } catch (err) {
      alert('Error saving slideshow: ' + (err.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShow = async (id) => {
    if (!confirm('Are you sure you want to delete this slideshow? All slides will be deleted.')) return;

    try {
      const response = await slideShowsAPI.delete(id);
      if (response.success) {
        setSelectedShow(null);
        loadSlideShows();
      }
    } catch (err) {
      alert('Error deleting slideshow');
    }
  };

  const handleAddSlide = async () => {
    if (!selectedShow) return;

    try {
      const response = await slideShowsAPI.createSlide({
        slideShowId: selectedShow.slideShowId,
        displayOrder: selectedShow.slides?.length || 0,
        duration: 5000,
        useRandomVideo: true,
        layout: 'center',
        overlayType: 'dark',
        overlayOpacity: 50,
        titleText: 'New Slide',
        titleAnimation: 'fadeIn',
        titleDuration: 800,
        titleDelay: 500,
        subtitleAnimation: 'fadeIn',
        subtitleDuration: 600,
        subtitleDelay: 1200
      });

      if (response.success) {
        loadSlideShowDetails(selectedShow.slideShowId);
      }
    } catch (err) {
      alert('Error adding slide');
    }
  };

  const handleUpdateSlide = async (slideId, data) => {
    try {
      const response = await slideShowsAPI.updateSlide(slideId, data);
      if (response.success) {
        loadSlideShowDetails(selectedShow.slideShowId);
      }
    } catch (err) {
      alert('Error updating slide');
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (!confirm('Delete this slide?')) return;

    try {
      const response = await slideShowsAPI.deleteSlide(slideId);
      if (response.success) {
        loadSlideShowDetails(selectedShow.slideShowId);
      }
    } catch (err) {
      alert('Error deleting slide');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">SlideShows</h1>
          <p className="text-gray-600">Create and manage intro slideshows for your pages</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'slideshows', label: 'SlideShows', icon: Layers },
            { id: 'videos', label: 'Video Pool', icon: Video },
            { id: 'images', label: 'Image Pool', icon: Image }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* SlideShows Tab */}
      {activeTab === 'slideshows' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SlideShow List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">All SlideShows</h2>
              <button onClick={handleCreateShow} className="btn btn-primary btn-sm">
                <Plus className="w-4 h-4 mr-1" /> New
              </button>
            </div>

            {slideShows.length === 0 ? (
              <div className="card text-center py-8">
                <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No slideshows yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {slideShows.map((show) => (
                  <div
                    key={show.slideShowId}
                    onClick={() => loadSlideShowDetails(show.slideShowId)}
                    className={`card cursor-pointer transition-all hover:shadow-md ${
                      selectedShow?.slideShowId === show.slideShowId
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{show.name}</h3>
                        <p className="text-sm text-gray-500">
                          <code className="bg-gray-100 px-1 rounded">{show.code}</code>
                          <span className="mx-2">•</span>
                          {show.slideCount} slides
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {show.isActive ? (
                          <span className="w-2 h-2 bg-green-500 rounded-full" title="Active"></span>
                        ) : (
                          <span className="w-2 h-2 bg-gray-300 rounded-full" title="Inactive"></span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SlideShow Editor */}
          <div className="lg:col-span-2">
            {selectedShow ? (
              <div className="card space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedShow.name}</h2>
                    <p className="text-sm text-gray-500">
                      Code: <code className="bg-gray-100 px-2 py-0.5 rounded">{selectedShow.code}</code>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditShow(selectedShow)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Settings className="w-4 h-4 mr-1" /> Settings
                    </button>
                    <button
                      onClick={() => handleDeleteShow(selectedShow.slideShowId)}
                      className="btn btn-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Slides */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Slides ({selectedShow.slides?.length || 0})</h3>
                    <button onClick={handleAddSlide} className="btn btn-primary btn-sm">
                      <Plus className="w-4 h-4 mr-1" /> Add Slide
                    </button>
                  </div>

                  {(!selectedShow.slides || selectedShow.slides.length === 0) ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No slides yet. Add your first slide!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedShow.slides.map((slide, index) => (
                        <SlideEditor
                          key={slide.slideId}
                          slide={slide}
                          index={index}
                          sharedVideos={sharedVideos}
                          onUpdate={(data) => handleUpdateSlide(slide.slideId, data)}
                          onDelete={() => handleDeleteSlide(slide.slideId)}
                          isExpanded={editingSlide === slide.slideId}
                          onToggle={() => setEditingSlide(
                            editingSlide === slide.slideId ? null : slide.slideId
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Usage Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 font-medium text-sm">How to use this slideshow:</p>
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded block mt-2">
                    {`<SlideShow code="${selectedShow.code}" onComplete={() => setShowContent(true)} />`}
                  </code>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a slideshow to edit or create a new one</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <SharedMediaManager
          type="video"
          items={sharedVideos}
          onRefresh={loadSharedMedia}
        />
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <SharedMediaManager
          type="image"
          items={sharedImages}
          onRefresh={loadSharedMedia}
        />
      )}

      {/* SlideShow Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedShow ? 'Edit SlideShow' : 'Create SlideShow'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="home-intro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Home Page Intro"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="input w-full"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transition</label>
                    <select
                      className="input w-full"
                      value={formData.transitionType}
                      onChange={(e) => setFormData({ ...formData, transitionType: e.target.value })}
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transition Duration (ms)</label>
                    <input
                      type="number"
                      className="input w-full"
                      value={formData.transitionDuration}
                      onChange={(e) => setFormData({ ...formData, transitionDuration: parseInt(e.target.value) || 500 })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showProgress}
                      onChange={(e) => setFormData({ ...formData, showProgress: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Show Progress</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowSkip}
                      onChange={(e) => setFormData({ ...formData, allowSkip: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Allow Skip</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.loop}
                      onChange={(e) => setFormData({ ...formData, loop: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Loop</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autoPlay}
                      onChange={(e) => setFormData({ ...formData, autoPlay: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Auto Play</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSaveShow} disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Slide Editor Component
function SlideEditor({ slide, index, sharedVideos, onUpdate, onDelete, isExpanded, onToggle }) {
  const [localData, setLocalData] = useState(slide);

  useEffect(() => {
    setLocalData(slide);
  }, [slide]);

  const handleSave = () => {
    onUpdate(localData);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <span className="font-medium">Slide {index + 1}</span>
          <span className="text-sm text-gray-500">
            {localData.titleText || 'Untitled'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{localData.duration / 1000}s</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (ms)</label>
              <input
                type="number"
                className="input w-full text-sm"
                value={localData.duration}
                onChange={(e) => setLocalData({ ...localData, duration: parseInt(e.target.value) || 5000 })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Layout</label>
              <select
                className="input w-full text-sm"
                value={localData.layout}
                onChange={(e) => setLocalData({ ...localData, layout: e.target.value })}
              >
                {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Overlay</label>
              <select
                className="input w-full text-sm"
                value={localData.overlayType}
                onChange={(e) => setLocalData({ ...localData, overlayType: e.target.value })}
              >
                {OVERLAYS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Overlay Opacity</label>
              <input
                type="number"
                className="input w-full text-sm"
                min={0}
                max={100}
                value={localData.overlayOpacity}
                onChange={(e) => setLocalData({ ...localData, overlayOpacity: parseInt(e.target.value) || 50 })}
              />
            </div>
          </div>

          {/* Video */}
          <div className="border-t pt-4">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={localData.useRandomVideo}
                onChange={(e) => setLocalData({ ...localData, useRandomVideo: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium">Use random video from pool</span>
            </label>
            {!localData.useRandomVideo && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Video URL</label>
                <input
                  type="text"
                  className="input w-full text-sm"
                  value={localData.videoUrl || ''}
                  onChange={(e) => setLocalData({ ...localData, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Title</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  className="input w-full text-sm"
                  placeholder="Title text"
                  value={localData.titleText || ''}
                  onChange={(e) => setLocalData({ ...localData, titleText: e.target.value })}
                />
              </div>
              <div>
                <select
                  className="input w-full text-sm"
                  value={localData.titleAnimation}
                  onChange={(e) => setLocalData({ ...localData, titleAnimation: e.target.value })}
                >
                  {ANIMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  className="input w-1/2 text-sm"
                  placeholder="Duration"
                  value={localData.titleDuration}
                  onChange={(e) => setLocalData({ ...localData, titleDuration: parseInt(e.target.value) || 800 })}
                />
                <input
                  type="number"
                  className="input w-1/2 text-sm"
                  placeholder="Delay"
                  value={localData.titleDelay}
                  onChange={(e) => setLocalData({ ...localData, titleDelay: parseInt(e.target.value) || 500 })}
                />
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Subtitle</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  className="input w-full text-sm"
                  placeholder="Subtitle text"
                  value={localData.subtitleText || ''}
                  onChange={(e) => setLocalData({ ...localData, subtitleText: e.target.value })}
                />
              </div>
              <div>
                <select
                  className="input w-full text-sm"
                  value={localData.subtitleAnimation}
                  onChange={(e) => setLocalData({ ...localData, subtitleAnimation: e.target.value })}
                >
                  {ANIMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  className="input w-1/2 text-sm"
                  placeholder="Duration"
                  value={localData.subtitleDuration}
                  onChange={(e) => setLocalData({ ...localData, subtitleDuration: parseInt(e.target.value) || 600 })}
                />
                <input
                  type="number"
                  className="input w-1/2 text-sm"
                  placeholder="Delay"
                  value={localData.subtitleDelay}
                  onChange={(e) => setLocalData({ ...localData, subtitleDelay: parseInt(e.target.value) || 1200 })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <button onClick={onDelete} className="btn btn-sm text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </button>
            <button onClick={handleSave} className="btn btn-primary btn-sm">
              <Check className="w-4 h-4 mr-1" /> Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared Media Manager Component
function SharedMediaManager({ type, items, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    category: '',
    isActive: true,
    displayOrder: 0
  });

  const isVideo = type === 'video';
  const Icon = isVideo ? Video : Image;

  const handleAdd = () => {
    setEditingId(null);
    setInputMode('url');
    setSelectedFile(null);
    setFormData({
      url: '',
      title: '',
      category: '',
      isActive: true,
      displayOrder: items.length
    });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingId(isVideo ? item.videoId : item.imageId);
    setInputMode('url');
    setSelectedFile(null);
    setFormData({
      url: item.url,
      title: item.title || '',
      category: item.category || '',
      isActive: item.isActive,
      displayOrder: item.displayOrder
    });
    setShowForm(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, '') });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      if (formData.title) uploadFormData.append('title', formData.title);
      if (formData.category) uploadFormData.append('category', formData.category);

      const response = isVideo
        ? await slideShowsAPI.uploadVideo(uploadFormData)
        : await slideShowsAPI.uploadImage(uploadFormData);

      if (response.success) {
        setShowForm(false);
        setSelectedFile(null);
        onRefresh();
      } else {
        alert(response.message || 'Upload failed');
      }
    } catch (err) {
      alert(`Error uploading ${type}: ` + (err.message || 'Please try again'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // If in upload mode with a file, use upload
    if (inputMode === 'upload' && selectedFile) {
      await handleUpload();
      return;
    }

    setSaving(true);
    try {
      let response;
      if (editingId) {
        response = isVideo
          ? await slideShowsAPI.updateVideo(editingId, formData)
          : await slideShowsAPI.updateImage(editingId, formData);
      } else {
        response = isVideo
          ? await slideShowsAPI.createVideo(formData)
          : await slideShowsAPI.createImage(formData);
      }

      if (response.success) {
        setShowForm(false);
        onRefresh();
      }
    } catch (err) {
      alert(`Error saving ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete this ${type}?`)) return;

    try {
      const response = isVideo
        ? await slideShowsAPI.deleteVideo(id)
        : await slideShowsAPI.deleteImage(id);

      if (response.success) {
        onRefresh();
      }
    } catch (err) {
      alert(`Error deleting ${type}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Shared {isVideo ? 'Videos' : 'Images'} ({items.length})
        </h2>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Add {isVideo ? 'Video' : 'Image'}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-12">
          <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No shared {isVideo ? 'videos' : 'images'} yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={isVideo ? item.videoId : item.imageId} className="card">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                {isVideo ? (
                  <video src={getAssetUrl(item.url)} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={getAssetUrl(item.url)} alt={item.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.title || 'Untitled'}</p>
                  {item.category && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.category}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {item.isActive ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  ) : (
                    <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                  )}
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1 text-gray-500 hover:text-primary"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(isVideo ? item.videoId : item.imageId)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? 'Edit' : 'Add'} {isVideo ? 'Video' : 'Image'}
              </h2>

              {/* Input Mode Toggle (only for new items) */}
              {!editingId && (
                <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setInputMode('url')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      inputMode === 'url'
                        ? 'bg-white shadow text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Enter URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      inputMode === 'upload'
                        ? 'bg-white shadow text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {/* URL Input or File Upload */}
                {inputMode === 'url' || editingId ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select {isVideo ? 'Video' : 'Image'} File *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary transition-colors">
                      <div className="space-y-1 text-center">
                        <Icon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                            <span>Choose a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept={isVideo ? 'video/mp4,video/webm,video/ogg,video/quicktime' : 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'}
                              onChange={handleFileSelect}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {isVideo ? 'MP4, WebM, OGG, MOV' : 'JPEG, PNG, GIF, WebP, SVG'}
                        </p>
                        {selectedFile && (
                          <p className="text-sm text-green-600 font-medium mt-2">
                            Selected: {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., hero, community"
                  />
                </div>
                {editingId && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || uploading || (inputMode === 'upload' && !selectedFile && !editingId)}
                  className="btn btn-primary"
                >
                  {uploading ? 'Uploading...' : saving ? 'Saving...' : (inputMode === 'upload' && !editingId ? 'Upload' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
