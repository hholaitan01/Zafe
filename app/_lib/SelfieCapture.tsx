"use client";

/* ==========================================================================
   Selfie capture for seller KYC. Opens the front camera, captures a small
   square JPEG, and hands it back as a base64 data URL via onChange. The image
   is downscaled (~480px, q0.75) so it stays well under the API body limit and
   uploads fast. The selfie is used to verify (Dojah BVN + face match) and is
   never stored on the seller record.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";

export function SelfieCapture({ value, onChange }: { value?: string; onChange: (b64?: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState("");

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  };
  useEffect(() => stop, []); // stop the camera if the component unmounts

  // Attach the stream once the <video> is actually in the DOM. The element only
  // renders when `active` is true, so we can't set srcObject inside start() —
  // videoRef would still be null. Running here (post-render) also lets us mute +
  // play in a way iOS Safari accepts (muted + playsinline autoplay).
  useEffect(() => {
    if (!active) return;
    const v = videoRef.current;
    const stream = streamRef.current;
    if (!v || !stream) return;
    v.srcObject = stream;
    v.muted = true;
    v.setAttribute("playsinline", "true");
    v.play().catch(() => {});
  }, [active]);

  async function start() {
    setErr("");
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true); // renders the <video>; the effect above attaches the stream
    } catch {
      setErr("Camera access is needed to verify. Allow it in your browser, or continue without a selfie.");
    } finally {
      setStarting(false);
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const size = 480;
    const side = Math.min(v.videoWidth, v.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Centre-crop to a square, then downscale.
    const sx = (v.videoWidth - side) / 2;
    const sy = (v.videoHeight - side) / 2;
    ctx.drawImage(v, sx, sy, side, side, 0, 0, size, size);
    onChange(canvas.toDataURL("image/jpeg", 0.75));
    stop();
  }

  function retake() {
    onChange(undefined);
    void start();
  }

  return (
    <div className="sf-wrap">
      {value ? (
        <>
          <div className="sf-shot" style={{ backgroundImage: `url("${value}")` }} role="img" aria-label="Your selfie" />
          <button type="button" className="sf-btn sf-btn-ghost" onClick={retake}>Retake selfie</button>
        </>
      ) : active ? (
        <>
          <div className="sf-video-wrap"><video ref={videoRef} autoPlay playsInline muted className="sf-video" /></div>
          <div className="sf-actions">
            <button type="button" className="sf-btn" onClick={capture}>Capture</button>
            <button type="button" className="sf-btn sf-btn-ghost" onClick={stop}>Cancel</button>
          </div>
        </>
      ) : (
        <button type="button" className="sf-btn sf-btn-ghost sf-start" onClick={() => void start()} disabled={starting}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
          {starting ? "Opening camera…" : "Take a selfie to verify"}
        </button>
      )}
      {err && <div className="sf-err">{err}</div>}
      <style>{css}</style>
    </div>
  );
}

const css = `
.sf-wrap{ display:flex; flex-direction:column; gap:10px; align-items:flex-start }
.sf-video-wrap{ width:180px; height:180px; border-radius:16px; overflow:hidden; background:#0F172A; border:1px solid var(--line) }
.sf-video{ width:100%; height:100%; object-fit:cover; transform:scaleX(-1) }
.sf-shot{ width:120px; height:120px; border-radius:16px; background-size:cover; background-position:center; border:1px solid var(--line); transform:scaleX(-1) }
.sf-actions{ display:flex; gap:10px }
.sf-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 16px; border-radius:12px; font-family:inherit; font-weight:600; font-size:14px; cursor:pointer; border:1px solid transparent; background:var(--safe); color:#fff; transition:transform .12s var(--ease), background .18s var(--ease), border-color .18s var(--ease) }
.sf-btn:active{ transform:scale(.97) }
.sf-btn:disabled{ opacity:.55; cursor:default }
.sf-btn-ghost{ background:#fff; color:var(--ink); border-color:var(--line); box-shadow:var(--sh-1) }
.sf-start{ color:var(--safe); border-color:#A7F3D0; background:var(--safe-tint) }
.sf-err{ font-size:12.5px; color:var(--danger); line-height:1.45; max-width:280px }
`;
