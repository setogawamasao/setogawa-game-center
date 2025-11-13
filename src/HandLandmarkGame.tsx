import { useEffect, useRef } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

export default function HandLandmarkGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let landmarker: HandLandmarker | undefined;
    let stream: MediaStream | undefined;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const canvas = canvasRef.current!;
      const video = videoRef.current!;

      // レイアウト調整
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const windowAspectRatio = window.innerWidth / window.innerHeight;
      let displayWidth: number, displayHeight: number;
      if (videoAspectRatio > windowAspectRatio) {
        displayWidth = window.innerWidth;
        displayHeight = window.innerWidth / videoAspectRatio;
      } else {
        displayHeight = window.innerHeight;
        displayWidth = window.innerHeight * videoAspectRatio;
      }
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      const ctx2d = canvas.getContext("2d")!;
      const drawer = new DrawingUtils(ctx2d);

      const detect = () => {
        if (!videoRef.current || !landmarker) return;
        const ts = performance.now();
        const res = landmarker.detectForVideo(videoRef.current, ts);

        ctx2d.clearRect(0, 0, canvas.width, canvas.height);

        // 左右反転してビデオを描画
        ctx2d.save();
        ctx2d.scale(-1, 1);
        ctx2d.drawImage(
          videoRef.current,
          -canvas.width,
          0,
          canvas.width,
          canvas.height
        );
        ctx2d.restore();

        // ランドマーク描画
        if (res.landmarks && res.landmarks.length > 0) {
          for (const hand of res.landmarks) {
            // 左右反転に合わせてx座標も反転
            const flipped = hand.map((lm) => ({
              ...lm,
              x: 1 - lm.x,
            }));
            drawer.drawLandmarks(flipped, { color: "deepskyblue", lineWidth: 3 });
            drawer.drawConnectors(flipped, HandLandmarker.HAND_CONNECTIONS, {
              color: "orange",
              lineWidth: 2,
            });
          }
        }

        requestAnimationFrame(detect);
      };
      detect();
    };

    init();

    return () => {
      landmarker?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100vw",
          height: "100vh",
          background: "#222",
        }}
      />
    </>
  );
}
