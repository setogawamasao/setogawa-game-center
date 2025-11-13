import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import * as Matter from "matter-js";

interface NewHandGameProps {
  onReturn?: () => void;
}

export default function NewHandGame({ onReturn }: NewHandGameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const engineRef = useRef<Matter.Engine | null>(null);
  const ballRef = useRef<Matter.Body | null>(null);

  useEffect(() => {
    let landmarker: HandLandmarker | undefined;
    let stream: MediaStream | undefined;
    let animationFrameId: number;

    const init = async () => {
      try {
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

        // キャンバスは画面サイズいっぱい
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // カメラフレームは60%サイズ
        const videoAspectRatio = video.videoWidth / video.videoHeight;
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        const scale = 0.6; // 60%のサイズ
        let cameraWidth: number, cameraHeight: number;
        if (videoAspectRatio > windowAspectRatio) {
          cameraWidth = window.innerWidth * scale;
          cameraHeight = (window.innerWidth * scale) / videoAspectRatio;
        } else {
          cameraHeight = window.innerHeight * scale;
          cameraWidth = window.innerHeight * scale * videoAspectRatio;
        }

        container.style.width = canvasWidth + "px";
        container.style.height = canvasHeight + "px";

        // Matter.js セットアップ
        const Engine = Matter.Engine;
        const World = Matter.World;
        const Bodies = Matter.Bodies;
        const Body = Matter.Body;

        const engine = Engine.create();
        engineRef.current = engine;
        engine.gravity.y = 0; // 重力なし

        // 画面フレーム（キャンバスサイズ）に壁を作成
        const walls = [
          Bodies.rectangle(canvasWidth / 2, -10, canvasWidth + 20, 20, {
            isStatic: true,
          }), // top
          Bodies.rectangle(
            canvasWidth / 2,
            canvasHeight + 10,
            canvasWidth + 20,
            20,
            { isStatic: true }
          ), // bottom
          Bodies.rectangle(-10, canvasHeight / 2, 20, canvasHeight + 20, {
            isStatic: true,
          }), // left
          Bodies.rectangle(
            canvasWidth + 10,
            canvasHeight / 2,
            20,
            canvasHeight + 20,
            { isStatic: true }
          ), // right
        ];

        World.add(engine.world, walls);

        // ボール作成
        const ball = Bodies.circle(canvasWidth / 2, canvasHeight / 2, 10, {
          restitution: 1, // 完全弾性衝突
          friction: 0,
          frictionAir: 0, // 空気抵抗なし
        });

        // ランダムな方向に射出
        const angle = Math.random() * Math.PI * 2;
        const speed = 5;
        Body.setVelocity(ball, {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        });

        World.add(engine.world, ball);
        ballRef.current = ball;

        const ctx2d = canvas.getContext("2d")!;

        // カメラフレームのオフセットを計算
        const cameraOffsetX = (canvasWidth - cameraWidth) / 2;
        const cameraOffsetY = (canvasHeight - cameraHeight) / 2;

        const detect = () => {
          if (!videoRef.current || !landmarker) return;
          const ts = performance.now();
          const res = landmarker.detectForVideo(videoRef.current, ts);

          ctx2d.clearRect(0, 0, canvas.width, canvas.height);

          // カメラフレームを中央に配置
          ctx2d.save();
          ctx2d.translate(cameraOffsetX, cameraOffsetY);
          ctx2d.scale(-1, 1);
          ctx2d.drawImage(
            videoRef.current,
            -cameraWidth,
            0,
            cameraWidth,
            cameraHeight
          );
          ctx2d.restore();

          // ランドマークを描画（左右反転対応、カメラフレーム内）
          if (res.landmarks) {
            res.landmarks.forEach((landmarks) => {
              landmarks.forEach((lm, index) => {
                // 正規化座標をキャンバス座標に変換
                const x = cameraOffsetX + (1 - lm.x) * cameraWidth;
                const y = cameraOffsetY + lm.y * cameraHeight;

                // ランドマークを点として描画
                ctx2d.fillStyle = "#FF0080";
                ctx2d.beginPath();
                ctx2d.arc(x, y, 3, 0, Math.PI * 2);
                ctx2d.fill();

                // 接続線を描画
                const connections = HandLandmarker.HAND_CONNECTIONS;
                connections.forEach((connection: any) => {
                  if (
                    connection.start === index &&
                    connection.end < landmarks.length
                  ) {
                    const nextLm = landmarks[connection.end];
                    const nextX = cameraOffsetX + (1 - nextLm.x) * cameraWidth;
                    const nextY = cameraOffsetY + nextLm.y * cameraHeight;

                    ctx2d.strokeStyle = "#00FF00";
                    ctx2d.lineWidth = 1;
                    ctx2d.beginPath();
                    ctx2d.moveTo(x, y);
                    ctx2d.lineTo(nextX, nextY);
                    ctx2d.stroke();
                  }
                });
              });
            });
          }

          // Physics エンジン更新
          Engine.update(engine);

          // ボール描画
          if (ballRef.current) {
            const pos = ballRef.current.position;
            ctx2d.fillStyle = "#FF0080";
            ctx2d.beginPath();
            ctx2d.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.strokeStyle = "#00FFFF";
            ctx2d.lineWidth = 2;
            ctx2d.stroke();
          }

          animationFrameId = requestAnimationFrame(detect);
        };

        animationFrameId = requestAnimationFrame(detect);
      } catch (error) {
        console.error("初期化エラー:", error);
      }
    };

    init();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [gameActive]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      {/* ビデオとキャンバス */}
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "none",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* UI要素 */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
          color: "#00FF00",
          fontFamily: "'Courier New', monospace",
          textShadow: "0 0 10px #00FF00",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: "bold" }}>
          SCORE: {score}
        </div>
        <div style={{ fontSize: "14px", marginTop: "10px" }}>
          STATUS: {gameActive ? "PLAYING" : "READY"}
        </div>
      </div>

      {/* ボタンエリア */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          display: "flex",
          gap: "20px",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setGameActive(!gameActive)}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            fontWeight: "bold",
            backgroundColor: gameActive ? "#FF0080" : "#00FF00",
            color: "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            boxShadow: `0 0 10px ${gameActive ? "#FF0080" : "#00FF00"}`,
          }}
        >
          {gameActive ? "STOP" : "START"}
        </button>
        <button
          onClick={onReturn}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            fontWeight: "bold",
            backgroundColor: "#00FFFF",
            color: "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            boxShadow: "0 0 10px #00FFFF",
          }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}
