import { useState, useEffect } from 'react';
import { Save, Monitor, Clock, Type, Rows3, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

const DEFAULT_SETTINGS = {
  duration: 8000,
  maxLines: 5,
  fontSize: 'lg',
  fadeMode: true,
  showHeader: true,
  showFooter: true,
};

export default function AdminTranscription() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Build preview URL whenever settings change
    const params = new URLSearchParams({
      duration: settings.duration,
      maxLines: settings.maxLines,
      fontSize: settings.fontSize,
      fadeMode: settings.fadeMode,
      showHeader: settings.showHeader,
      showFooter: settings.showFooter,
    });
    setPreviewUrl(`/live-transcription?${params}`);
  }, [settings]);

  const loadSettings = async () => {
    try {
      const res = await api.get('/api/settings/transcription');
      if (res.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...res.data });
      }
    } catch (err) {
      console.log('No saved settings, using defaults');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/api/settings/transcription', settings);
      setMessage({ type: 'success', text: 'Settings saved!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }
    setSaving(false);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            Live Transcription Settings
          </h1>
          <p className="text-gray-500 mt-1">Configure display settings for the live transcription viewer</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duration */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Clock className="w-4 h-4" />
            Display Duration
          </label>
          <p className="text-xs text-gray-500 mb-3">How long each line stays visible (0 = forever)</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="30000"
              step="1000"
              value={settings.duration}
              onChange={(e) => handleChange('duration', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono w-16 text-right">
              {settings.duration === 0 ? '∞' : `${settings.duration / 1000}s`}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Forever</span>
            <span>30 sec</span>
          </div>
        </div>

        {/* Max Lines */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Rows3 className="w-4 h-4" />
            Maximum Lines
          </label>
          <p className="text-xs text-gray-500 mb-3">Max lines per language column</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="20"
              value={settings.maxLines}
              onChange={(e) => handleChange('maxLines', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono w-16 text-right">{settings.maxLines}</span>
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Type className="w-4 h-4" />
            Font Size
          </label>
          <p className="text-xs text-gray-500 mb-3">Text size for transcriptions</p>
          <select
            value={settings.fontSize}
            onChange={(e) => handleChange('fontSize', e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
            <option value="2xl">2X Large</option>
          </select>
        </div>

        {/* Toggle Options */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <label className="text-sm font-medium mb-3 block">Display Options</label>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.fadeMode}
                onChange={(e) => handleChange('fadeMode', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Auto-fade old lines</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showHeader}
                onChange={(e) => handleChange('showHeader', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Show header bar</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showFooter}
                onChange={(e) => handleChange('showFooter', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Show footer</span>
            </label>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/live-transcription/capture"
            target="_blank"
            className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900 rounded-lg hover:bg-green-200 dark:hover:bg-green-800"
          >
            <span className="text-2xl">🎤</span>
            <div>
              <div className="font-medium">Capture Page</div>
              <div className="text-xs text-gray-500">Open on device with microphone</div>
            </div>
          </a>
          
          <a
            href={previewUrl}
            target="_blank"
            className="flex items-center gap-2 p-3 bg-purple-100 dark:bg-purple-900 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800"
          >
            <span className="text-2xl">📺</span>
            <div>
              <div className="font-medium">Display Page (with current settings)</div>
              <div className="text-xs text-gray-500">Open on projector/screen</div>
            </div>
          </a>
        </div>

        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Display URL with current settings:</div>
          <code className="text-sm text-purple-600 dark:text-purple-400 break-all">{previewUrl}</code>
        </div>
      </div>
    </div>
  );
}
