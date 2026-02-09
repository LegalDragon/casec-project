import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, Globe, Settings } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "../services/api";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

// URL Params override API settings: ?duration=8000&maxLines=5&fadeMode=true&showHeader=true
function useConfig() {
  const [config, setConfig] = useState({
    duration: 8000,
    maxLines: 5,
    fadeMode: true,
    showHeader: true,
    showFooter: true,
    fontSize: "lg",
  });

  useEffect(() => {
    // Load settings from API, then override with URL params
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/settings/transcription');
        if (res.ok) {
          const apiSettings = await res.json();
          const params = new URLSearchParams(window.location.search);
          
          setConfig({
            duration: parseInt(params.get("duration") ?? apiSettings.duration ?? 8000),
            maxLines: parseInt(params.get("maxLines") ?? apiSettings.maxLines ?? 5),
            fadeMode: params.has("fadeMode") ? params.get("fadeMode") !== "false" : (apiSettings.fadeMode ?? true),
            showHeader: params.has("showHeader") ? params.get("showHeader") !== "false" : (apiSettings.showHeader ?? true),
            showFooter: params.has("showFooter") ? params.get("showFooter") !== "false" : (apiSettings.showFooter ?? true),
            fontSize: params.get("fontSize") ?? apiSettings.fontSize ?? "lg",
          });
        }
      } catch (err) {
        console.log("Using default config (API unavailable)");
        // Fall back to URL params only
        const params = new URLSearchParams(window.location.search);
        setConfig({
          duration: parseInt(params.get("duration") || "8000"),
          maxLines: parseInt(params.get("maxLines") || "5"),
          fadeMode: params.get("fadeMode") !== "false",
          showHeader: params.get("showHeader") !== "false",
          showFooter: params.get("showFooter") !== "false",
          fontSize: params.get("fontSize") || "lg",
        });
      }
    };
    loadConfig();
  }, []);

  return config;
}

export default function LiveTranscriptionDisplay() {
  const config = useConfig();
  const [status, setStatus] = useState("connecting");
  const [statusMessage, setStatusMessage] = useState("Connecting to server...");
  const [transcriptions, setTranscriptions] = useState({}); // { [langCode]: { lines: [], currentText: "" } }
  const [activeLanguage, setActiveLanguage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRefs = useRef({});
  const timersRef = useRef({});

  useEffect(() => {
    // Initialize transcriptions for all languages
    const initial = {};
    LANGUAGES.forEach(lang => {
      initial[lang.code] = { lines: [], currentText: "" };
    });
    setTranscriptions(initial);

    // Connect to SignalR hub
    // API_BASE_URL may or may not include /api - handle both cases
    const baseUrl = API_BASE_URL || window.location.origin;
    const hubUrl = baseUrl.includes('/api') 
      ? `${baseUrl}/hubs/transcription`
      : `${baseUrl}/api/hubs/transcription`;
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Helper to schedule line removal
    const scheduleRemoval = (lineId, lang) => {
      if (config.fadeMode && config.duration > 0) {
        const key = `${lang}-${lineId}`;
        if (timersRef.current[key]) clearTimeout(timersRef.current[key]);
        timersRef.current[key] = setTimeout(() => {
          setTranscriptions(prev => {
            const updated = { ...prev };
            if (updated[lang]) {
              updated[lang] = {
                ...updated[lang],
                lines: updated[lang].lines.filter(l => l.id !== lineId)
              };
            }
            return updated;
          });
          delete timersRef.current[key];
        }, config.duration);
      }
    };

    connection.on("ReceiveTranscription", (message) => {
      console.log("Received transcription:", message);
      setActiveLanguage(message.language);
      
      setTranscriptions(prev => {
        const updated = { ...prev };
        const lang = message.language;
        
        if (!updated[lang]) {
          updated[lang] = { lines: [], currentText: "" };
        }

        if (message.isFinal) {
          // Add to history, clear current
          const newLine = { 
            id: message.id, 
            text: message.text,
            timestamp: new Date(message.timestamp),
            fading: false
          };
          updated[lang] = {
            lines: [...updated[lang].lines, newLine].slice(-config.maxLines),
            currentText: ""
          };
          // Schedule removal after render
          setTimeout(() => scheduleRemoval(message.id, lang), 0);
        } else {
          // Update interim text
          updated[lang] = {
            ...updated[lang],
            currentText: message.text
          };
        }
        
        return updated;
      });
    });

    connection.on("ReceiveTranslation", (message) => {
      console.log("Received translation:", message);
      
      setTranscriptions(prev => {
        const updated = { ...prev };
        const lang = message.targetLanguage;
        
        if (!updated[lang]) {
          updated[lang] = { lines: [], currentText: "" };
        }

        // Find if we already have this transcription ID, if so update it
        const existingIndex = updated[lang].lines.findIndex(l => l.id === message.transcriptionId);
        
        if (existingIndex >= 0) {
          updated[lang].lines[existingIndex].text = message.text;
        } else {
          // Add new translation
          const newLine = {
            id: message.transcriptionId,
            text: message.text,
            timestamp: new Date(message.timestamp),
            fading: false
          };
          updated[lang] = {
            ...updated[lang],
            lines: [...updated[lang].lines, newLine].slice(-config.maxLines)
          };
          // Schedule removal after render
          setTimeout(() => scheduleRemoval(message.transcriptionId, lang), 0);
        }
        
        return updated;
      });
    });

    connection.on("ReceiveStatus", (message) => {
      console.log("Status:", message);
      setStatus(message.type);
      setStatusMessage(message.message);
    });

    connection.onclose(() => {
      setStatus("disconnected");
      setStatusMessage("Disconnected from server");
    });

    connection.onreconnecting(() => {
      setStatus("connecting");
      setStatusMessage("Reconnecting...");
    });

    connection.onreconnected(() => {
      setStatus("connected");
      setStatusMessage("Connected");
      connection.invoke("RegisterDisplay", "Video Wall");
    });

    connection.start()
      .then(() => {
        setStatus("connected");
        setStatusMessage("Connected - Waiting for capture...");
        connection.invoke("RegisterDisplay", "Video Wall");
      })
      .catch(err => {
        console.error("SignalR error:", err);
        setStatus("error");
        setStatusMessage("Connection failed");
      });

    return () => {
      connection.stop();
      // Clear all fade timers
      Object.values(timersRef.current).forEach(t => clearTimeout(t));
      timersRef.current = {};
    };
  }, [config.duration, config.fadeMode, config.maxLines]);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    Object.keys(scrollRefs.current).forEach(lang => {
      const el = scrollRefs.current[lang];
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [transcriptions]);

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
      case "capturing":
        return <Wifi className="w-5 h-5 text-green-400" />;
      case "connecting":
        return <Wifi className="w-5 h-5 text-yellow-400 animate-pulse" />;
      default:
        return <WifiOff className="w-5 h-5 text-red-400" />;
    }
  };

  const fontSizeClass = {
    sm: "text-sm",
    md: "text-base", 
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl"
  }[config.fontSize] || "text-lg";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      {config.showHeader && (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">Live Transcription</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon()}
              <span className={status === "capturing" ? "text-green-400" : "text-gray-400"}>
                {statusMessage}
              </span>
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 text-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-gray-400">URL Params:</span>
            <code className="bg-gray-900 px-2 py-1 rounded text-purple-300">
              ?duration={config.duration}&maxLines={config.maxLines}&fontSize={config.fontSize}&fadeMode={config.fadeMode}
            </code>
            <span className="text-gray-500">
              (duration=0 for no auto-fade)
            </span>
          </div>
        </div>
      )}

      {/* Language Columns */}
      <div className="flex-1 flex overflow-hidden">
        {LANGUAGES.map((lang) => {
          const isActive = activeLanguage === lang.code;
          const data = transcriptions[lang.code] || { lines: [], currentText: "" };
          
          return (
            <div
              key={lang.code}
              className={`flex-1 flex flex-col border-r border-gray-800 last:border-r-0 transition-all duration-500 ${
                isActive ? "bg-purple-900/20" : "bg-gray-900/30"
              }`}
            >
              {/* Language Header */}
              <div className={`px-4 py-3 border-b flex items-center justify-center gap-2 transition-all duration-300 ${
                isActive ? "bg-purple-600 border-purple-500" : "bg-gray-800 border-gray-700"
              }`}>
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-bold text-lg">{lang.name}</span>
                {isActive && (
                  <span className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>

              {/* Transcription Content */}
              <div 
                ref={el => scrollRefs.current[lang.code] = el}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {data.lines.map((line, idx) => (
                  <div
                    key={line.id || idx}
                    className={`p-3 rounded-lg transition-all duration-500 animate-fadeIn ${
                      idx === data.lines.length - 1
                        ? "bg-gray-800 border-l-4 border-purple-500"
                        : "bg-gray-800/50"
                    }`}
                  >
                    <p className={`${fontSizeClass} leading-relaxed`}>{line.text}</p>
                  </div>
                ))}

                {/* Interim/Current Text */}
                {data.currentText && (
                  <div className="p-3 rounded-lg bg-gray-800/30 border border-dashed border-gray-600">
                    <p className={`${fontSizeClass} leading-relaxed text-gray-300 italic`}>
                      {data.currentText}
                      <span className="animate-pulse">▊</span>
                    </p>
                  </div>
                )}

                {/* Empty State */}
                {data.lines.length === 0 && !data.currentText && (
                  <div className="text-center text-gray-600 py-8">
                    <p>Waiting for transcription...</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {config.showFooter && (
        <div className="bg-gray-900 border-t border-gray-800 px-6 py-2 text-center text-xs text-gray-500">
          CASEC 2026 Spring Gala • Live Translation
        </div>
      )}

      {/* Styles for smooth animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
