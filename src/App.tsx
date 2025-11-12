import { useEffect, useRef } from "react";
import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

interface Ball {
  x: number;
  y: number;
  radius: number;
  vy: number;
  alive: boolean;
  points: number;
  color: string;
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);

  useEffect(() => {
    let landmarker: PoseLandmarker | undefined;
    let stream: MediaStream | undefined;

    // 初期化
    const init = async () => {
      // Wasm バンドルの読み込み
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      // PoseLandmarker 初期化
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
          delegate: "GPU", // GPU 利用。CPU しかない環境でも自動フォールバック
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      // カメラ起動
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // 描画コンテキスト
      const canvas = canvasRef.current!;
      const video = videoRef.current!;

      // ビデオの比率を計算
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const windowAspectRatio = window.innerWidth / window.innerHeight;

      let displayWidth: number, displayHeight: number;

      if (videoAspectRatio > windowAspectRatio) {
        // ビデオが横長の場合
        displayWidth = window.innerWidth;
        displayHeight = window.innerWidth / videoAspectRatio;
      } else {
        // ビデオが縦長の場合
        displayHeight = window.innerHeight;
        displayWidth = window.innerHeight * videoAspectRatio;
      }

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      const ctx2d = canvas.getContext("2d")!;

      const balls: Ball[] = [];
      let frameCount = 0;
      let totalScore = 0;

      // ボール生成関数
      const spawnBall = () => {
        const points = Math.floor(Math.random() * 10) * 10 + 10; // 10-100の10刻み
        // スコアが高いほど小さく: 100点=10px, 10点=60px（2倍にした）
        const ballRadius = (35 - (points / 10) * 3) * 2;
        const x = Math.random() * (displayWidth - ballRadius * 2) + ballRadius;

        // スコアに応じた色
        let color: string;
        if (points === 100) {
          color = "#FF0000"; // 赤（100点）
        } else if (points === 90) {
          color = "#FF7700"; // オレンジ（90点）
        } else if (points === 80) {
          color = "#FFFF00"; // 黄色（80点）
        } else if (points === 70) {
          color = "#00FF00"; // 緑（70点）
        } else if (points === 60) {
          color = "#00FFFF"; // シアン（60点）
        } else if (points === 50) {
          color = "#0000FF"; // 青（50点）
        } else if (points === 40) {
          color = "#7700FF"; // 紫（40点）
        } else if (points === 30) {
          color = "#FF00FF"; // マゼンタ（30点）
        } else {
          color = "#00FF00"; // 緑（10, 20点）
        }

        balls.push({
          x,
          y: -ballRadius,
          radius: ballRadius,
          vy: 3,
          alive: true,
          points,
          color,
        });
      };

      // ボール同士の距離を計算
      const distanceTo = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      };

      // 衝突判定
      const checkCollision = (ball: Ball, landmarks: any) => {
        if (!landmarks || landmarks.length === 0) return false;

        for (const landmark of landmarks) {
          const landmarkX = landmark.x * displayWidth;
          const landmarkY = landmark.y * displayHeight;
          const dist = distanceTo(ball.x, ball.y, landmarkX, landmarkY);

          if (dist < ball.radius + 8) {
            // ランドマーク半径を8とする
            return true;
          }
        }
        return false;
      };

      // GPU 描画を完全に使い切る場合は WebGL2 コンテキストも取得する
      // const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
      // const drawer = new DrawingUtils(ctx2d, gl);
      const drawer = new DrawingUtils(ctx2d);

      // 推定ループ
      const detect = () => {
        if (!videoRef.current || !landmarker) return;

        const ts = performance.now();
        const res = landmarker.detectForVideo(videoRef.current, ts);

        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        ctx2d.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // ボール生成（毎フレーム一定確率）
        frameCount++;
        if (frameCount % 30 === 0) {
          spawnBall();
        }

        // ボール更新と描画
        for (let i = balls.length - 1; i >= 0; i--) {
          const ball = balls[i];

          if (!ball.alive) {
            balls.splice(i, 1);
            continue;
          }

          // ボール落下
          ball.y += ball.vy;

          // 衝突判定
          if (res.landmarks.length > 0) {
            if (checkCollision(ball, res.landmarks[0])) {
              totalScore += ball.points;
              ball.alive = false;
              continue;
            }
          }

          // 画面外判定
          if (ball.y > displayHeight + ball.radius) {
            ball.alive = false;
            continue;
          }

          // ボール描画
          ctx2d.fillStyle = ball.color;
          ctx2d.beginPath();
          ctx2d.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx2d.fill();

          // ボール上に点数表示
          ctx2d.fillStyle = "#000000";
          ctx2d.font = "bold 14px Arial";
          ctx2d.textAlign = "center";
          ctx2d.textBaseline = "middle";
          ctx2d.fillText(String(ball.points), ball.x, ball.y);
        }

        if (res.landmarks.length) {
          const lm = res.landmarks[0];
          drawer.drawLandmarks(lm, {
            color: "red",
            lineWidth: 2,
          });
          drawer.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS);
        }

        // スコア表示（右上）
        ctx2d.fillStyle = "#FFFFFF";
        ctx2d.font = "bold 48px Arial";
        ctx2d.textAlign = "right";
        ctx2d.textBaseline = "top";
        ctx2d.fillText(`Score: ${totalScore}`, displayWidth - 20, 20);

        requestAnimationFrame(detect);
      };
      detect();
    };

    init();

    // クリーンアップ
    return () => {
      landmarker?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
