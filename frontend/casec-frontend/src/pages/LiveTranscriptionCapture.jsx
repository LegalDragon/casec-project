import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Wifi, WifiOff, Volume2 } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "../services/api";

// Deepgram streaming - direct connection with API key  
const DEEPGRAM_API_KEY = "7b6dcb8a7b12b97ab4196cec7ee1163ac8f792c7";
const SUPPORTED_LANGUAGES = ["en", "es", "zh", "fr"];

export default function LiveTranscriptionCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, connecting, connected, error
  const [error, setError] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptHistory, setTranscriptHistory] = useState([]); // Keep history of final transcripts
  const [hubConnected, setHubConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [debugLog, setDebugLog] = useState([]);

  const hubConnectionRef = useRef(null);
  const processorRef = useRef(null);
  const socketZhRef = useRef(null);
  const socketEnRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  // Connect to SignalR hub
  useEffect(() => {
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

    connection.onclose(() => {
      console.log("SignalR disconnected");
      setHubConnected(false);
    });

    connection.onreconnecting(() => {
      console.log("SignalR reconnecting...");
      setHubConnected(false);
    });

    connection.onreconnected(() => {
      console.log("SignalR reconnected");
      setHubConnected(true);
      connection.invoke("RegisterCapture", getDeviceName());
    });

    connection.start()
      .then(() => {
        console.log("SignalR connected");
        setHubConnected(true);
        connection.invoke("RegisterCapture", getDeviceName());
      })
      .catch(err => {
        console.error("SignalR connection error:", err);
        setError("Failed to connect to server");
      });

    hubConnectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []);

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS Device";
    if (/Android/.test(ua)) return "Android Device";
    if (/Mac/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows PC";
    return "Browser";
  };

  // Debug logging helper
  const log = useCallback((msg) => {
    console.log(`[Capture] ${msg}`);
    setDebugLog(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  const startCapture = async () => {
    try {
      setStatus("connecting");
      setError(null);
      log("Starting capture (dual-stream ZH+EN)...");

      // Request microphone access
      log("Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;
      log("Microphone access granted");

      // Set up audio context with 16kHz sample rate for Deepgram
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      monitorAudioLevel();

      // Create processor for PCM data
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;

      // DUAL STREAM: Create two parallel Deepgram connections - Chinese and English
      const baseParams = "model=nova-2&encoding=linear16&sample_rate=16000&channels=1&punctuate=true&interim_results=true&smart_format=true";
      const urlZh = `wss://api.deepgram.com/v1/listen?${baseParams}&language=zh`;
      const urlEn = `wss://api.deepgram.com/v1/listen?${baseParams}&language=en`;
      
      log("Connecting to Deepgram (ZH stream)...");
      log("Connecting to Deepgram (EN stream)...");

      const socketZh = new WebSocket(urlZh, ["token", DEEPGRAM_API_KEY]);
      const socketEn = new WebSocket(urlEn, ["token", DEEPGRAM_API_KEY]);
      socketZh.binaryType = "arraybuffer";
      socketEn.binaryType = "arraybuffer";
      socketZhRef.current = socketZh;
      socketEnRef.current = socketEn;

      let zhReady = false, enReady = false;

      const checkBothReady = () => {
        if (zhReady && enReady) {
          log("✓ Both streams connected!");
          setStatus("connected");
          setIsCapturing(true);
          
          // Send audio to BOTH streams
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16Data = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            if (socketZh.readyState === WebSocket.OPEN) socketZh.send(int16Data.buffer);
            if (socketEn.readyState === WebSocket.OPEN) socketEn.send(int16Data.buffer);
          };
        }
      };

      // Chinese stream handlers
      socketZh.onopen = () => { log("ZH stream connected"); zhReady = true; checkBothReady(); };
      socketZh.onmessage = (e) => handleDgMessage(e, "zh");
      socketZh.onerror = () => log("ZH stream error");
      socketZh.onclose = (e) => log(`ZH closed: ${e.code}`);

      // English stream handlers
      socketEn.onopen = () => { log("EN stream connected"); enReady = true; checkBothReady(); };
      socketEn.onmessage = (e) => handleDgMessage(e, "en");
      socketEn.onerror = () => log("EN stream error");
      socketEn.onclose = (e) => log(`EN closed: ${e.code}`);

    } catch (err) {
      console.error("Error starting capture:", err);
      setError(err.message || "Failed to access microphone");
      setStatus("error");
    }
  };

  // Handle messages from either Deepgram stream
  const handleDgMessage = (event, streamLang) => {
    try {
      const data = JSON.parse(event.data);
      const alt = data.channel?.alternatives?.[0];
      const text = alt?.transcript;
      if (!text) return;

      const isFinal = data.is_final;
      
      // Detect language from content - Chinese characters = zh
      const hasChinese = /[\u4e00-\u9fff]/.test(text);
      const detectedLang = hasChinese ? "zh" : "en";
      
      // Only process if this stream matches the detected language
      // This prevents duplicate processing
      if ((hasChinese && streamLang !== "zh") || (!hasChinese && streamLang !== "en")) {
        return; // Let the other stream handle it
      }

      log(`${streamLang.toUpperCase()}: "${text}" -> ${detectedLang}`);
      
      setDetectedLanguage(detectedLang);
      setTranscript(text);

      if (isFinal) {
        log(`Final transcript (${detectedLang}): ${text}`);
        setTranscriptHistory(prev => [...prev.slice(-10), { text, lang: detectedLang, time: new Date() }]);
        
        // Send to SignalR hub
        if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
          hubConnectionRef.current.invoke("SendTranscription", text, detectedLang, true)
            .catch(err => log(`SignalR error: ${err.message}`));
        }
      }
    } catch (e) {
      log(`Parse error: ${e.message}`);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const update = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      requestAnimationFrame(update);
    };
    
    update();
  };

  const stopCapture = useCallback(() => {
    log("Stopping capture...");
    setIsCapturing(false);
    setStatus("idle");

    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close both Deepgram streams
    if (socketZhRef.current) {
      socketZhRef.current.close();
      socketZhRef.current = null;
    }
    if (socketEnRef.current) {
      socketEnRef.current.close();
      socketEnRef.current = null;
    }

    // Stop microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
    log("Capture stopped");
  }, [log]);

  const getLanguageName = (code) => {
    const names = { en: "English", es: "Español", zh: "中文", fr: "Français" };
    return names[code] || code;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Live Transcription Capture</h1>
        <p className="text-gray-400">
          {hubConnected ? (
            <span className="flex items-center justify-center gap-2 text-green-400">
              <Wifi className="w-4 h-4" /> Connected to server
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 text-yellow-400">
              <WifiOff className="w-4 h-4" /> Connecting...
            </span>
          )}
        </p>
      </div>

      {/* Main Control */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Audio Level Indicator */}
        {isCapturing && (
          <div className="w-full max-w-md mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mic Button */}
        <button
          onClick={isCapturing ? stopCapture : startCapture}
          disabled={status === "connecting" || !hubConnected}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isCapturing
              ? "bg-red-600 hover:bg-red-700 animate-pulse"
              : status === "connecting"
              ? "bg-yellow-600"
              : "bg-green-600 hover:bg-green-700"
          } ${(!hubConnected) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {status === "connecting" ? (
            <Loader2 className="w-16 h-16 animate-spin" />
          ) : isCapturing ? (
            <MicOff className="w-16 h-16" />
          ) : (
            <Mic className="w-16 h-16" />
          )}
        </button>

        <p className="mt-4 text-lg">
          {status === "connecting" && "Connecting..."}
          {status === "connected" && "Listening... Tap to stop"}
          {status === "idle" && "Tap to start capturing"}
          {status === "error" && "Error - Tap to retry"}
        </p>

        {/* Detected Language */}
        {detectedLanguage && isCapturing && (
          <div className="mt-4 px-4 py-2 bg-gray-800 rounded-lg">
            <span className="text-gray-400">Detected: </span>
            <span className="font-bold text-purple-400">{getLanguageName(detectedLanguage)}</span>
          </div>
        )}

        {/* Live Transcript Preview */}
        {transcript && (
          <div className="mt-6 w-full max-w-lg p-4 bg-gray-800/50 rounded-xl">
            <p className="text-sm text-gray-400 mb-2">Current:</p>
            <p className="text-lg">{transcript}</p>
          </div>
        )}

        {/* Transcript History */}
        {transcriptHistory.length > 0 && (
          <div className="mt-4 w-full max-w-lg p-4 bg-gray-900 rounded-xl max-h-48 overflow-y-auto">
            <p className="text-sm text-gray-400 mb-2">History (final transcripts):</p>
            {transcriptHistory.map((item, idx) => (
              <div key={idx} className="py-1 border-b border-gray-700 last:border-0">
                <span className="text-purple-400 text-xs">[{item.lang}]</span>
                <span className="ml-2 text-white">{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Debug Log */}
        {debugLog.length > 0 && (
          <div className="mt-4 w-full max-w-lg p-4 bg-gray-950 rounded-xl max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-500 mb-2">Debug:</p>
            {debugLog.map((line, idx) => (
              <p key={idx} className="text-xs text-gray-600 font-mono">{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-600/90 text-white p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Place this device near the speaker</p>
        <p>Supports: English, Spanish, Chinese, French</p>
      </div>
    </div>
  );
}
