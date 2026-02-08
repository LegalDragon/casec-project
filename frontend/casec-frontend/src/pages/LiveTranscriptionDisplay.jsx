import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, Globe } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "../services/api";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export default function LiveTranscriptionDisplay() {
  const [status, setStatus] = useState("connecting");
  const [statusMessage, setStatusMessage] = useState("Connecting to server...");
  const [transcriptions, setTranscriptions] = useState({}); // { [langCode]: { lines: [], currentText: "" } }
  const [activeLanguage, setActiveLanguage] = useState(null);
  const scrollRefs = useRef({});

  useEffect(() => {
    // Initialize transcriptions for all languages
    const initial = {};
    LANGUAGES.forEach(lang => {
      initial[lang.code] = { lines: [], currentText: "" };
    });
    setTranscriptions(initial);

    // Connect to SignalR hub
    const hubUrl = `${API_BASE_URL}/hubs/transcription`;
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

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
          updated[lang] = {
            lines: [...updated[lang].lines, { 
              id: message.id, 
              text: message.text,
              timestamp: new Date(message.timestamp)
            }].slice(-20), // Keep last 20 lines
            currentText: ""
          };
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
          updated[lang] = {
            ...updated[lang],
            lines: [...updated[lang].lines, {
              id: message.transcriptionId,
              text: message.text,
              timestamp: new Date(message.timestamp)
            }].slice(-20)
          };
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
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-purple-400" />
          <h1 className="text-xl font-bold">Live Transcription</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          <span className={status === "capturing" ? "text-green-400" : "text-gray-400"}>
            {statusMessage}
          </span>
        </div>
      </div>

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
                    className={`p-3 rounded-lg transition-all duration-300 ${
                      idx === data.lines.length - 1
                        ? "bg-gray-800 border-l-4 border-purple-500"
                        : "bg-gray-800/50"
                    }`}
                  >
                    <p className="text-lg leading-relaxed">{line.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {line.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}

                {/* Interim/Current Text */}
                {data.currentText && (
                  <div className="p-3 rounded-lg bg-gray-800/30 border border-dashed border-gray-600">
                    <p className="text-lg leading-relaxed text-gray-300 italic">
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
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-2 text-center text-xs text-gray-500">
        CASEC 2026 Spring Gala • Live Translation
      </div>

      {/* Styles for smooth animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
