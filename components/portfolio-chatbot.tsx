"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, MessageCircle, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi — I’m the SURAJ.WEB assistant. Ask me about Suraj’s services, portfolio projects, live previews, tech stack, or how to start a project.",
};

const suggestions = [
  "What websites can Suraj build?",
  "Show me the live projects",
  "How do I start a project?",
];

export default function PortfolioChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, sending]);

  const sendMessage = async (value?: string) => {
    const message = (value ?? input).trim();
    if (!message || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((item) => item !== WELCOME)
            .slice(-8),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.message) {
        throw new Error(data?.error || "Chat is unavailable right now.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: String(data.message) },
      ]);
    } catch {
      setError(
        "The assistant is unavailable right now. You can still use Start a Project or WhatsApp."
      );
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  return (
    <>
      <button
        type="button"
        className="portfolio-chat-launcher"
        aria-label={open ? "Close portfolio assistant" : "Open portfolio assistant"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span>{open ? "Close" : "Ask Suraj AI"}</span>
      </button>

      {open && (
        <section className="portfolio-chat-panel" aria-label="SURAJ.WEB assistant">
          <header className="portfolio-chat-header">
            <div className="portfolio-chat-mark"><Sparkles size={17} /></div>
            <div>
              <strong>SURAJ.WEB Assistant</strong>
              <span>Portfolio & project questions</span>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>

          <div className="portfolio-chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`portfolio-chat-message ${message.role === "user" ? "is-user" : "is-assistant"}`}
              >
                {message.content}
              </div>
            ))}

            {sending && (
              <div className="portfolio-chat-message is-assistant is-thinking">
                <span />
                <span />
                <span />
              </div>
            )}

            {error && <p className="portfolio-chat-error">{error}</p>}
            <div ref={endRef} />
          </div>

          {messages.length <= 1 && (
            <div className="portfolio-chat-suggestions">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => void sendMessage(suggestion)}
                >
                  {suggestion}
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          )}

          <form className="portfolio-chat-form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={600}
              placeholder="Ask about services, projects..."
              aria-label="Message"
              disabled={sending}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={sending || !input.trim()}
            >
              <Send size={17} />
            </button>
          </form>

          <p className="portfolio-chat-footnote">
            AI answers can be imperfect. Project scope is confirmed directly with Suraj.
          </p>
        </section>
      )}
    </>
  );
}
