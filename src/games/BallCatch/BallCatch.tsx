import { useEffect, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
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
  vanishPhase: number;
}

interface BallCatchProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onRestart: () => void;
  restartRef: React.MutableRefObject<() => void>;
}

export default function BallCatch({
  canvasRef,
  videoRef,
  onRestart,
  restartRef,
}: BallCatchProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const handleCanvasClick = (
    e: React.MouseEvent<HTMLCanvasElement> | MouseEvent
  ) => {
    if (!canvasRef.current || isLoading) return;
    const buttonData = canvasRef.current.dataset.restartButton;
    if (!buttonData) return;

    try {
      const button = JSON.parse(buttonData);
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // キャンバスの実際のサイズとレンダリングサイズの比率を計算
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const clientX = (e as any).clientX || (e as any).pageX;
      const clientY = (e as any).clientY || (e as any).pageY;

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      console.log("Click coordinates:", { x, y, scaleX, scaleY });
      console.log("Button rect:", button);

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
  };

  useEffect(() => {
    let landmarker: HandLandmarker | undefined;
    let stream: MediaStream | undefined;
    let lastResult: any = null;

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

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // ローディング完了
      setIsLoading(false);

      const canvas = canvasRef.current!;
      const video = videoRef.current!;

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

      // 内部解像度を少し下げて描画負荷を軽減
      const resolutionScale = 0.7;
      displayWidth *= resolutionScale;
      displayHeight *= resolutionScale;

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      const ctx2d = canvas.getContext("2d")!;

      // キャンバスをビューポート全体に表示
      const canvasElement = canvasRef.current!;
      canvasElement.style.width = "100%";
      canvasElement.style.height = "100%";
      canvasElement.style.maxWidth = "100vw";
      canvasElement.style.maxHeight = "100vh";
      canvasElement.style.objectFit = "contain";

      const balls: Ball[] = [];
      let frameCount = 0;
      let totalScore = 0;
      let startTime = Date.now();
      const gameDuration = 10000;
      let gameEnded = false;

      const restart = () => {
        frameCount = 0;
        totalScore = 0;
        startTime = Date.now();
        gameEnded = false;
        balls.length = 0;
        setGameEnded(false);
        setFinalScore(0);
      };

      restartRef.current = restart;

      const spawnBall = () => {
        const points = Math.floor(Math.random() * 10) * 10 + 10;
        const ballRadius = (35 - (points / 10) * 3) * 2;
        const x = Math.random() * (displayWidth - ballRadius * 2) + ballRadius;

        let color: string;
        if (points === 100) {
          color = "#FF0000";
        } else if (points === 90) {
          color = "#FF7700";
        } else if (points === 80) {
          color = "#FFFF00";
        } else if (points === 70) {
          color = "#00FF00";
        } else if (points === 60) {
          color = "#00FFFF";
        } else if (points === 50) {
          color = "#0000FF";
        } else if (points === 40) {
          color = "#7700FF";
        } else if (points === 30) {
          color = "#FF00FF";
        } else {
          color = "#00FF00";
        }

        balls.push({
          x,
          y: -ballRadius,
          radius: ballRadius,
          vy: 3,
          alive: true,
          points,
          color,
          vanishPhase: 0,
        });
      };

      const distanceTo = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      };

      const checkCollision = (ball: Ball, landmarks: any) => {
        if (!landmarks || landmarks.length === 0) return false;

        for (const landmark of landmarks) {
          const landmarkX = (1 - landmark.x) * displayWidth;
          const landmarkY = landmark.y * displayHeight;
          const dist = distanceTo(ball.x, ball.y, landmarkX, landmarkY);

          if (dist < ball.radius + 8) {
            return true;
          }
        }
        return false;
      };

      const drawer = new DrawingUtils(ctx2d);

      const detect = () => {
        if (!videoRef.current || !landmarker) return;

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, (gameDuration - elapsedTime) / 1000);
        if (!gameEnded && elapsedTime >= gameDuration) {
          gameEnded = true;
          setGameEnded(true);
          setFinalScore(totalScore);
        }

        // 手のランドマーク検出は毎フレームではなく間引いて実行
        let res = lastResult;
        if (frameCount % 2 === 0) {
          const ts = performance.now();
          res = landmarker.detectForVideo(videoRef.current, ts);
          lastResult = res;
        }
        if (!res) {
          requestAnimationFrame(detect);
          return;
        }

        ctx2d.clearRect(0, 0, canvas.width, canvas.height);

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

        frameCount++;
        if (frameCount % 30 === 0 && !gameEnded) {
          spawnBall();
        }

        for (let i = balls.length - 1; i >= 0; i--) {
          const ball = balls[i];

          if (ball.vanishPhase > 0) {
            ball.vanishPhase++;

            if (ball.vanishPhase <= 30) {
              const progress = ball.vanishPhase / 30;
              const currentRadius = ball.radius * (1 - progress);
              const opacity = 1 - progress;

              ctx2d.globalAlpha = opacity;
              ctx2d.fillStyle = ball.color;
              ctx2d.beginPath();
              ctx2d.arc(ball.x, ball.y, currentRadius, 0, Math.PI * 2);
              ctx2d.fill();

              ctx2d.globalAlpha = opacity * 0.5;
              const particles = 6;
              for (let p = 0; p < particles; p++) {
                const angle = (p / particles) * Math.PI * 2;
                const distance = 40 * progress;
                const px = ball.x + Math.cos(angle) * distance;
                const py = ball.y + Math.sin(angle) * distance - 15 * progress;

                ctx2d.fillStyle = ball.color;
                ctx2d.beginPath();
                ctx2d.arc(
                  px,
                  py,
                  ball.radius * 0.25 * (1 - progress),
                  0,
                  Math.PI * 2
                );
                ctx2d.fill();
              }

              ctx2d.globalAlpha = 1;
            } else {
              ball.alive = false;
            }
            continue;
          }

          if (!ball.alive) {
            balls.splice(i, 1);
            continue;
          }

          ball.y += ball.vy;

          if (res.landmarks.length > 0) {
            for (const hand of res.landmarks) {
              if (checkCollision(ball, hand)) {
                totalScore += ball.points;
                ball.vanishPhase = 1;
                break;
              }
            }
          }

          if (ball.y > displayHeight + ball.radius) {
            ball.alive = false;
            continue;
          }

          ctx2d.fillStyle = ball.color;
          ctx2d.beginPath();
          ctx2d.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx2d.fill();

          ctx2d.fillStyle = "#000000";
          ctx2d.font = "bold 14px Arial";
          ctx2d.textAlign = "center";
          ctx2d.textBaseline = "middle";
          ctx2d.fillText(String(ball.points), ball.x, ball.y);
        }

        if (res.landmarks.length) {
          for (let handIdx = 0; handIdx < res.landmarks.length; handIdx++) {
            const hand = res.landmarks[handIdx];

            const flippedLm = hand.map((landmark: any) => ({
              ...landmark,
              x: 1 - landmark.x,
            }));

            drawer.drawLandmarks(flippedLm, {
              color: handIdx === 0 ? "#00FF00" : "#FF00FF",
              lineWidth: 2,
            });

            if (res.handedness && res.handedness[handIdx]) {
              drawer.drawConnectors(flippedLm, HandLandmarker.HAND_CONNECTIONS);
            }
          }
        }

        ctx2d.fillStyle = "#FFFFFF";
        ctx2d.font = `bold ${Math.max(
          20,
          Math.min(48, displayWidth / 15)
        )}px Arial`;
        ctx2d.textAlign = "right";
        ctx2d.textBaseline = "top";
        ctx2d.fillText(`Score: ${totalScore}`, displayWidth - 20, 20);

        ctx2d.font = `bold ${Math.max(
          16,
          Math.min(40, displayWidth / 18)
        )}px Arial`;
        ctx2d.fillText(`${remainingTime.toFixed(1)}s`, displayWidth - 20, 80);

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
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        style={{ display: "block", cursor: "pointer" }}
        onClick={(e) => {
          handleCanvasClick(e);
        }}
      />{" "}
      {/* パックマン風の戻るボタン */}
      <button
        onClick={() => {
          onRestart();
          restartRef.current();
        }}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          width: "clamp(50px, 10vw, 60px)",
          height: "clamp(50px, 10vw, 60px)",
          backgroundColor: "#FFFF00",
          border: "3px solid #000000",
          borderRadius: "0px",
          cursor: "pointer",
          fontSize: "clamp(18px, 5vw, 24px)",
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
      {/* ゲーム終了オーバーレイ */}
      {gameEnded && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              fontSize: "clamp(32px, 10vw, 60px)",
              color: "#FFFFFF",
              fontWeight: "bold",
              marginBottom: "20px",
              textShadow: "0 0 10px #00FF00",
            }}
          >
            GAME OVER
          </div>
          <div
            style={{
              fontSize: "clamp(24px, 8vw, 48px)",
              color: "#00FFFF",
              fontWeight: "bold",
              marginBottom: "40px",
              textShadow: "0 0 10px #00FFFF",
            }}
          >
            Score: {finalScore}
          </div>
          <button
            onClick={() => {
              restartRef.current();
            }}
            style={{
              padding: "clamp(12px, 3vw, 20px) clamp(24px, 6vw, 40px)",
              fontSize: "clamp(18px, 5vw, 28px)",
              fontWeight: "bold",
              backgroundColor: "#00FF00",
              color: "#000000",
              border: "3px solid #FFFFFF",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 0 20px #00FF00",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow =
                "0 0 30px #00FF00, 0 0 10px #00FFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 20px #00FF00";
            }}
          >
            RESTART
          </button>
        </div>
      )}
    </div>
  );
}
