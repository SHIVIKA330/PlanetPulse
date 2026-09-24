"use client";

import React, { useState, useEffect, useRef } from "react";
import { generateEcoResponse, AIActionPayload } from "@/lib/ecoIntelligence";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  action?: AIActionPayload;
  timestamp: string;
}

interface StatsSummary {
  weekly_co2_kg: number;
  weekly_target_kg: number;
  exceeded: boolean;
  total_co2_kg: number;
}

export function AIBotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      content: `Hello! I'm **EcoBot AI**, your smart carbon & sustainability assistant for **PlanetPulse** 🌿.\n\nI can analyze your real-time carbon emissions, recommend reduction hacks, compare travel modes, or log activities directly for you!\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Fetch current stats whenever chatbot is opened or actions occur
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || null);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  // Listen for global custom events to update stats if activity is logged elsewhere
  useEffect(() => {
    const handleUpdate = () => fetchStats();
    window.addEventListener("planetpulse:updated", handleUpdate);
    return () => window.removeEventListener("planetpulse:updated", handleUpdate);
  }, []);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (overrideText?: string) => {
    const query = (overrideText || inputValue).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      sender: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!overrideText) setInputValue("");
    setLoading(true);

    try {
      // Try posting to API route /api/ai-assistant
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      let aiResult;
      if (response.ok) {
        aiResult = await response.json();
      } else {
        // Fallback to local client logic
        aiResult = generateEcoResponse(query, null);
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        content: aiResult.markdown,
        action: aiResult.action,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackResult = generateEcoResponse(query, null);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        content: fallbackResult.markdown,
        action: fallbackResult.action,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (msgId: string, action: AIActionPayload) => {
    setExecutingActionId(msgId);
    try {
      if (action.type === "ADD_ACTIVITY" && action.activityType && action.quantity) {
        const res = await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: action.activityType, quantity: action.quantity }),
        });

        if (res.ok) {
          const data = await res.json();
          window.dispatchEvent(new Event("planetpulse:updated"));
          await fetchStats();

          // Append confirmation message from AI
          setMessages((prev) => [
            ...prev,
            {
              id: `confirm-${Date.now()}`,
              sender: "ai",
              content: `🎉 **Successfully Logged!**\n\n- **Activity**: ${data.activity.type.toUpperCase()}\n- **Quantity**: ${data.activity.quantity} ${data.activity.unit}\n- **CO₂ Impact**: **\`${data.activity.co2_kg} kg CO₂\`**\n\nYour dashboard and history have been updated live!`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      } else if (action.type === "SET_TARGET" && action.target_kg) {
        const res = await fetch("/api/target", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_kg: action.target_kg }),
        });

        if (res.ok) {
          window.dispatchEvent(new Event("planetpulse:updated"));
          await fetchStats();

          setMessages((prev) => [
            ...prev,
            {
              id: `confirm-${Date.now()}`,
              sender: "ai",
              content: `🎯 **Weekly Target Updated!**\n\nYour new weekly carbon target is now **\`${action.target_kg} kg CO₂\`**. Dashboard indicators have been adjusted.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      }
    } catch {
      // Error handling fallback
    } finally {
      setExecutingActionId(null);
    }
  };

  const quickPrompts = [
    { label: "📊 Footprint Audit", query: "Analyze my carbon footprint stats" },
    { label: "💡 Food Tips", query: "How to reduce food emissions?" },
    { label: "🚗 Car vs Bus", query: "Compare car vs bus travel for 30 km" },
    { label: "✏️ Log 20km Car", query: "Log 20 km car ride" },
    { label: "⚡ Lower Electricity", query: "How to lower electricity CO2?" },
    { label: "🎯 Target Advice", query: "Suggest a realistic weekly target" },
  ];

  // Helper to simple format markdown text
  const formatMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-extrabold text-sm text-[var(--forest-dark)] mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h5 key={idx} className="font-bold text-xs uppercase tracking-wider text-[var(--forest)] mt-2 mb-1">
            {line.replace("#### ", "")}
          </h5>
        );
      }
      // Bullet lists
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2);
        return (
          <li key={idx} className="ml-3 text-xs leading-relaxed list-disc">
            {renderInlineMarkdown(content)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        const content = line.trim().replace(/^\d+\.\s/, "");
        return (
          <li key={idx} className="ml-3 text-xs leading-relaxed list-decimal">
            {renderInlineMarkdown(content)}
          </li>
        );
      }
      if (line.trim() === "") return <div key={idx} className="h-1.5" />;
      return (
        <p key={idx} className="text-xs leading-relaxed mb-1">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Basic bold and code replacements
    const parts = text.split(/(\*\*.*?\*\*|\`.*?\`|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-[var(--forest-dark)]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-[var(--insight-bg)] text-[var(--insight-text)] font-mono text-[11px] font-semibold border border-[var(--insight-border)]">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-4 py-3 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group text-white"
        style={{ background: "var(--gradient-primary)" }}
        aria-label="Open AI Assistant"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
        </span>
        <span className="text-lg">🤖</span>
        <span className="font-bold text-sm tracking-tight pr-1">EcoBot AI</span>
      </button>

      {/* Chat Window Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] shadow-2xl transition-all duration-300 overflow-hidden ${
            isExpanded
              ? "w-[92vw] sm:w-[620px] h-[680px] max-h-[85vh]"
              : "w-[92vw] sm:w-[410px] h-[540px] max-h-[80vh]"
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-cream)]/70 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--lime)] text-white text-base shadow-sm">
                🤖
              </div>
              <div>
                <h3 className="font-black text-sm text-[var(--forest-dark)] flex items-center gap-1.5 leading-none">
                  EcoBot AI
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 border border-green-500/20">
                    Online
                  </span>
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  PlanetPulse Eco Intelligence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--forest-dark)] transition-colors text-xs"
                title={isExpanded ? "Collapse view" : "Expand view"}
              >
                {isExpanded ? "🗗" : "🗖"}
              </button>

              <button
                onClick={() => setMessages([messages[0]])}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--forest-dark)] transition-colors text-xs"
                title="Clear conversation"
              >
                🧹
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Live Context Banner */}
          {stats && (
            <div className="px-4 py-1.5 bg-[var(--insight-bg)] border-b border-[var(--insight-border)] flex items-center justify-between text-[11px] text-[var(--insight-text)] font-semibold">
              <span className="flex items-center gap-1">
                📊 <strong>Week:</strong> {stats.weekly_co2_kg} / {stats.weekly_target_kg} kg CO₂
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${stats.exceeded ? "bg-red-500/20 text-red-700 dark:text-red-300 font-bold" : "bg-green-500/20 text-green-800 dark:text-green-300"}`}>
                {stats.exceeded ? "🚨 Target Exceeded" : "🟢 Within Budget"}
              </span>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[var(--bg-page)]/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                } animate-fade-in-up`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.sender === "user"
                      ? "text-white font-medium rounded-br-xs"
                      : "bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border-soft)] rounded-bl-xs"
                  }`}
                  style={
                    msg.sender === "user"
                      ? { background: "var(--gradient-primary)" }
                      : {}
                  }
                >
                  <div className="text-xs">{formatMarkdown(msg.content)}</div>

                  {/* Executable Action Card */}
                  {msg.action && (
                    <div className="mt-3 p-3 rounded-xl bg-[var(--bg-cream)]/70 border border-[var(--border-soft)] flex flex-col gap-2">
                      <div className="text-[11px] font-bold text-[var(--forest-dark)] flex items-center gap-1.5">
                        ⚡ Recommended Action
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {msg.action.label || "Execute action"}
                      </p>
                      <button
                        onClick={() => handleExecuteAction(msg.id, msg.action!)}
                        disabled={executingActionId === msg.id}
                        className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {executingActionId === msg.id ? "Processing..." : "Execute & Log Now ⚡"}
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border-soft)] w-fit px-3 py-2 rounded-2xl rounded-bl-xs">
                <span className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
                EcoBot thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 border-t border-[var(--border-soft)] bg-[var(--surface)] overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--bg-cream)] text-[var(--forest-dark)] hover:bg-[var(--insight-bg)] hover:text-[var(--lime-hover)] transition-all border border-[var(--border-soft)] shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-[var(--border-soft)] bg-[var(--surface)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask EcoBot or log activity (e.g. 'log 20 km car')..."
                className="flex-1 bg-[var(--bg-cream)] border border-[var(--border-soft)] rounded-2xl px-3.5 py-2.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition-colors"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{ background: "var(--gradient-primary)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
