import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
} from "@mediapipe/tasks-vision";
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
  const [gameOver, setGameOver] = useState(false);
  const engineRef = useRef<Matter.Engine | null>(null);
  const ballsRef = useRef<Matter.Body[]>([]);

  useEffect(() => {
    let landmarker: HandLandmarker | undefined;
    let stream: MediaStream | undefined;
    let animationFrameId: number;
    let faceLandmarker: FaceLandmarker | undefined;

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

        // FaceLandmarkerを初期化
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
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

        // 10個のボール作成
        const balls: Matter.Body[] = [];
        for (let i = 0; i < 10; i++) {
          const ball = Bodies.circle(
            canvasWidth / 2 + (Math.random() - 0.5) * 100,
            canvasHeight / 2 + (Math.random() - 0.5) * 100,
            10,
            {
              restitution: 1, // 完全弾性衝突
              friction: 0,
              frictionAir: 0, // 空気抵抗なし
            }
          );

          // ランダムな方向に射出
          const angle = Math.random() * Math.PI * 2;
          const speed = 5;
          Body.setVelocity(ball, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          });

          World.add(engine.world, ball);
          balls.push(ball);
        }
        ballsRef.current = balls;

        const ctx2d = canvas.getContext("2d")!;

        // カメラフレームのオフセットを計算
        const cameraOffsetX = (canvasWidth - cameraWidth) / 2;
        const cameraOffsetY = (canvasHeight - cameraHeight) / 2;

        const detect = () => {
          if (!videoRef.current || !landmarker || !faceLandmarker) return;
          const ts = performance.now();
          const res = landmarker.detectForVideo(videoRef.current, ts);
          const faceRes = faceLandmarker.detectForVideo(videoRef.current, ts);

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

          // 顔のランドマークから鼻を描画（ランドマーク1番が鼻）
          let nosePos: { x: number; y: number } | null = null;
          if (faceRes.faceLandmarks && faceRes.faceLandmarks.length > 0) {
            const faceLandmarks = faceRes.faceLandmarks[0];
            if (faceLandmarks.length > 1) {
              const noseLm = faceLandmarks[1]; // インデックス1が鼻
              const noseX = cameraOffsetX + (1 - noseLm.x) * cameraWidth;
              const noseY = cameraOffsetY + noseLm.y * cameraHeight;
              nosePos = { x: noseX, y: noseY };

              // 鼻にマーカーを描画
              ctx2d.fillStyle = "#FFFF00";
              ctx2d.beginPath();
              ctx2d.arc(noseX, noseY, 24, 0, Math.PI * 2);
              ctx2d.fill();
              ctx2d.strokeStyle = "#00FF00";
              ctx2d.lineWidth = 2;
              ctx2d.stroke();
            }
          }

          // ランドマークを描画（左右反転対応、カメラフレーム内）
          const landmarkPositions: { x: number; y: number }[] = [];
          if (res.landmarks) {
            res.landmarks.forEach((landmarks) => {
              landmarks.forEach((lm, index) => {
                // 正規化座標をキャンバス座標に変換
                const x = cameraOffsetX + (1 - lm.x) * cameraWidth;
                const y = cameraOffsetY + lm.y * cameraHeight;
                landmarkPositions.push({ x, y });

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

          // ボールとランドマークの当たり判定
          ballsRef.current.forEach((ball) => {
            if (landmarkPositions.length > 0) {
              const ballPos = ball.position;
              const ballRadius = 10;
              const landmarkRadius = 8;

              landmarkPositions.forEach((lmPos) => {
                const dx = ballPos.x - lmPos.x;
                const dy = ballPos.y - lmPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = ballRadius + landmarkRadius;

                if (distance < minDistance) {
                  // 衝突時：ボールを反射
                  const angle = Math.atan2(dy, dx);
                  const speed = Math.sqrt(
                    ball.velocity.x ** 2 + ball.velocity.y ** 2
                  );

                  Body.setVelocity(ball, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                  });

                  // ボールをランドマークから離す
                  const pushDistance = minDistance - distance + 2;
                  Body.setPosition(ball, {
                    x: ballPos.x + Math.cos(angle) * pushDistance,
                    y: ballPos.y + Math.sin(angle) * pushDistance,
                  });
                }
              });
            }

            // 鼻との当たり判定
            if (nosePos) {
              const ballPos = ball.position;
              const ballRadius = 10;
              const noseRadius = 24;

              const dx = ballPos.x - nosePos.x;
              const dy = ballPos.y - nosePos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const minDistance = ballRadius + noseRadius;

              if (distance < minDistance) {
                // 鼻に当たった：ゲームオーバー
                setGameOver(true);
              }
            }
          });

          // Physics エンジン更新
          Engine.update(engine);

          // ボール速度を維持（等速運動）
          const targetSpeed = 5; // 全ボール共通の速度
          ballsRef.current.forEach((ball) => {
            const currentSpeed = Math.sqrt(
              ball.velocity.x ** 2 + ball.velocity.y ** 2
            );

            if (currentSpeed > 0) {
              Body.setVelocity(ball, {
                x: (ball.velocity.x / currentSpeed) * targetSpeed,
                y: (ball.velocity.y / currentSpeed) * targetSpeed,
              });
            }
          });

          // ボール描画
          ballsRef.current.forEach((ball) => {
            const pos = ball.position;
            ctx2d.fillStyle = "#FF0080";
            ctx2d.beginPath();
            ctx2d.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.strokeStyle = "#00FFFF";
            ctx2d.lineWidth = 2;
            ctx2d.stroke();
          });

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

      {/* ゲームオーバー画面 */}
      {gameOver && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#FF0080",
              fontFamily: "'Courier New', monospace",
              textShadow: "0 0 20px #FF0080",
              marginBottom: "40px",
            }}
          >
            GAME OVER
          </div>
          <button
            onClick={() => {
              setGameOver(false);
            }}
            style={{
              padding: "15px 40px",
              fontSize: "20px",
              fontWeight: "bold",
              backgroundColor: "#00FF00",
              color: "#000",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontFamily: "'Courier New', monospace",
              textTransform: "uppercase",
              boxShadow: "0 0 10px #00FF00",
              marginBottom: "20px",
            }}
          >
            RETRY
          </button>
          <button
            onClick={onReturn}
            style={{
              padding: "15px 40px",
              fontSize: "20px",
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
      )}

      {/* BACKボタン */}
      <button
        onClick={onReturn}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "10px 20px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: "#00FFFF",
          color: "#000",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontFamily: "'Courier New', monospace",
          textTransform: "uppercase",
          boxShadow: "0 0 10px #00FFFF",
          zIndex: 10,
        }}
      >
        BACK
      </button>
    </div>
  );
}
