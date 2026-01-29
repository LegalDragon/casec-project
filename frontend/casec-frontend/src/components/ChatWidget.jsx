import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Check if chatbot is available
  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const headers = {};
      const authData = localStorage.getItem('casec-auth');
      if (authData) {
        const { token } = JSON.parse(authData).state;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_BASE_URL}/chat/availability`, { headers });
      const data = await response.json();
      setIsAvailable(data.success && data.data?.available);
    } catch (err) {
      console.error('Failed to check chat availability:', err);
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    // Add placeholder for assistant response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const headers = {
        'Content-Type': 'application/json',
      };
      const authData = localStorage.getItem('casec-auth');
      if (authData) {
        const { token } = JSON.parse(authData).state;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantContent
                  };
                  return updated;
                });
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }

      // If no content was streamed, show error
      if (!assistantContent) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Sorry, I was unable to generate a response. Please try again.'
          };
          return updated;
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.'
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([{ role: 'assistant', content: 'Hello! How can I help you today?' }]);
  };

  // Don't render if not available or still loading
  if (loading || !isAvailable) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="mb-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            width: '380px',
            maxWidth: 'calc(100vw - 3rem)',
            height: '520px',
            maxHeight: 'calc(100vh - 8rem)',
            backgroundColor: 'var(--color-background, #ffffff)',
            border: '1px solid var(--color-border, #e5e7eb)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              backgroundColor: 'var(--color-primary, #047857)',
              color: 'var(--color-text-light, #f9fafb)',
            }}
          >
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-family, Inter, system-ui, sans-serif)' }}>
                Chat Assistant
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/20"
                title="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/20"
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ backgroundColor: 'var(--color-background-secondary, #f3f4f6)' }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: msg.role === 'user'
                      ? 'var(--color-accent, #f59e0b)'
                      : 'var(--color-primary, #047857)',
                    color: 'var(--color-text-light, #f9fafb)',
                  }}
                >
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'
                  }`}
                  style={{
                    backgroundColor: msg.role === 'user'
                      ? 'var(--color-primary, #047857)'
                      : 'var(--color-background, #ffffff)',
                    color: msg.role === 'user'
                      ? 'var(--color-text-light, #f9fafb)'
                      : 'var(--color-text-primary, #111827)',
                    border: msg.role === 'assistant'
                      ? '1px solid var(--color-border, #e5e7eb)'
                      : 'none',
                    fontFamily: 'var(--font-family, Inter, system-ui, sans-serif)',
                  }}
                >
                  {msg.content || (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" />
                      <span style={{ color: 'var(--color-text-secondary, #6b7280)' }}>Thinking...</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="px-3 py-3 shrink-0"
            style={{
              backgroundColor: 'var(--color-background, #ffffff)',
              borderTop: '1px solid var(--color-border, #e5e7eb)',
            }}
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                backgroundColor: 'var(--color-background-secondary, #f3f4f6)',
                border: '1px solid var(--color-border, #e5e7eb)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isStreaming}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
                style={{
                  color: 'var(--color-text-primary, #111827)',
                  fontFamily: 'var(--font-family, Inter, system-ui, sans-serif)',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="shrink-0 p-1.5 rounded-lg transition-all disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-primary, #047857)',
                  color: 'var(--color-text-light, #f9fafb)',
                }}
                title="Send message"
              >
                {isStreaming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-auto flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: 'var(--color-primary, #047857)',
          color: 'var(--color-text-light, #f9fafb)',
        }}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
