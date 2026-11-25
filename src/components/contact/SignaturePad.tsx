"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import NextImage from "next/image";

interface SignaturePadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, disabled = false }: SignaturePadProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const pointerRef = useRef<number | null>(null);
  const pathRef = useRef("");
  const hasInkRef = useRef(Boolean(value));
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [hasInk, setHasInk] = useState(Boolean(value));
  const [inkPath, setInkPath] = useState("");

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(240, Math.round(rect.width * dpr));
    const h = Math.max(120, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = "#1e1e1e";
        if (value) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = value;
        }
      }
    }
  }, [value]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal();
      const raf = requestAnimationFrame(() => setupCanvas());
      return () => cancelAnimationFrame(raf);
    }
    if (dlg.open) dlg.close();
  }, [open, setupCanvas]);

  const getLocalPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    return { x, y, svg: `${Math.round(1000 * x / rect.width)} ${Math.round(400 * y / rect.height)}` };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || pointerRef.current !== null || e.button !== 0) return;
    setupCanvas();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pt = getLocalPoint(e);
    drawingRef.current = true;
    pointerRef.current = e.pointerId;
    lastPtRef.current = pt;
    hasInkRef.current = true;
    setHasInk(true);

    canvas.setPointerCapture(e.pointerId);
    pathRef.current += `M${pt.svg} l.1 0`;

    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = e.pointerType === "pen" && e.pressure > 0 ? 1.5 + e.pressure * 1.6 : 2.2;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1e1e";
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled || pointerRef.current !== e.pointerId) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const prev = lastPtRef.current;
    if (!canvas || !ctx || !prev) return;

    const pt = getLocalPoint(e);
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = e.pointerType === "pen" && e.pressure > 0 ? 1.5 + e.pressure * 1.6 : 2.2;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    pathRef.current += ` L${pt.svg}`;
    lastPtRef.current = pt;
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    drawingRef.current = false;
    lastPtRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    hasInkRef.current = false;
    pathRef.current = "";
    setInkPath("");
    setHasInk(false);
    onChange("");
  };

  const commitAndClose = () => {
    const canvas = canvasRef.current;
    if (canvas && hasInkRef.current) {
      try {
        onChange(canvas.toDataURL("image/png"));
        setInkPath(pathRef.current);
      } catch {}
    } else {
      onChange("");
    }
    setOpen(false);
  };

  return (
    <div className="sigline">
      <div className="sigline__head">
        <span className="text-mono-sm sigline__status" aria-live="polite">
          {value ? "SIG::CAPTURED" : "SIG::OPTIONAL"}
        </span>
      </div>

      <div className="sigline__row">
        {value ? (
          <div className="sigline__preview">
            {inkPath ? (
              <svg className="sigline__img" viewBox="0 0 1000 400" role="img" aria-label="Your captured signature">
                <path d={inkPath} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <NextImage unoptimized src={value} width={320} height={128} alt="Your captured signature" className="sigline__img" />
            )}
          </div>
        ) : (
          <button
            type="button"
            className="sigline__trigger text-mono-meta"
            onClick={() => setOpen(true)}
            disabled={disabled}
            aria-haspopup="dialog"
            data-sig-open
          >
            <span>SIGN HERE</span>
            <span className="sigline__rule" aria-hidden="true" />
          </button>
        )}

        {value ? (
          <div className="sigline__btns">
            <button
              type="button"
              className="sigline__btn text-mono-sm"
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              Edit
            </button>
            <button
              type="button"
              className="sigline__btn text-mono-sm"
              onClick={clearCanvas}
              disabled={disabled}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        className="sigmodal"
        aria-labelledby="sigmodal-title"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="sigmodal__panel">
          <div className="sigmodal__head">
            <div>
              <span className="text-mono-sm sigmodal__tag">SIG::COUNTER-01</span>
              <h2 id="sigmodal-title" className="text-h5 sigmodal__title">
                Sign your note
              </h2>
            </div>
            <button
              type="button"
              className="sigmodal__close"
              onClick={() => setOpen(false)}
              aria-label="Close signature dialog"
            >
              <X size={16} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>

          <p className="sigmodal__sub text-mono-sm">WITH YOUR FINGER, MOUSE OR PEN</p>

          <div className="sigmodal__stage">
            <canvas
              ref={canvasRef}
              className="sigmodal__canvas"
              aria-label="Signature drawing pad"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onLostPointerCapture={endStroke}
            />
            {!hasInk ? (
              <span className="sigmodal__hint text-mono-sm" aria-hidden="true">
                DRAW SIGNATURE ABOVE LINE
              </span>
            ) : null}
            <span className="sigmodal__baseline" aria-hidden="true" />
          </div>

          <div className="sigmodal__actions">
            <button
              type="button"
              className="sigline__btn text-mono-sm"
              onClick={clearCanvas}
              disabled={!hasInk}
            >
              Clear
            </button>
            <button
              type="button"
              className="sigmodal__done text-mono-meta"
              onClick={commitAndClose}
            >
              Done
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
