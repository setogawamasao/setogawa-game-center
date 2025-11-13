import { useRef, useState } from "react";
import Menu from "./Menu";
import BallCatch from "./BallCatch";
import HandLandmarkGame from "./HandLandmarkGame";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartRef = useRef<() => void>(() => {});
  const [game, setGame] = useState<"menu" | "ball" | "hand">("menu");

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
      {game === "menu" ? (
        <Menu
          onStart={() => setGame("ball")}
          onHandLandmark={() => setGame("hand")}
        />
      ) : game === "ball" ? (
        <BallCatch
          canvasRef={canvasRef}
          videoRef={videoRef}
          onRestart={() => setGame("menu")}
          restartRef={restartRef}
        />
      ) : (
        <HandLandmarkGame onReturn={() => setGame("menu")} />
      )}
    </div>
  );
}
