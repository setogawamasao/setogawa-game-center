import { useRef, useState } from "react";
import Menu from "./Menu";
import BallCatch from "./BallCatch";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartRef = useRef<() => void>(() => {});
  const [gameStarted, setGameStarted] = useState(false);

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
      {!gameStarted ? (
        <Menu onStart={() => setGameStarted(true)} />
      ) : (
        <BallCatch
          canvasRef={canvasRef}
          videoRef={videoRef}
          onRestart={() => {}}
          restartRef={restartRef}
        />
      )}
    </div>
  );
}
