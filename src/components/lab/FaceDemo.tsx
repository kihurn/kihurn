"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { euclidean, FACE_THRESHOLD, verdict, type Verdict } from "@/lib/face/verdict";

type Phase = "closed" | "idle" | "loading" | "running" | "error";

const VERDICT_TEXT: Record<Verdict, string> = {
  "no-face": "No face in view.",
  "multiple-faces": "More than one face. Only one person at a time.",
  enrol: "Ready. Press Enrol to save a reference for this session.",
  match: "Match. Same person.",
  "no-match": "No match. Different person.",
};

export function FaceDemo() {
  const [phase, setPhase] = useState<Phase>("closed");
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [v, setV] = useState<Verdict>("enrol");
  const [distance, setDistance] = useState<number | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reference = useRef<Float32Array | null>(null);
  const latest = useRef<Float32Array | null>(null);
  const faceCount = useRef(0);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);

  useEffect(() => stop, [stop]);

  function close() {
    stop();
    reference.current = null;
    latest.current = null;
    setEnrolled(false);
    setDistance(null);
    setV("enrol");
    setPhase("closed");
  }

  async function start() {
    setError(null);
    setFallback(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("No camera found.");
      setFallback(true);
      setPhase("error");
      return;
    }
    setPhase("loading");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false });
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setError(name === "NotAllowedError" ? "Camera permission was denied." : "No camera found.");
      setFallback(name !== "NotAllowedError");
      setPhase("error");
      return;
    }
    try {
      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      const el = video.current;
      if (!el || !stream.current) return;
      el.srcObject = stream.current;
      await el.play();
      setPhase("running");
      timer.current = setInterval(async () => {
        const found = await faceapi
          .detectAllFaces(el, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceDescriptors();
        faceCount.current = found.length;
        latest.current = found.length === 1 ? found[0].descriptor : null;
        const d = latest.current && reference.current ? euclidean(latest.current, reference.current) : null;
        setDistance(d);
        setV(verdict({ faces: found.length, distance: d, threshold: FACE_THRESHOLD }));
      }, 1000);
    } catch {
      stop();
      setError("Couldn't load the face models. Check your connection and try again.");
      setPhase("error");
    }
  }

  function enrol() {
    if (latest.current) {
      reference.current = latest.current;
      setEnrolled(true);
    }
  }

  if (phase === "closed") {
    return (
      <button type="button" className="btn text-tag" data-face-open onClick={() => setPhase("idle")}>
        Try it
      </button>
    );
  }

  return (
    <div className="face" data-face-panel>
      <p className="text-body">Runs entirely on your device. Nothing is uploaded or stored.</p>
      <p className="text-meta face__note">
        The models are pretrained (face-api.js). I built the verification engine around them.
      </p>

      {phase === "idle" ? (
        <button type="button" className="btn btn--solid text-tag" onClick={start}>
          Start camera
        </button>
      ) : null}
      {phase === "loading" ? (
        <p className="text-body" role="status">
          Loading the models…
        </p>
      ) : null}

      <video ref={video} className="face__video" muted playsInline hidden={phase !== "running" && phase !== "loading"} />

      {phase === "running" ? (
        <div className="face__live" role="status" aria-live="polite">
          <p className="text-mono-meta">
            DISTANCE:: {distance === null ? "—" : distance.toFixed(2)} · THRESHOLD:: {FACE_THRESHOLD.toFixed(2)}
          </p>
          <p className="text-body" data-face-verdict>
            {VERDICT_TEXT[v]}
          </p>
          <button type="button" className="btn text-tag" onClick={enrol} disabled={v === "no-face" || v === "multiple-faces"}>
            {enrolled ? "Re-enrol" : "Enrol"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="ticket__err" role="alert" data-face-error>
          {error}
        </p>
      ) : null}
      {fallback ? (
        <figure className="face__fallback">
          <video controls preload="none" data-face-fallback>
            <track kind="captions" />
          </video>
          <figcaption className="text-meta">TODO: fallback demo video</figcaption>
        </figure>
      ) : null}

      <button type="button" className="btn text-tag" data-face-close onClick={close}>
        Close
      </button>
    </div>
  );
}
