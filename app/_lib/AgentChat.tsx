"use client";

/* ==========================================================================
   AgentChat — the shared conversational surface for Zafe's in-app agents
   (the support assistant and the dispute mediator).

   Presentational and controlled: the page owns the transcript and the fetch,
   and passes messages + an onSend handler. An optional `pinned` node renders
   below the transcript (used for the mediator's final recommendation card).
   Light "trust fintech" styling, scoped under .agentchat so it never leaks.
   ========================================================================== */

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface ChatBubble {
  role: "user" | "assistant";
  content: string;
}

export default function AgentChat({
  title,
  subtitle,
  back = "/dashboard",
  messages,
  loading,
  onSend,
  placeholder = "Type your message",
  disabled = false,
  pinned,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  messages: ChatBubble[];
  loading: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  pinned?: ReactNode;
}) {
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pinned]);

  function send() {
    const t = text.trim();
    if (!t || loading || disabled) return;
    setText("");
    onSend(t);
  }

  return (
    <div className="agentchat">
      <style>{css}</style>

      <header className="ac-head">
        <a href={back} className="ac-back" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </a>
        <div className="ac-head-t">
          <div className="ac-title">{title}</div>
          {subtitle && <div className="ac-sub">{subtitle}</div>}
        </div>
      </header>

      <div className="ac-scroll" ref={scroller}>
        <div className="ac-list">
          {messages.map((m, i) => (
            <div key={i} className={`ac-row ${m.role}`}>
              <div className="ac-bubble">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="ac-row assistant">
              <div className="ac-bubble ac-typing" aria-label="Assistant is typing"><span /><span /><span /></div>
            </div>
          )}
          {pinned && <div className="ac-pinned">{pinned}</div>}
        </div>
      </div>

      <div className="ac-inputbar">
        <textarea
          className="ac-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={disabled ? "This conversation is complete." : placeholder}
          rows={1}
          maxLength={2000}
          disabled={disabled}
          aria-label="Message"
        />
        <button className="ac-send" onClick={send} disabled={loading || disabled || !text.trim()} aria-label="Send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
        </button>
      </div>
    </div>
  );
}

const css = `
.agentchat{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --bg:#F8FAFC; --card:#FFFFFF; --line:#E6EAF0;
  --safe:#059669; --safe-2:#047857; --safe-tint:#ECFDF5; --ease:cubic-bezier(.22,1,.36,1);
  position:fixed; inset:0; display:flex; flex-direction:column; background:var(--bg);
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; color:var(--ink) }
.agentchat *{ box-sizing:border-box }

.ac-head{ display:flex; align-items:center; gap:12px; padding:14px 18px; background:var(--card); border-bottom:1px solid var(--line); flex-shrink:0 }
.ac-back{ display:inline-flex; width:38px; height:38px; align-items:center; justify-content:center; border-radius:10px; color:var(--ink); border:1px solid var(--line); background:var(--card); text-decoration:none; transition:background .15s var(--ease) }
.ac-back:hover{ background:var(--bg) }
.ac-title{ font-size:16px; font-weight:800; letter-spacing:-.01em }
.ac-sub{ font-size:12.5px; color:var(--muted); margin-top:1px }

.ac-scroll{ flex:1; overflow-y:auto; padding:20px 18px }
.ac-list{ max-width:720px; margin:0 auto; display:flex; flex-direction:column; gap:12px }
.ac-row{ display:flex }
.ac-row.user{ justify-content:flex-end }
.ac-row.assistant{ justify-content:flex-start }
.ac-bubble{ max-width:82%; padding:11px 14px; border-radius:16px; font-size:14.5px; line-height:1.5; white-space:pre-wrap; word-wrap:break-word;
  box-shadow:0 1px 2px rgba(15,23,42,.05) }
.ac-row.assistant .ac-bubble{ background:var(--card); border:1px solid var(--line); border-top-left-radius:5px; color:var(--ink-2) }
.ac-row.user .ac-bubble{ background:var(--ink); color:#F8FAFC; border-top-right-radius:5px }

.ac-typing{ display:inline-flex; gap:4px; align-items:center }
.ac-typing span{ width:6px; height:6px; border-radius:50%; background:var(--muted); animation:acb 1.2s infinite ease-in-out both }
.ac-typing span:nth-child(2){ animation-delay:.15s } .ac-typing span:nth-child(3){ animation-delay:.3s }
@keyframes acb{ 0%,80%,100%{ opacity:.3; transform:translateY(0) } 40%{ opacity:1; transform:translateY(-3px) } }
@media (prefers-reduced-motion:reduce){ .ac-typing span{ animation:none } }

.ac-pinned{ max-width:720px; margin:4px auto 0; width:100% }

.ac-inputbar{ flex-shrink:0; display:flex; gap:10px; align-items:flex-end; padding:12px 18px; background:var(--card); border-top:1px solid var(--line);
  max-width:756px; margin:0 auto; width:100% }
.ac-input{ flex:1; resize:none; max-height:140px; min-height:46px; border-radius:12px; border:1px solid var(--line); background:var(--bg);
  padding:12px 14px; font-family:inherit; font-size:15px; color:var(--ink); outline:none; transition:border-color .15s var(--ease), box-shadow .15s var(--ease) }
.ac-input:focus{ border-color:var(--safe); box-shadow:0 0 0 3px rgba(5,150,105,.14) }
.ac-input:disabled{ opacity:.6 }
.ac-send{ flex-shrink:0; width:46px; height:46px; border:none; border-radius:12px; background:var(--safe); color:#fff; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center; transition:background .18s var(--ease), transform .12s var(--ease) }
.ac-send:hover:not(:disabled){ background:var(--safe-2) } .ac-send:active:not(:disabled){ transform:scale(.94) }
.ac-send:disabled{ opacity:.4; cursor:not-allowed }
`;
