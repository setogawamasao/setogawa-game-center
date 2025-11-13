import { useEffect, useRef } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

export default function HandLandmarkGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      const container = containerRef.current!;

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
      container.style.width = displayWidth + "px";
      container.style.height = displayHeight + "px";
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

        // 画像を白黒にして、ピクセル化する
        const imageData = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 領域内のピクセルを保存するための配列
        const areaPixels = new Set<number>();

        // 両手がある場合の領域を計算
        let regionPoints: { x: number; y: number }[] = [];
        if (res.landmarks && res.landmarks.length === 2) {
          const hand1 = res.landmarks[0].map((lm) => ({
            ...lm,
            x: 1 - lm.x,
          }));
          const hand2 = res.landmarks[1].map((lm) => ({
            ...lm,
            x: 1 - lm.x,
          }));

          const thumb1 = hand1[4];
          const index1 = hand1[8];
          const thumb2 = hand2[4];
          const index2 = hand2[8];

          if (thumb1 && index1 && thumb2 && index2) {
            regionPoints = [
              { x: thumb1.x * displayWidth, y: thumb1.y * displayHeight },
              { x: index1.x * displayWidth, y: index1.y * displayHeight },
              { x: index2.x * displayWidth, y: index2.y * displayHeight },
              { x: thumb2.x * displayWidth, y: thumb2.y * displayHeight },
            ];

            // 領域内のピクセルインデックスを計算
            for (let i = 0; i < data.length; i += 4) {
              const pixelIndex = i / 4;
              const pixelX = pixelIndex % canvas.width;
              const pixelY = Math.floor(pixelIndex / canvas.width);

              if (isPointInPolygon(pixelX, pixelY, regionPoints)) {
                areaPixels.add(i);
              }
            }
          }
        }

        // ピクセル化処理
        const pixelSize = 8;
        const hasRegion = regionPoints.length > 0;

        for (let py = 0; py < canvas.height; py += pixelSize) {
          for (let px = 0; px < canvas.width; px += pixelSize) {
            let r = 0,
              g = 0,
              b = 0,
              count = 0;
            let isInArea = false;

            // ピクセルブロック内の平均色を計算
            for (let dy = 0; dy < pixelSize && py + dy < canvas.height; dy++) {
              for (let dx = 0; dx < pixelSize && px + dx < canvas.width; dx++) {
                const pixelIndex = ((py + dy) * canvas.width + (px + dx)) * 4;
                r += data[pixelIndex];
                g += data[pixelIndex + 1];
                b += data[pixelIndex + 2];
                if (areaPixels.has(pixelIndex)) {
                  isInArea = true;
                }
                count++;
              }
            }

            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);

            // 領域外のみグレースケール化
            let finalR = r,
              finalG = g,
              finalB = b;
            if (!isInArea) {
              const gray = r * 0.299 + g * 0.587 + b * 0.114;
              finalR = gray;
              finalG = gray;
              finalB = gray;
            }

            // 領域がある場合、領域内はピクセル化しない
            if (hasRegion && isInArea) {
              // 領域内はピクセルブロック単位ではなく、元の画像データをコピー
              for (
                let dy = 0;
                dy < pixelSize && py + dy < canvas.height;
                dy++
              ) {
                for (
                  let dx = 0;
                  dx < pixelSize && px + dx < canvas.width;
                  dx++
                ) {
                  const pixelIndex = ((py + dy) * canvas.width + (px + dx)) * 4;
                  // 元のデータをそのままにする（変更しない）
                }
              }
            } else {
              // ピクセルブロックを塗りつぶし
              for (
                let dy = 0;
                dy < pixelSize && py + dy < canvas.height;
                dy++
              ) {
                for (
                  let dx = 0;
                  dx < pixelSize && px + dx < canvas.width;
                  dx++
                ) {
                  const pixelIndex = ((py + dy) * canvas.width + (px + dx)) * 4;
                  data[pixelIndex] = finalR;
                  data[pixelIndex + 1] = finalG;
                  data[pixelIndex + 2] = finalB;
                }
              }
            }
          }
        }
        ctx2d.putImageData(imageData, 0, 0);

        // ランドマーク描画
        if (res.landmarks && res.landmarks.length > 0) {
          for (const hand of res.landmarks) {
            // 左右反転に合わせてx座標も反転
            const flipped = hand.map((lm) => ({
              ...lm,
              x: 1 - lm.x,
            }));
            drawer.drawLandmarks(flipped, {
              color: "deepskyblue",
              lineWidth: 3,
            });
            drawer.drawConnectors(flipped, HandLandmarker.HAND_CONNECTIONS, {
              color: "orange",
              lineWidth: 2,
            });

            // 親指と人差し指の方向を表す直線を描画
            const thumbTip = flipped[4]; // 親指の先端
            const indexTip = flipped[8]; // 人差し指の先端

            if (thumbTip && indexTip) {
              const x1 = thumbTip.x * displayWidth;
              const y1 = thumbTip.y * displayHeight;
              const x2 = indexTip.x * displayWidth;
              const y2 = indexTip.y * displayHeight;

              // 直線を描画
              ctx2d.strokeStyle = "#FF00FF";
              ctx2d.lineWidth = 4;
              ctx2d.setLineDash([10, 5]);
              ctx2d.beginPath();
              ctx2d.moveTo(x1, y1);
              ctx2d.lineTo(x2, y2);
              ctx2d.stroke();
              ctx2d.setLineDash([]);

              // 方向を示す矢印を描画（人差し指側）
              const angle = Math.atan2(y2 - y1, x2 - x1);
              const arrowSize = 15;
              ctx2d.fillStyle = "#FF00FF";
              ctx2d.beginPath();
              ctx2d.moveTo(x2, y2);
              ctx2d.lineTo(
                x2 - arrowSize * Math.cos(angle - Math.PI / 6),
                y2 - arrowSize * Math.sin(angle - Math.PI / 6)
              );
              ctx2d.lineTo(
                x2 - arrowSize * Math.cos(angle + Math.PI / 6),
                y2 - arrowSize * Math.sin(angle + Math.PI / 6)
              );
              ctx2d.closePath();
              ctx2d.fill();
            }
          }

          // 両手がある場合、領域の枠線のみ描画
          if (res.landmarks.length === 2 && regionPoints.length > 0) {
            // 領域の枠線を描画
            ctx2d.strokeStyle = "#FF00FF";
            ctx2d.lineWidth = 3;
            ctx2d.beginPath();
            ctx2d.moveTo(regionPoints[0].x, regionPoints[0].y);
            ctx2d.lineTo(regionPoints[1].x, regionPoints[1].y);
            ctx2d.lineTo(regionPoints[2].x, regionPoints[2].y);
            ctx2d.lineTo(regionPoints[3].x, regionPoints[3].y);
            ctx2d.closePath();
            ctx2d.stroke();
          }
        }

        requestAnimationFrame(detect);
      };

      // 点が多角形内にあるかを判定（レイキャスティング法）
      const isPointInPolygon = (
        x: number,
        y: number,
        polygon: { x: number; y: number }[]
      ) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x,
            yi = polygon[i].y;
          const xj = polygon[j].x,
            yj = polygon[j].y;

          const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
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
    <div
      ref={containerRef}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
        background: "#222",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
