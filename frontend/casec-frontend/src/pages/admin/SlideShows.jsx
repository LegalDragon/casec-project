import { useState, useEffect } from 'react';
import {
  Play, Plus, Edit2, Trash2, ChevronRight, ChevronDown, GripVertical,
  Image, Video, Settings, Eye, Copy, Check, X, Film, Layers, Share2, Link, Type
} from 'lucide-react';
import { slideShowsAPI, getAssetUrl } from '../../services/api';
import SlideShowPreview from '../../components/SlideShow';
import SlideObjectEditor from '../../components/admin/SlideObjectEditor';
import BackgroundVideoEditor from '../../components/admin/BackgroundVideoEditor';

// YouTube URL detection and parsing utilities
const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch) return longMatch[1];
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];
  return null;
};

// Video preview component that handles both regular videos and YouTube
function VideoPreview({ url, className = '' }) {
  if (!url) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}>
        <Video className="w-8 h-8" />
      </div>
    );
  }

  if (isYouTubeUrl(url)) {
    const videoId = getYouTubeVideoId(url);
    return (
      <div className={`relative ${className}`}>
        <img
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt="YouTube thumbnail"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded">YT</div>
      </div>
    );
  }

  return (
    <video
      src={getAssetUrl(url)}
      className={`object-cover ${className}`}
      muted
    />
  );
}

// Animation options
const ANIMATIONS = ['fadeIn', 'slideUp', 'slideDown', 'zoomIn', 'typewriter'];
const IMAGE_ANIMATIONS = ['fadeIn', 'zoomIn', 'slideInLeft', 'slideInRight', 'bounce'];
const TEXT_ANIMATIONS = ['fadeIn', 'slideUp', 'slideDown', 'zoomIn', 'typewriter'];
const LAYOUTS = ['center', 'left', 'right', 'split'];
const OVERLAYS = ['dark', 'light', 'gradient', 'none'];
const POSITIONS = ['center', 'left', 'right', 'bottom-left', 'bottom-right', 'top-left', 'top-right'];
const SIZES = ['small', 'medium', 'large', 'full', 'maximum'];
const TEXT_SIZES = ['small', 'medium', 'large', 'xlarge'];
const ORIENTATIONS = ['auto', 'portrait', 'landscape'];
const HORIZONTAL_POSITIONS = ['left', 'center', 'right'];
const VERTICAL_POSITIONS = ['top', 'center', 'bottom'];

export default function AdminSlideShows() {
  const [slideShows, setSlideShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('slideshows'); // slideshows, videos, images
  const [selectedShow, setSelectedShow] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  // Show toast notification
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Copy share link to clipboard
  const copyShareLink = async (code) => {
    const url = `${window.location.origin}/preview/slideshow/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

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
      setError(null);
      const response = await slideShowsAPI.getAllAdmin();
      if (response.success) {
        setSlideShows(response.data);
      } else {
        setError(response.message || 'Failed to load slideshows');
      }
    } catch (err) {
      console.error('Failed to load slideshows:', err);
      const status = err.response?.status;
      if (status === 403) {
        setError('Access denied. Admin privileges required.');
      } else if (status === 404) {
        setError('SlideShows API not found. The backend may need to be redeployed.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load slideshows. Please check the console for details.');
      }
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
    // Reset preview state when changing slideshows
    setShowPreview(false);
    try {
      const response = await slideShowsAPI.getAdmin(id);
      if (response.success) {
        setSelectedShow(response.data);
      } else {
        console.error('Failed to load slideshow:', response.message);
        showToast('error', response.message || 'Failed to load slideshow');
        setSelectedShow(null);
      }
    } catch (err) {
      console.error('Failed to load slideshow details:', err);
      showToast('error', 'Error loading slideshow');
      setSelectedShow(null);
    }
  };

  const handleCreateShow = () => {
    setSelectedShow(null); // Clear selection so save creates new instead of updating
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
        showToast('success', 'SlideShow saved successfully!');
      } else {
        showToast('error', response.message || 'Failed to save slideshow');
      }
    } catch (err) {
      console.error('Save slideshow error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Please try again';
      showToast('error', 'Error saving slideshow: ' + errorMsg);
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
        showToast('success', 'SlideShow deleted');
      }
    } catch (err) {
      showToast('error', 'Error deleting slideshow');
    }
  };

  const handleCopySlideShow = async () => {
    if (!selectedShow) return;

    const newCode = prompt('Enter a code for the copy:', `${selectedShow.code}-copy`);
    if (!newCode) return;

    setSaving(true);
    try {
      // 1. Create new slideshow with same settings
      const createRes = await slideShowsAPI.create({
        code: newCode,
        name: `${selectedShow.name} (Copy)`,
        description: selectedShow.description,
        isActive: false, // Start as inactive
        transitionType: selectedShow.transitionType,
        transitionDuration: selectedShow.transitionDuration,
        showProgress: selectedShow.showProgress,
        allowSkip: selectedShow.allowSkip,
        loop: selectedShow.loop,
        autoPlay: selectedShow.autoPlay,
      });

      if (!createRes.success) {
        showToast('error', createRes.message || 'Failed to create slideshow copy');
        return;
      }

      const newShowId = createRes.data.slideShowId;

      // 2. Copy each slide
      for (const slide of (selectedShow.slides || [])) {
        const slideRes = await slideShowsAPI.createSlide({
          slideShowId: newShowId,
          displayOrder: slide.displayOrder,
          duration: slide.duration,
          backgroundType: slide.backgroundType,
          backgroundColor: slide.backgroundColor,
          backgroundImageUrl: slide.backgroundImageUrl,
          useRandomHeroVideos: slide.useRandomHeroVideos,
          videoUrl: slide.videoUrl,
          useRandomVideo: slide.useRandomVideo,
          layout: slide.layout,
          overlayType: slide.overlayType,
          overlayColor: slide.overlayColor,
          overlayOpacity: slide.overlayOpacity,
        });

        if (!slideRes.success) continue;

        const newSlideId = slideRes.data.slideId;

        // 3. Copy background videos for this slide
        for (const bgVideo of (slide.backgroundVideos || [])) {
          await slideShowsAPI.createSlideBackgroundVideo({
            slideId: newSlideId,
            videoId: bgVideo.videoId || null,
            videoUrl: bgVideo.videoUrl || bgVideo.video?.url || null,
            duration: bgVideo.duration,
            sortOrder: bgVideo.sortOrder,
          });
        }

        // 4. Copy slide objects
        for (const obj of (slide.objects || [])) {
          await slideShowsAPI.createSlideObject({
            slideId: newSlideId,
            objectType: obj.objectType,
            properties: typeof obj.properties === 'string' ? obj.properties : JSON.stringify(obj.properties),
            horizontalAlign: obj.horizontalAlign,
            verticalAlign: obj.verticalAlign,
            offsetX: obj.offsetX,
            offsetY: obj.offsetY,
            animationIn: obj.animationIn,
            animationInDuration: obj.animationInDuration,
            animationInDelay: obj.animationInDelay,
            animationOut: obj.animationOut,
            animationOutDuration: obj.animationOutDuration,
            animationOutDelay: obj.animationOutDelay,
            stayOnScreen: obj.stayOnScreen,
            sortOrder: obj.sortOrder,
          });
        }
      }

      showToast('success', `SlideShow copied as "${newCode}"`);
      await loadSlideShows();
      // Auto-select the new slideshow
      loadSlideShowDetails(newShowId);
    } catch (err) {
      console.error('Copy slideshow error:', err);
      showToast('error', 'Error copying slideshow: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
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
        overlayOpacity: 50
      });

      if (response.success) {
        loadSlideShowDetails(selectedShow.slideShowId);
        showToast('success', 'Slide added');
      }
    } catch (err) {
      showToast('error', 'Error adding slide');
    }
  };

  const handleUpdateSlide = async (slideId, data) => {
    try {
      const response = await slideShowsAPI.updateSlide(slideId, data);
      if (response.success) {
        loadSlideShowDetails(selectedShow.slideShowId);
        showToast('success', 'Slide saved!');
      } else {
        showToast('error', response.message || 'Failed to update slide');
      }
    } catch (err) {
      console.error('updateSlide error:', err);
      showToast('error', 'Error updating slide: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (!confirm('Delete this slide?')) return;

    try {
      const response = await slideShowsAPI.deleteSlide(slideId);
      if (response.success) {
        loadSlideShowDetails(selectedShow.slideShowId);
        showToast('success', 'Slide deleted');
      }
    } catch (err) {
      showToast('error', 'Error deleting slide');
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
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">SlideShows</h1>
          <p className="text-gray-600">Create and manage intro slideshows for your pages</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error Loading SlideShows</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={loadSlideShows}
                className="mt-2 text-sm text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="space-y-4">
          {/* SlideShow Selector */}
          <div className="card">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Film className="w-5 h-5 text-gray-400" />
                <select
                  className="input flex-1"
                  value={selectedShow?.slideShowId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    if (id) loadSlideShowDetails(id);
                    else setSelectedShow(null);
                  }}
                >
                  <option value="">-- Select a SlideShow --</option>
                  {slideShows.map((show) => (
                    <option key={show.slideShowId} value={show.slideShowId}>
                      {show.name} ({show.code}) - {show.slideCount} slides {show.isActive ? '✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleCreateShow} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-1" /> New SlideShow
              </button>
            </div>
          </div>

          {/* SlideShow Editor */}
          {selectedShow ? (
            <div className="card space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedShow.name}</h2>
                  <p className="text-sm text-gray-500">
                    Code: <code className="bg-gray-100 px-2 py-0.5 rounded">{selectedShow.code}</code>
                    {selectedShow.isActive ? (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="btn btn-accent btn-sm"
                    disabled={!selectedShow.slides?.length}
                  >
                    <Play className="w-4 h-4 mr-1" /> Preview
                  </button>
                  <button
                    onClick={() => copyShareLink(selectedShow.code)}
                    className={`btn btn-sm ${linkCopied ? 'btn-success' : 'btn-secondary'}`}
                    title="Copy share link"
                  >
                    {linkCopied ? (
                      <><Check className="w-4 h-4 mr-1" /> Copied!</>
                    ) : (
                      <><Share2 className="w-4 h-4 mr-1" /> Share</>
                    )}
                  </button>
                  <button
                    onClick={handleCopySlideShow}
                    className="btn btn-secondary btn-sm"
                    disabled={saving}
                    title="Copy entire slideshow"
                  >
                    <Copy className="w-4 h-4 mr-1" /> {saving ? 'Copying...' : 'Copy'}
                  </button>
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
                        sharedImages={sharedImages}
                        onUpdate={(data) => handleUpdateSlide(slide.slideId, data)}
                        onDelete={() => handleDeleteSlide(slide.slideId)}
                        onRefresh={() => loadSlideShowDetails(selectedShow.slideShowId)}
                        onToast={showToast}
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
              <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a slideshow from the dropdown above or create a new one</p>
            </div>
          )}
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

      {/* SlideShow Preview Modal */}
      {showPreview && selectedShow && (
        <div className="fixed inset-0 z-50">
          <SlideShowPreview
            id={selectedShow.slideShowId}
            adminMode={true}
            onComplete={() => setShowPreview(false)}
            onSkip={() => setShowPreview(false)}
          />
          <button
            onClick={() => setShowPreview(false)}
            className="fixed top-4 left-4 z-[60] bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Close Preview
          </button>
        </div>
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
function SlideEditor({ slide, index, sharedVideos, sharedImages, onUpdate, onDelete, onRefresh, onToast, isExpanded, onToggle }) {
  const [localData, setLocalData] = useState(slide);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLocalData(slide);
  }, [slide]);

  const handleSave = () => {
    // Only send the fields that the backend expects
    const updateData = {
      displayOrder: localData.displayOrder,
      duration: localData.duration,
      // Background settings
      backgroundType: localData.backgroundType || 'heroVideos',
      backgroundColor: localData.backgroundColor,
      backgroundImageUrl: localData.backgroundImageUrl,
      useRandomHeroVideos: localData.useRandomHeroVideos || false,
      // Legacy video fields (kept for backwards compatibility)
      videoUrl: localData.videoUrl,
      useRandomVideo: localData.useRandomVideo,
      // Layout & overlay
      layout: localData.layout,
      overlayType: localData.overlayType,
      overlayColor: localData.overlayColor,
      overlayOpacity: localData.overlayOpacity,
    };
    onUpdate(updateData);
  };

  // Handle background settings update from BackgroundVideoEditor
  // This saves directly to the server AND updates local state
  const handleBackgroundUpdate = (bgSettings) => {
    // Update local state
    setLocalData(prev => ({
      ...prev,
      backgroundType: bgSettings.backgroundType,
      backgroundColor: bgSettings.backgroundColor,
      backgroundImageUrl: bgSettings.backgroundImageUrl,
      useRandomHeroVideos: bgSettings.useRandomHeroVideos,
    }));

    // Also save to server immediately
    onUpdate({
      backgroundType: bgSettings.backgroundType,
      backgroundColor: bgSettings.backgroundColor,
      backgroundImageUrl: bgSettings.backgroundImageUrl,
      useRandomHeroVideos: bgSettings.useRandomHeroVideos,
    });
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
            {slide.objects?.length || 0} objects
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
            title="Preview this slide"
          >
            <Eye className="w-4 h-4" />
          </button>
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

          {/* Background Settings */}
          <BackgroundVideoEditor
            slideId={slide.slideId}
            backgroundType={localData.backgroundType || 'heroVideos'}
            backgroundColor={localData.backgroundColor}
            backgroundImageUrl={localData.backgroundImageUrl}
            useRandomHeroVideos={localData.useRandomHeroVideos}
            backgroundVideos={slide.backgroundVideos || []}
            sharedVideos={sharedVideos}
            sharedImages={sharedImages}
            onUpdate={handleBackgroundUpdate}
            onRefresh={onRefresh}
            onToast={onToast}
          />

          {/* Slide Objects (Text, Image, Video) */}
          <SlideObjectEditor
            slideId={slide.slideId}
            objects={slide.objects || []}
            sharedVideos={sharedVideos}
            sharedImages={sharedImages}
            onRefresh={onRefresh}
            onToast={onToast}
          />

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

      {/* Slide Preview Modal */}
      {showPreview && (
        <SlidePreviewModal
          slide={slide}
          sharedVideos={sharedVideos}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// Slide Preview Modal Component - Shows a single slide preview
function SlidePreviewModal({ slide, sharedVideos, onClose }) {
  // Get background video URL
  const getBackgroundVideoUrl = () => {
    const bgType = slide.backgroundType || 'heroVideos';
    if (bgType !== 'heroVideos') return null;

    const bgVideos = slide.backgroundVideos || [];
    if (bgVideos.length > 0) {
      const bgVideo = bgVideos[0];
      return bgVideo?.video?.url || bgVideo?.videoUrl || null;
    }

    // Fallback to legacy fields
    if (slide.videoUrl) return slide.videoUrl;
    if (slide.useRandomVideo && sharedVideos?.length > 0) {
      return sharedVideos[0].url;
    }
    return null;
  };

  // Get background style for color/image
  const getBackgroundStyle = () => {
    const bgType = slide.backgroundType || 'heroVideos';
    switch (bgType) {
      case 'color':
        return { backgroundColor: slide.backgroundColor || '#000000' };
      case 'image':
        return slide.backgroundImageUrl
          ? { backgroundImage: `url(${getAssetUrl(slide.backgroundImageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundColor: '#000000' };
      case 'none':
        return { backgroundColor: 'transparent' };
      default:
        return { backgroundColor: '#000000' };
    }
  };

  // Get overlay style
  const getOverlayStyle = () => {
    switch (slide.overlayType) {
      case 'dark': return { backgroundColor: 'rgba(0,0,0,0.5)' };
      case 'light': return { backgroundColor: 'rgba(255,255,255,0.3)' };
      case 'gradient': return { background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))' };
      default: return {};
    }
  };

  const backgroundVideoUrl = getBackgroundVideoUrl();
  const backgroundStyle = getBackgroundStyle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      {/* Preview Container - 16:9 aspect ratio */}
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        {/* Static Background */}
        {!backgroundVideoUrl && (
          <div className="absolute inset-0" style={backgroundStyle} />
        )}

        {/* Video Background */}
        {backgroundVideoUrl && (
          isYouTubeUrl(backgroundVideoUrl) ? (
            <iframe
              className="absolute inset-0 w-full h-full pointer-events-none"
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(backgroundVideoUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(backgroundVideoUrl)}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
              allow="autoplay; encrypted-media"
              style={{ border: 'none', transform: 'scale(1.5)', transformOrigin: 'center center' }}
              title="Background Video"
            />
          ) : (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={getAssetUrl(backgroundVideoUrl)}
              autoPlay
              muted
              loop
              playsInline
            />
          )
        )}

        {/* Overlay */}
        <div className="absolute inset-0" style={getOverlayStyle()} />

        {/* Slide Objects */}
        <div className="absolute inset-0">
          {(slide.objects || []).map((obj) => (
            <SlideObjectPreview key={obj.slideObjectId} object={obj} />
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Slide Info */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded text-sm">
          Slide Preview • {slide.duration / 1000}s
        </div>
      </div>
    </div>
  );
}

// Slide Object Preview Component - Simplified preview for admin
function SlideObjectPreview({ object }) {
  const props = object.properties ? (typeof object.properties === 'string' ? JSON.parse(object.properties) : object.properties) : {};

  // Calculate position style
  const getPositionStyle = () => {
    const style = { position: 'absolute' };
    const offsetX = object.offsetX || 0;
    const offsetY = object.offsetY || 0;

    switch (object.horizontalAlign) {
      case 'left':
        style.left = `${offsetX}px`;
        break;
      case 'right':
        style.right = `${-offsetX}px`;
        break;
      default:
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        style.marginLeft = `${offsetX}px`;
    }

    switch (object.verticalAlign) {
      case 'top':
        style.top = `${offsetY}px`;
        break;
      case 'bottom':
        style.bottom = `${-offsetY}px`;
        break;
      default:
        style.top = '50%';
        style.transform = style.transform ? 'translate(-50%, -50%)' : 'translateY(-50%)';
        style.marginTop = `${offsetY}px`;
    }

    return style;
  };

  const positionStyle = getPositionStyle();

  if (object.objectType === 'text') {
    const sizeMap = {
      'xs': '0.75rem', 'sm': '0.875rem', 'base': '1rem', 'lg': '1.125rem',
      'xl': '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem',
      '5xl': '3rem', '6xl': '3.75rem', '7xl': '4.5rem', '8xl': '6rem'
    };
    return (
      <div style={positionStyle}>
        <div
          style={{
            fontSize: sizeMap[props.fontSize] || '2.25rem',
            fontWeight: props.fontWeight || 'bold',
            color: props.color || 'white',
            textAlign: props.textAlign || 'center',
            maxWidth: props.maxWidth ? `${props.maxWidth}px` : '80%',
          }}
        >
          {props.content || props.text || 'Text'}
        </div>
      </div>
    );
  }

  if (object.objectType === 'image') {
    const imageUrl = props.imageUrl || props.url;
    if (!imageUrl) return null;
    const sizeMap = { small: '150px', medium: '300px', large: '450px', full: '100%' };
    return (
      <div style={positionStyle}>
        <img
          src={getAssetUrl(imageUrl)}
          alt=""
          style={{ width: sizeMap[props.size] || '300px', height: 'auto', objectFit: 'cover', borderRadius: '0.5rem' }}
        />
      </div>
    );
  }

  if (object.objectType === 'video') {
    const videoUrl = props.videoUrl || props.url;
    if (!videoUrl) return null;
    const sizeMap = { small: '240px', medium: '480px', large: '720px' };
    const width = sizeMap[props.size] || '480px';

    return (
      <div style={positionStyle}>
        {isYouTubeUrl(videoUrl) ? (
          <iframe
            src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(videoUrl)}&controls=0&playsinline=1`}
            allow="autoplay; encrypted-media"
            style={{ width, height: 'auto', aspectRatio: '16/9', border: 'none', borderRadius: '0.5rem' }}
            title="Video"
          />
        ) : (
          <video
            src={getAssetUrl(videoUrl)}
            style={{ width, height: 'auto', borderRadius: '0.5rem' }}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
      </div>
    );
  }

  return null;
}

// Legacy Image Picker Modal Component (kept for reference)
function ImagePickerModal({ sharedImages, onSelect, onClose, saving }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [animation, setAnimation] = useState('fadeIn');
  const [position, setPosition] = useState('center');
  const [size, setSize] = useState('medium');
  const [orientation, setOrientation] = useState('auto');
  const [delay, setDelay] = useState(1500);
  const [duration, setDuration] = useState(500);

  const handleAdd = () => {
    if (selectedImage) {
      onSelect(selectedImage.url, animation, position, size, orientation, delay, duration);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold">Add Image to Slide</h3>
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {sharedImages?.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {sharedImages.map((img) => (
                <div
                  key={img.imageId}
                  onClick={() => setSelectedImage(img)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage?.imageId === img.imageId
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={getAssetUrl(img.url)}
                    alt={img.title || 'Image'}
                    className="w-full aspect-square object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No images in pool. Add images in the "Image Pool" tab first.</p>
            </div>
          )}
        </div>

        {selectedImage && (
          <div className="p-4 border-t bg-gray-50">
            {/* Timing - prominent on top */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <label className="block text-xs font-bold text-blue-700 mb-1">Start Delay (ms)</label>
                <input
                  type="number"
                  className="input w-full text-sm font-medium"
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
                  placeholder="1500"
                />
                <p className="text-xs text-blue-600 mt-1">When animation begins</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <label className="block text-xs font-bold text-green-700 mb-1">Duration (ms)</label>
                <input
                  type="number"
                  className="input w-full text-sm font-medium"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 500)}
                  placeholder="500"
                />
                <p className="text-xs text-green-600 mt-1">How long animation takes</p>
              </div>
            </div>
            {/* Other options */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Animation</label>
                <select
                  className="input w-full text-sm"
                  value={animation}
                  onChange={(e) => setAnimation(e.target.value)}
                >
                  {IMAGE_ANIMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                <select
                  className="input w-full text-sm"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                >
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                <select
                  className="input w-full text-sm"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Orientation</label>
                <select
                  className="input w-full text-sm"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                >
                  {ORIENTATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedImage || saving}
            className="btn btn-primary"
          >
            {saving ? 'Adding...' : 'Add Image'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Text Form Modal Component
function TextFormModal({ onSave, onClose, saving }) {
  const [formData, setFormData] = useState({
    text: '',
    horizontalPosition: 'center',
    verticalPosition: 'center',
    size: 'large',
    color: '#ffffff',
    animation: 'fadeIn',
    duration: 800,
    delay: 500
  });

  const handleSave = () => {
    if (!formData.text.trim()) {
      alert('Please enter text content');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Type className="w-5 h-5" />
            Add Text to Slide
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Content *</label>
            <input
              type="text"
              className="input w-full"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter your text..."
              autoFocus
            />
          </div>

          {/* Timing - prominent */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <label className="block text-xs font-bold text-blue-700 mb-1">Start Delay (ms)</label>
              <input
                type="number"
                className="input w-full text-sm font-medium"
                value={formData.delay}
                onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) || 0 })}
                placeholder="500"
              />
              <p className="text-xs text-blue-600 mt-1">When animation begins</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <label className="block text-xs font-bold text-green-700 mb-1">Duration (ms)</label>
              <input
                type="number"
                className="input w-full text-sm font-medium"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 800 })}
                placeholder="800"
              />
              <p className="text-xs text-green-600 mt-1">How long animation takes</p>
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horizontal Position</label>
              <select
                className="input w-full"
                value={formData.horizontalPosition}
                onChange={(e) => setFormData({ ...formData, horizontalPosition: e.target.value })}
              >
                {HORIZONTAL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vertical Position</label>
              <select
                className="input w-full"
                value={formData.verticalPosition}
                onChange={(e) => setFormData({ ...formData, verticalPosition: e.target.value })}
              >
                {VERTICAL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Style */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <select
                className="input w-full"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              >
                {TEXT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Animation</label>
              <select
                className="input w-full"
                value={formData.animation}
                onChange={(e) => setFormData({ ...formData, animation: e.target.value })}
              >
                {TEXT_ANIMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded border cursor-pointer"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <input
                  type="text"
                  className="input flex-1 text-sm"
                  placeholder="#ffffff"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <span
              className="inline-block"
              style={{
                color: formData.color,
                fontSize: formData.size === 'small' ? '14px' : formData.size === 'medium' ? '18px' : formData.size === 'large' ? '24px' : '32px'
              }}
            >
              {formData.text || 'Preview text'}
            </span>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.text.trim() || saving}
            className="btn btn-primary"
          >
            {saving ? 'Adding...' : 'Add Text'}
          </button>
        </div>
      </div>
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
        alert(`${isVideo ? 'Video' : 'Image'} deleted successfully`);
      } else {
        alert(response.message || `Failed to delete ${type}`);
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert(`Error deleting ${type}: ${err.message || 'Unknown error'}`);
    } finally {
      // Always refresh the list
      onRefresh();
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
                  <VideoPreview url={item.url} className="w-full h-full" />
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
