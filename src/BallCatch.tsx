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
  useEffect(() => {
    let landmarker: PoseLandmarker | undefined;
    let stream: MediaStream | undefined;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

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

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      const ctx2d = canvas.getContext("2d")!;

      const balls: Ball[] = [];
      let frameCount = 0;
      let totalScore = 0;
      let startTime = Date.now();
      const gameDuration = 10000;
      let gameEnded = false;
      let finalScore = 0;
      let buttonRect = { x: 0, y: 0, width: 0, height: 0 };

      const restart = () => {
        frameCount = 0;
        totalScore = 0;
        startTime = Date.now();
        gameEnded = false;
        finalScore = 0;
        balls.length = 0;
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
          finalScore = totalScore;
        }

        const ts = performance.now();
        const res = landmarker.detectForVideo(videoRef.current, ts);

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
            if (checkCollision(ball, res.landmarks[0])) {
              totalScore += ball.points;
              ball.vanishPhase = 1;
              continue;
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
          const lm = res.landmarks[0];

          const flippedLm = lm.map((landmark: any) => ({
            ...landmark,
            x: 1 - landmark.x,
          }));

          const noseLandmark = flippedLm[4];
          if (noseLandmark) {
            const noseX = noseLandmark.x * displayWidth;
            const noseY = noseLandmark.y * displayHeight;

            const faceRadius = 120;

            ctx2d.fillStyle = "#000000";
            ctx2d.beginPath();
            ctx2d.arc(noseX, noseY, faceRadius, 0, Math.PI * 2);
            ctx2d.fill();

            ctx2d.fillStyle = "#FFFFFF";

            const eyeRadius = 15;
            const eyeDistance = 50;
            ctx2d.beginPath();
            ctx2d.arc(
              noseX - eyeDistance,
              noseY - 20,
              eyeRadius,
              0,
              Math.PI * 2
            );
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.arc(
              noseX + eyeDistance,
              noseY - 20,
              eyeRadius,
              0,
              Math.PI * 2
            );
            ctx2d.fill();

            ctx2d.beginPath();
            ctx2d.ellipse(noseX, noseY + 40, 40, 15, 0, 0, Math.PI * 2);
            ctx2d.fill();
          }

          const bodyLandmarks = flippedLm.slice(11);
          if (bodyLandmarks.length > 0) {
            drawer.drawLandmarks(bodyLandmarks, {
              color: "red",
              lineWidth: 2,
            });
          }

          const bodyConnections = PoseLandmarker.POSE_CONNECTIONS.filter(
            (connection: any) => connection.start >= 11 && connection.end >= 11
          );
          if (bodyConnections.length > 0) {
            drawer.drawConnectors(flippedLm, bodyConnections);
          }
        }

        ctx2d.fillStyle = "#FFFFFF";
        ctx2d.font = "bold 48px Arial";
        ctx2d.textAlign = "right";
        ctx2d.textBaseline = "top";
        ctx2d.fillText(`Score: ${totalScore}`, displayWidth - 20, 20);

        ctx2d.font = "bold 40px Arial";
        ctx2d.fillText(`${remainingTime.toFixed(1)}s`, displayWidth - 20, 80);

        if (gameEnded) {
          ctx2d.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx2d.fillRect(0, 0, displayWidth, displayHeight);

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

          const buttonWidth = 300;
          const buttonHeight = 80;
          const buttonX = displayWidth / 2 - buttonWidth / 2;
          const buttonY = displayHeight / 2 + 150;

          ctx2d.fillStyle = "#00FF00";
          ctx2d.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

          ctx2d.strokeStyle = "#FFFFFF";
          ctx2d.lineWidth = 3;
          ctx2d.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

          ctx2d.fillStyle = "#000000";
          ctx2d.font = "bold 48px Arial";
          ctx2d.textAlign = "center";
          ctx2d.textBaseline = "middle";
          ctx2d.fillText(
            "RESTART",
            displayWidth / 2,
            buttonY + buttonHeight / 2
          );

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
        style={{ display: "block", cursor: "pointer" }}
        onClick={(e) => {
          if (!canvasRef.current) return;
          const buttonData = canvasRef.current.dataset.restartButton;
          if (!buttonData) return;

          try {
            const button = JSON.parse(buttonData);
            const rect = canvasRef.current.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            console.log("Click coordinates:", { x, y });
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
        }}
      />
    </>
  );
}
