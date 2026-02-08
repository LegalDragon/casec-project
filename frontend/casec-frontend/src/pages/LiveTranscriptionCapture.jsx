import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Wifi, WifiOff, Volume2 } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "../services/api";

// Deepgram streaming configuration
const DEEPGRAM_API_KEY = "7b6dcb8a7b12b97ab4196cec7ee1163ac8f792c7";
const SUPPORTED_LANGUAGES = ["en", "es", "zh", "fr"];

export default function LiveTranscriptionCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, connecting, connected, error
  const [error, setError] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [hubConnected, setHubConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const hubConnectionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const deepgramSocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  // Connect to SignalR hub
  useEffect(() => {
    const hubUrl = `${API_BASE_URL}/hubs/transcription`;
    
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

  const startCapture = async () => {
    try {
      setStatus("connecting");
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;

      // Set up audio level monitoring
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      monitorAudioLevel();

      // Connect to Deepgram
      const deepgramUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=multi&detect_language=true&punctuate=true&interim_results=true`;
      
      const socket = new WebSocket(deepgramUrl, ["token", DEEPGRAM_API_KEY]);
      deepgramSocketRef.current = socket;

      socket.onopen = () => {
        console.log("Deepgram connected");
        setStatus("connected");
        setIsCapturing(true);
        startRecording(stream, socket);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleDeepgramResponse(data);
      };

      socket.onerror = (err) => {
        console.error("Deepgram error:", err);
        setError("Connection to transcription service failed");
        setStatus("error");
        stopCapture();
      };

      socket.onclose = () => {
        console.log("Deepgram disconnected");
        if (isCapturing) {
          setStatus("idle");
          setIsCapturing(false);
        }
      };

    } catch (err) {
      console.error("Error starting capture:", err);
      setError(err.message || "Failed to access microphone");
      setStatus("error");
    }
  };

  const startRecording = (stream, socket) => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus"
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    mediaRecorder.start(250); // Send audio every 250ms
  };

  const handleDeepgramResponse = (data) => {
    if (!data.channel?.alternatives?.[0]) return;

    const alt = data.channel.alternatives[0];
    const text = alt.transcript;
    const isFinal = data.is_final;
    const detectedLang = alt.languages?.[0] || data.metadata?.detected_language || "en";

    if (!text) return;

    // Map Deepgram language codes to our codes
    const langMap = {
      "en": "en", "en-US": "en", "en-GB": "en",
      "es": "es", "es-ES": "es", "es-MX": "es",
      "zh": "zh", "zh-CN": "zh", "zh-TW": "zh", "cmn": "zh",
      "fr": "fr", "fr-FR": "fr"
    };
    const normalizedLang = langMap[detectedLang] || "en";

    setDetectedLanguage(normalizedLang);
    setTranscript(text);

    // Send to SignalR hub
    if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
      hubConnectionRef.current.invoke("SendTranscription", text, normalizedLang, isFinal)
        .catch(err => console.error("Error sending transcription:", err));
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
    setIsCapturing(false);
    setStatus("idle");

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (deepgramSocketRef.current) {
      deepgramSocketRef.current.close();
      deepgramSocketRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  }, []);

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
            <p className="text-sm text-gray-400 mb-2">Latest:</p>
            <p className="text-lg">{transcript}</p>
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
