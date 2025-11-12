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
  const restartRef = useRef<() => void>(() => {});

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
      let startTime = Date.now();
      const gameDuration = 30000; // 30秒
      let gameEnded = false;
      let finalScore = 0;
      let buttonRect = { x: 0, y: 0, width: 0, height: 0 };

      // リスタート関数
      const restart = () => {
        frameCount = 0;
        totalScore = 0;
        startTime = Date.now();
        gameEnded = false;
        finalScore = 0;
        balls.length = 0; // ボールをすべてクリア
      };

      restartRef.current = restart;

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
          // ランドマークを左右反転
          const landmarkX = (1 - landmark.x) * displayWidth;
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

        // 経過時間を計算
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, (gameDuration - elapsedTime) / 1000);

        // ゲーム終了判定
        if (!gameEnded && elapsedTime >= gameDuration) {
          gameEnded = true;
          finalScore = totalScore;
        }

        const ts = performance.now();
        const res = landmarker.detectForVideo(videoRef.current, ts);

        ctx2d.clearRect(0, 0, canvas.width, canvas.height);

        // ビデオを左右反転して描画
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

        // ボール生成（毎フレーム一定確率）
        frameCount++;
        if (frameCount % 30 === 0 && !gameEnded) {
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

          // ランドマークを左右反転
          const flippedLm = lm.map((landmark: any) => ({
            ...landmark,
            x: 1 - landmark.x,
          }));

          // 左右反転して描画
          drawer.drawLandmarks(flippedLm, {
            color: "red",
            lineWidth: 2,
          });
          drawer.drawConnectors(flippedLm, PoseLandmarker.POSE_CONNECTIONS);
        }

        // スコア表示（右上）
        ctx2d.fillStyle = "#FFFFFF";
        ctx2d.font = "bold 48px Arial";
        ctx2d.textAlign = "right";
        ctx2d.textBaseline = "top";
        ctx2d.fillText(`Score: ${totalScore}`, displayWidth - 20, 20);

        // 時計表示（スコアの下）
        ctx2d.font = "bold 40px Arial";
        ctx2d.fillText(`${remainingTime.toFixed(1)}s`, displayWidth - 20, 80);

        // ゲーム終了画面
        if (gameEnded) {
          // 半透明の黒背景
          ctx2d.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx2d.fillRect(0, 0, displayWidth, displayHeight);

          // スコア表示（画面中央）
          ctx2d.fillStyle = "#FFFFFF";
          ctx2d.font = "bold 80px Arial";
          ctx2d.textAlign = "center";
          ctx2d.textBaseline = "middle";
          ctx2d.fillText(
            `GAME OVER`,
            displayWidth / 2,
            displayHeight / 2 - 100
          );
          ctx2d.font = "bold 60px Arial";
          ctx2d.fillText(
            `Final Score: ${finalScore}`,
            displayWidth / 2,
            displayHeight / 2 + 50
          );

          // リスタートボタン
          const buttonWidth = 300;
          const buttonHeight = 80;
          const buttonX = displayWidth / 2 - buttonWidth / 2;
          const buttonY = displayHeight / 2 + 150;

          // ボタン背景
          ctx2d.fillStyle = "#00FF00";
          ctx2d.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

          // ボタン枠
          ctx2d.strokeStyle = "#FFFFFF";
          ctx2d.lineWidth = 3;
          ctx2d.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

          // ボタンテキスト
          ctx2d.fillStyle = "#000000";
          ctx2d.font = "bold 48px Arial";
          ctx2d.textAlign = "center";
          ctx2d.textBaseline = "middle";
          ctx2d.fillText(
            "RESTART",
            displayWidth / 2,
            buttonY + buttonHeight / 2
          );

          // クリック判定用にボタン情報を保存
          buttonRect = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
          };
          canvasRef.current!.dataset.restartButton = JSON.stringify(buttonRect);
        }

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
      <canvas
        ref={canvasRef}
        style={{ display: "block", cursor: "pointer" }}
        onClick={(e) => {
          if (!canvasRef.current) return;
          const buttonData = canvasRef.current.dataset.restartButton;
          if (!buttonData) return;

          try {
            const button = JSON.parse(buttonData);
            const rect = canvasRef.current.getBoundingClientRect();

            // キャンバス内の相対座標を計算
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            console.log("Click coordinates:", { x, y });
            console.log("Button rect:", button);

            // ボタン範囲内をクリックしたか判定
            if (
              x >= button.x &&
              x <= button.x + button.width &&
              y >= button.y &&
              y <= button.y + button.height
            ) {
              console.log("Button clicked - restarting game");
              restartRef.current();
            }
          } catch (error) {
            console.error("Click handler error:", error);
          }
        }}
      />
    </div>
  );
}
