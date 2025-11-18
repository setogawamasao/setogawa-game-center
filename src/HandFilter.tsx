import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

interface HandFilterProps {
  onReturn?: () => void;
}

export default function HandFilter({ onReturn }: HandFilterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // ローディング完了
      setIsLoading(false);

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

        // サーモグラフィ風の画像処理
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

        const hasRegion = regionPoints.length > 0;

        // サーモグラフィ色マップ関数
        const getThermographyColor = (
          gray: number
        ): [number, number, number] => {
          // 0-255のグレースケール値を色に変換
          // 暗い（0）: 紫 -> 青 -> 緑 -> 黄 -> 赤（明るい）
          const normalized = gray / 255;

          let r = 0,
            g = 0,
            b = 0;

          if (normalized < 0.2) {
            // 紫から青
            const t = normalized / 0.2;
            r = Math.round(128 + 127 * (1 - t));
            g = 0;
            b = 255;
          } else if (normalized < 0.4) {
            // 青から緑
            const t = (normalized - 0.2) / 0.2;
            r = 0;
            g = Math.round(255 * t);
            b = Math.round(255 * (1 - t));
          } else if (normalized < 0.6) {
            // 緑から黄
            const t = (normalized - 0.4) / 0.2;
            r = Math.round(255 * t);
            g = 255;
            b = 0;
          } else if (normalized < 0.8) {
            // 黄からオレンジ
            const t = (normalized - 0.6) / 0.2;
            r = 255;
            g = Math.round(255 * (1 - t * 0.5));
            b = 0;
          } else {
            // オレンジから赤
            const t = (normalized - 0.8) / 0.2;
            r = 255;
            g = Math.round(100 * (1 - t));
            b = 0;
          }

          return [r, g, b];
        };

        // サーモグラフィ処理
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // グレースケール値を計算
          const gray = r * 0.299 + g * 0.587 + b * 0.114;

          if (hasRegion && areaPixels.has(i)) {
            // 領域内：カラーを維持（元のまま）
            continue;
          } else {
            // 領域外：サーモグラフィ色に変換
            const [thermoR, thermoG, thermoB] = getThermographyColor(gray);
            data[i] = thermoR;
            data[i + 1] = thermoG;
            data[i + 2] = thermoB;
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
              color: "white",
              lineWidth: 3,
            });
            drawer.drawConnectors(flipped, HandLandmarker.HAND_CONNECTIONS, {
              color: "black",
              lineWidth: 2,
            });

            // 白丸を黒枠で縁取る
            for (const landmark of flipped) {
              const lmX = landmark.x * displayWidth;
              const lmY = landmark.y * displayHeight;
              const radius = 5;

              // 黒い外枠
              ctx2d.strokeStyle = "black";
              ctx2d.lineWidth = 2;
              ctx2d.beginPath();
              ctx2d.arc(lmX, lmY, radius, 0, Math.PI * 2);
              ctx2d.stroke();
            }

            // 親指と人差し指の方向を表す直線を描画
            const thumbTip = flipped[4]; // 親指の先端
            const indexTip = flipped[8]; // 人差し指の先端

            if (thumbTip && indexTip) {
              const x1 = thumbTip.x * displayWidth;
              const y1 = thumbTip.y * displayHeight;
              const x2 = indexTip.x * displayWidth;
              const y2 = indexTip.y * displayHeight;

              // 直線を描画
              ctx2d.strokeStyle = "#000000";
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
              ctx2d.fillStyle = "#000000";
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
            ctx2d.strokeStyle = "#000000";
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
        position: "relative",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* パックマン風の戻るボタン */}
      {onReturn && (
        <button
          onClick={onReturn}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "60px",
            height: "60px",
            backgroundColor: "#FFFF00",
            border: "3px solid #000000",
            borderRadius: "0px",
            cursor: "pointer",
            fontSize: "24px",
            fontWeight: "900",
            color: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.1s",
            boxShadow: "0 4px 0px #000000",
            transform: "skewX(-5deg)",
            zIndex: 100,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "skewX(-5deg) translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 0px #000000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "skewX(-5deg)";
            e.currentTarget.style.boxShadow = "0 4px 0px #000000";
          }}
        >
          ←
        </button>
      )}

      {/* ローディング画面 */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#00FF00",
              fontFamily: "'Courier New', monospace",
              textShadow: "0 0 10px #00FF00",
              marginBottom: "30px",
            }}
          >
            LOADING...
          </div>
          <div
            style={{
              width: "200px",
              height: "4px",
              backgroundColor: "#333",
              borderRadius: "2px",
              overflow: "hidden",
              border: "2px solid #00FF00",
            }}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: "#00FF00",
                width: "100%",
                animation: "loading 1.5s ease-in-out infinite",
              }}
            />
          </div>
          <style>{`
            @keyframes loading {
              0%, 100% {
                width: 0%;
                marginLeft: 0;
              }
              50% {
                width: 100%;
                marginLeft: 0;
              }
              100% {
                width: 0%;
                marginLeft: 100%;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
