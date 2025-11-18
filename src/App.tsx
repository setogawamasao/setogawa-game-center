import { useRef, useState } from "react";
import Menu from "./Menu";
import BallCatch from "./BallCatch";
import HandFilter from "./HandFilter";
import NoseProtectionGame from "./NoseProtectionGame";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartRef = useRef<() => void>(() => {});
  const [game, setGame] = useState<"menu" | "ball" | "hand" | "new">("menu");

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
          onNew={() => setGame("new")}
        />
      ) : game === "ball" ? (
        <BallCatch
          canvasRef={canvasRef}
          videoRef={videoRef}
          onRestart={() => setGame("menu")}
          restartRef={restartRef}
        />
      ) : game === "hand" ? (
        <HandFilter onReturn={() => setGame("menu")} />
      ) : (
        <NoseProtectionGame onReturn={() => setGame("menu")} />
      )}
    </div>
  );
}
