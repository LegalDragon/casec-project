import { useEffect, useState } from 'react';
import { Palette, Upload, RotateCcw, Save, Eye, Sparkles, Video, Plus, Trash2, ExternalLink } from 'lucide-react';
import { themeAPI, getAssetUrl } from '../../services/api';

export default function ThemeCustomization() {
  const [theme, setTheme] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Parse hero video URLs from JSON string
  const getHeroVideos = () => {
    if (!theme?.heroVideoUrls) return [];
    try {
      return JSON.parse(theme.heroVideoUrls);
    } catch {
      return [];
    }
  };

  // Update hero videos in theme state
  const setHeroVideos = (videos) => {
    setTheme({ ...theme, heroVideoUrls: JSON.stringify(videos) });
  };

  // Add a new video URL
  const addVideoUrl = () => {
    if (!newVideoUrl.trim()) return;

    // Validate URL format (YouTube or TikTok)
    const isYouTube = newVideoUrl.includes('youtube.com') || newVideoUrl.includes('youtu.be');
    const isTikTok = newVideoUrl.includes('tiktok.com');

    if (!isYouTube && !isTikTok) {
      alert('Please enter a valid YouTube or TikTok URL');
      return;
    }

    const videos = getHeroVideos();
    if (videos.includes(newVideoUrl.trim())) {
      alert('This video URL is already added');
      return;
    }

    setHeroVideos([...videos, newVideoUrl.trim()]);
    setNewVideoUrl('');
  };

  // Remove a video URL
  const removeVideoUrl = (index) => {
    const videos = getHeroVideos();
    videos.splice(index, 1);
    setHeroVideos([...videos]);
  };

  // Get video type from URL
  const getVideoType = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('tiktok.com')) return 'TikTok';
    return 'Video';
  };

  useEffect(() => {
    loadTheme();
    loadPresets();
  }, []);

  const loadTheme = async () => {
    try {
      const response = await themeAPI.getCurrent();
      if (response.success) {
        setTheme(response.data);
      }
    } catch (err) {
      console.error('Failed to load theme:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const response = await themeAPI.getPresets();
      if (response.success) {
        setPresets(response.data);
      }
    } catch (err) {
      console.error('Failed to load presets:', err);
    }
  };

  const handleColorChange = (field, value) => {
    setTheme({ ...theme, [field]: value });
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      
      const response = await themeAPI.uploadLogo(formData);
      if (response.success) {
        setTheme({ ...theme, logoUrl: response.data.url });
        setLogoFile(null);
        alert('Logo uploaded successfully!');
      }
    } catch (err) {
      alert('Failed to upload logo: ' + (err.message || 'Please try again'));
    }
  };

  const handleUploadFavicon = async () => {
    if (!faviconFile) return;
    
    try {
      const formData = new FormData();
      formData.append('file', faviconFile);
      
      const response = await themeAPI.uploadFavicon(formData);
      if (response.success) {
        setTheme({ ...theme, faviconUrl: response.data.url });
        setFaviconFile(null);
        alert('Favicon uploaded successfully!');
      }
    } catch (err) {
      alert('Failed to upload favicon: ' + (err.message || 'Please try again'));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await themeAPI.update(theme);
      if (response.success) {
        alert('Theme updated successfully! Refresh the page to see changes.');
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to update theme: ' + (err.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset theme to default? This will undo all customizations.')) return;
    
    try {
      const response = await themeAPI.reset();
      if (response.success) {
        setTheme(response.data);
        alert('Theme reset to default!');
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to reset theme: ' + (err.message || 'Please try again'));
    }
  };

  const applyPreset = (preset) => {
    setTheme({
      ...theme,
      primaryColor: preset.primaryColor,
      primaryDarkColor: preset.primaryDarkColor,
      primaryLightColor: preset.primaryLightColor,
      accentColor: preset.accentColor,
      accentDarkColor: preset.accentDarkColor,
      accentLightColor: preset.accentLightColor
    });
  };

  if (loading) return <div className="text-center py-12">Loading theme settings...</div>;
  if (!theme) return <div className="text-center py-12">No theme found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Theme Customization</h1>
          <p className="text-gray-600 text-lg">Customize your organization's branding and colors</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>
          <button
            onClick={handleReset}
            className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Organization Branding */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span>Organization Branding</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={theme.organizationName}
              onChange={(e) => setTheme({ ...theme, organizationName: e.target.value })}
              className="input w-full"
              placeholder="e.g., CASEC"
            />
            <p className="text-xs text-gray-500 mt-1">Displayed in browser tab and header</p>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logo (replaces "CASEC" text)
            </label>
            <div className="flex items-center space-x-3">
              {theme.logoUrl && (
                <img src={getAssetUrl(theme.logoUrl)} alt="Logo" className="h-12 w-auto" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files[0])}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload" className="btn btn-secondary cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Choose Logo
              </label>
              {logoFile && (
                <button onClick={handleUploadLogo} className="btn btn-accent">
                  Upload
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">PNG, SVG, JPG, WEBP (max 5MB)</p>
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Favicon (browser tab icon)
            </label>
            <div className="flex items-center space-x-3">
              {theme.faviconUrl && (
                <img src={getAssetUrl(theme.faviconUrl)} alt="Favicon" className="h-8 w-8" />
              )}
              <input
                type="file"
                accept=".ico,.png,.svg"
                onChange={(e) => setFaviconFile(e.target.files[0])}
                className="hidden"
                id="favicon-upload"
              />
              <label htmlFor="favicon-upload" className="btn btn-secondary cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Choose Favicon
              </label>
              {faviconFile && (
                <button onClick={handleUploadFavicon} className="btn btn-accent">
                  Upload
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">ICO, PNG, SVG (max 1MB)</p>
          </div>
        </div>
      </div>

      {/* Home Page Quote */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span>Home Page Quote</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Inspirational Quote
            </label>
            <textarea
              value={theme.homeQuote || ''}
              onChange={(e) => setTheme({ ...theme, homeQuote: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="Building bridges across cultures, creating connections that last a lifetime."
            />
            <p className="text-xs text-gray-500 mt-1">Main quote displayed on the home page (max 500 characters)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quote Subtext
            </label>
            <textarea
              value={theme.homeQuoteSubtext || ''}
              onChange={(e) => setTheme({ ...theme, homeQuoteSubtext: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="Join our vibrant community celebrating heritage, fostering friendships, and making memories together."
            />
            <p className="text-xs text-gray-500 mt-1">Supporting text below the quote (max 500 characters)</p>
          </div>
        </div>
      </div>

      {/* Hero Background Videos */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Video className="w-6 h-6 text-primary" />
          <span>Hero Background Videos</span>
        </h2>

        <p className="text-gray-600 mb-4">
          Add YouTube or TikTok video URLs to display as background videos on the home page hero section.
          A random video will be selected each time the page loads.
        </p>

        {/* Add new video URL */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addVideoUrl();
              }
            }}
            className="input flex-1"
            placeholder="Paste YouTube or TikTok URL..."
          />
          <button
            type="button"
            onClick={addVideoUrl}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </button>
        </div>

        {/* List of videos */}
        <div className="space-y-2">
          {getHeroVideos().length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hero videos added yet</p>
              <p className="text-sm text-gray-400">Add YouTube or TikTok URLs above</p>
            </div>
          ) : (
            getHeroVideos().map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    getVideoType(url) === 'YouTube'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-black text-white'
                  }`}>
                    {getVideoType(url)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{url}</p>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-primary transition-colors"
                  title="Open video"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => removeVideoUrl(index)}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Remove video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Tip: For best results, use videos that work well as muted background content.
          Videos will play automatically, muted, and loop continuously.
        </p>
      </div>

      {/* Color Presets */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Theme Presets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map(preset => (
            <div
              key={preset.presetId}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary cursor-pointer transition-all"
              onClick={() => applyPreset(preset)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">{preset.presetName}</h3>
                {preset.isDefault && (
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded">Default</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
              <div className="flex space-x-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: preset.primaryColor }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: preset.accentColor }}
                  title="Accent"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Colors */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Palette className="w-6 h-6 text-primary" />
          <span>Primary Colors</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ColorPicker
            label="Primary Color"
            value={theme.primaryColor}
            onChange={(val) => handleColorChange('primaryColor', val)}
            description="Main brand color"
          />
          <ColorPicker
            label="Primary Dark"
            value={theme.primaryDarkColor}
            onChange={(val) => handleColorChange('primaryDarkColor', val)}
            description="Darker shade"
          />
          <ColorPicker
            label="Primary Light"
            value={theme.primaryLightColor}
            onChange={(val) => handleColorChange('primaryLightColor', val)}
            description="Lighter shade"
          />
        </div>
      </div>

      {/* Accent Colors */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Accent Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ColorPicker
            label="Accent Color"
            value={theme.accentColor}
            onChange={(val) => handleColorChange('accentColor', val)}
            description="Secondary highlights"
          />
          <ColorPicker
            label="Accent Dark"
            value={theme.accentDarkColor}
            onChange={(val) => handleColorChange('accentDarkColor', val)}
            description="Darker accent"
          />
          <ColorPicker
            label="Accent Light"
            value={theme.accentLightColor}
            onChange={(val) => handleColorChange('accentLightColor', val)}
            description="Lighter accent"
          />
        </div>
      </div>

      {/* Status Colors */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Status Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ColorPicker
            label="Success"
            value={theme.successColor}
            onChange={(val) => handleColorChange('successColor', val)}
            description="Success messages"
          />
          <ColorPicker
            label="Error"
            value={theme.errorColor}
            onChange={(val) => handleColorChange('errorColor', val)}
            description="Error messages"
          />
          <ColorPicker
            label="Warning"
            value={theme.warningColor}
            onChange={(val) => handleColorChange('warningColor', val)}
            description="Warnings"
          />
          <ColorPicker
            label="Info"
            value={theme.infoColor}
            onChange={(val) => handleColorChange('infoColor', val)}
            description="Information"
          />
        </div>
      </div>

      {/* Text Colors */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Text Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ColorPicker
            label="Primary Text"
            value={theme.textPrimaryColor}
            onChange={(val) => handleColorChange('textPrimaryColor', val)}
            description="Main text"
          />
          <ColorPicker
            label="Secondary Text"
            value={theme.textSecondaryColor}
            onChange={(val) => handleColorChange('textSecondaryColor', val)}
            description="Muted text"
          />
          <ColorPicker
            label="Light Text"
            value={theme.textLightColor}
            onChange={(val) => handleColorChange('textLightColor', val)}
            description="Text on dark bg"
          />
        </div>
      </div>

      {/* Background Colors */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Background Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker
            label="Background"
            value={theme.backgroundColor}
            onChange={(val) => handleColorChange('backgroundColor', val)}
            description="Main background"
          />
          <ColorPicker
            label="Secondary Background"
            value={theme.backgroundSecondaryColor}
            onChange={(val) => handleColorChange('backgroundSecondaryColor', val)}
            description="Cards, sections"
          />
        </div>
      </div>

      {/* Typography */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Typography</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Body Font
            </label>
            <input
              type="text"
              value={theme.fontFamily}
              onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
              className="input w-full"
              placeholder="Inter, system-ui, sans-serif"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Heading Font
            </label>
            <input
              type="text"
              value={theme.headingFontFamily}
              onChange={(e) => setTheme({ ...theme, headingFontFamily: e.target.value })}
              className="input w-full"
              placeholder="Playfair Display, serif"
            />
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Custom CSS (Advanced)</h2>
        <textarea
          value={theme.customCss || ''}
          onChange={(e) => setTheme({ ...theme, customCss: e.target.value })}
          className="input w-full font-mono text-sm"
          rows={8}
          placeholder=".custom-class { color: red; }"
        />
        <p className="text-sm text-gray-500 mt-2">
          Add custom CSS rules. Use with caution.
        </p>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleReset}
          className="btn btn-secondary"
        >
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

// Color Picker Component
function ColorPicker({ label, value, onChange, description }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input flex-1"
          placeholder="#000000"
        />
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}
