import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  BookOpen,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  Heart,
  Zap,
  FileText,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  PlusCircle,
  MessageSquare,
  Trash2,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../lib/apiClient';

interface MessageItem {
  id: string | number;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  liked?: boolean;
  disliked?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: MessageItem[];
}

interface StudentChatResponse {
  reply: string;
  source: string;
}

// Rich text formatter for clean rendering of bolding, lists, and line breaks
const FormattedMessageText: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split('\n\n');

  return (
    <div className="space-y-2.5 leading-relaxed text-xs sm:text-sm">
      {paragraphs.map((para, idx) => {
        const lines = para.split('\n');
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lineIdx) => {
              const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
              const cleanLine = isBullet ? line.trim().substring(1).trim() : line;

              // Parse simple bold tags **text**
              const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
              const formattedLine = parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-slate-900">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              });

              return (
                <div key={lineIdx} className={isBullet ? 'flex items-start gap-2 pl-2' : ''}>
                  {isBullet && <span className="text-indigo-600 font-bold">•</span>}
                  <span className="whitespace-pre-wrap">{formattedLine}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const ChatbotView: React.FC = () => {
  const { profile } = useAuth();
  const { currentTheme, activeConfig } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const defaultGreeting: MessageItem = {
    id: 1,
    sender: 'bot',
    text: `Hello ${profile?.display_name || 'there'}! 👋 I am Clarity AI, your interactive pediatric learning companion powered by OpenAI GPT-OSS 120B on Groq.

How can I help you excel today? Feel free to ask me about:
• Homework & Problem Solving (STEM, Math, Physics, Biology)
• Study Habits & Focus Techniques (Pomodoro, ADHD executive tips)
• Exam Stress Relief & Calming Strategies
• Essay Outlines & General Knowledge`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Load initial sessions from localStorage if available
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('clarity_ai_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'session-1',
        title: 'Current Study Session',
        date: 'Today',
        messages: [defaultGreeting],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-1');

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clarity_ai_sessions', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [defaultGreeting];

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | number | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const updateActiveMessages = (updater: (prevMsgs: MessageItem[]) => MessageItem[]) => {
    setSessions((prevSessions) =>
      prevSessions.map((s) => (s.id === activeSessionId ? { ...s, messages: updater(s.messages) } : s))
    );
  };

  const speakText = (id: string | number, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (id: string | number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleToggleLike = (id: string | number, type: 'like' | 'dislike') => {
    updateActiveMessages((prevMsgs) =>
      prevMsgs.map((m) => {
        if (m.id === id) {
          if (type === 'like') {
            return { ...m, liked: !m.liked, disliked: false };
          } else {
            return { ...m, disliked: !m.disliked, liked: false };
          }
        }
        return m;
      })
    );
  };

  const sendMessage = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || isTyping) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: MessageItem = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: userTime,
    };

    const currentMsgs = activeSession?.messages || [];
    const updatedMessages = [...currentMsgs, userMsg];

    updateActiveMessages(() => updatedMessages);

    // Dynamically update session title if it's the first user message
    if (currentMsgs.filter((m) => m.sender === 'user').length === 0) {
      const shortTitle = textToSend.slice(0, 24) + (textToSend.length > 24 ? '...' : '');
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, title: shortTitle } : s))
      );
    }

    setInput('');
    setIsTyping(true);
    setChatError(null);
    setLastFailedMessage(null);

    try {
      // Build clean multi-turn history for Groq API (excluding system greeting UI card)
      const payloadMessages = updatedMessages
        .filter((m) => m.sender === 'user' || m.id !== 1)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const res = await apiClient<StudentChatResponse>('/students/chat', {
        method: 'POST',
        body: {
          messages: payloadMessages.length > 0 ? payloadMessages : [{ role: 'user', content: textToSend }],
          context: {
            current_mode: currentTheme,
          },
        },
      });

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const botMsg: MessageItem = {
        id: `bot-reply-${Date.now()}`,
        sender: 'bot',
        text: res.reply || "I'm here to help you break down any problem step-by-step!",
        time: botTime,
      };

      updateActiveMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatError('Connection error contacting Groq AI server. Click Retry to resend.');
      setLastFailedMessage(textToSend);

      const botMsg: MessageItem = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I experienced a brief connection glitch, but I'm back! Please try asking your question again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      updateActiveMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleCreateNewChat = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Study Topic',
      date: 'Just now',
      messages: [
        {
          ...defaultGreeting,
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setChatError(null);
    setLastFailedMessage(null);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleCreateNewChat();
      return;
    }
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleRegenerate = () => {
    const userMsgs = messages.filter((m) => m.sender === 'user');
    if (userMsgs.length > 0) {
      const lastUserMsg = userMsgs[userMsgs.length - 1];
      sendMessage(lastUserMsg.text);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-6rem)] font-sans text-slate-900 select-none flex flex-col md:flex-row gap-4 p-2 sm:p-4">
      {/* Sidebar - Sessions & History */}
      <div className="w-full md:w-72 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden shrink-0">
        <div className="p-4 space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 leading-tight">Clarity AI Workspace</h2>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> GPT-OSS 120B Engine
                </span>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleCreateNewChat}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Chat Session</span>
          </button>

          {/* Session History List */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-2">
              Recent Topics
            </h3>
            <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={`group w-full p-3 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    activeSessionId === s.id
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/60 shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        activeSessionId === s.id ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate text-xs">{s.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Mode Footer Badge */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-400">Current Theme</span>
              <span className="font-bold text-slate-800 capitalize">{activeConfig?.name || currentTheme}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main AI Chat Workspace Canvas */}
      <Card className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden p-0">
        {/* Main Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{activeSession.title}</span>
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live LLM
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Step-by-step tutoring, homework solver & study advice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewChat}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset Chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Message Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 sm:gap-4 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-xs ${
                  msg.sender === 'user' ? 'bg-indigo-600' : 'bg-slate-900'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5 text-indigo-400" />}
              </div>

              {/* Bubble Body */}
              <div
                className={`max-w-[90%] sm:max-w-[80%] space-y-2 ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-4 sm:p-5 rounded-3xl ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-xs'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <FormattedMessageText text={msg.text} />
                  )}
                </div>

                {/* AI Response Action Toolbar */}
                <div
                  className={`flex items-center gap-3 px-2 text-[11px] font-semibold text-slate-400 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-between'
                  }`}
                >
                  <span>{msg.time}</span>

                  {msg.sender === 'bot' && (
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
                      {/* Voice Read-Aloud */}
                      <button
                        type="button"
                        onClick={() => speakText(msg.id, msg.text)}
                        className={`p-1 hover:text-indigo-600 transition-colors cursor-pointer ${
                          speakingMsgId === msg.id ? 'text-indigo-600 animate-pulse' : ''
                        }`}
                        title="Read Aloud with Voice AI"
                      >
                        {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Copy to Clipboard */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Feedback Rating */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(msg.id, 'like')}
                        className={`p-1 hover:text-emerald-600 transition-colors cursor-pointer ${
                          msg.liked ? 'text-emerald-600 font-bold' : ''
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleLike(msg.id, 'dislike')}
                        className={`p-1 hover:text-rose-600 transition-colors cursor-pointer ${
                          msg.disliked ? 'text-rose-600 font-bold' : ''
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold animate-pulse">
                <Bot className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <div className="p-4 rounded-3xl rounded-tl-none bg-white border border-slate-200/80 flex items-center gap-3 shadow-xs">
                <span className="text-xs font-bold text-slate-600">Clarity AI is analyzing</span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Notification Bar */}
        {chatError && (
          <div className="mx-4 p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{chatError}</span>
            </div>
            {lastFailedMessage && (
              <button
                type="button"
                onClick={handleRegenerate}
                className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition-colors shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Quick Suggestion Cards Bar */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => sendMessage("Can you explain Newton's laws of motion with simple real-world examples?")}
            disabled={isTyping}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" /> Newton's Laws
          </button>
          <button
            type="button"
            onClick={() => sendMessage("Help me solve a quadratic equation step by step.")}
            disabled={isTyping}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-emerald-500" /> Quadratic Math
          </button>
          <button
            type="button"
            onClick={() => sendMessage("I feel anxious about my exams. Can you give me a 5-minute grounding technique?")}
            disabled={isTyping}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Heart className="w-4 h-4 text-rose-500" /> Exam Stress Relief
          </button>
          <button
            type="button"
            onClick={() => sendMessage("What are ADHD-friendly focus tips for studying when unmotivated?")}
            disabled={isTyping}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Zap className="w-4 h-4 text-yellow-500" /> Focus & ADHD Tips
          </button>
        </div>

        {/* Main Input Form */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                rows={1}
                placeholder="Ask Clarity AI anything (Shift + Enter for new line)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="w-full p-3.5 max-h-32 resize-none rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 disabled:opacity-60 leading-relaxed"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 py-3.5 flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 h-12"
            >
              {isTyping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline font-bold">Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
