import { useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Menu from "./Menu";
import BallCatch from "./BallCatch";
import HandFilter from "./HandFilter";
import NoseProtectionGame from "./NoseProtectionGame";

function AppContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartRef = useRef<() => void>(() => {});
  const navigate = useNavigate();

  const containerStyle = {
    margin: 0,
    padding: 0,
    overflow: "hidden" as const,
    width: "100vw",
    height: "100vh",
    display: "flex" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#000",
  };

  return (
    <div style={containerStyle}>
      <Routes>
        <Route
          path="/"
          element={
            <Menu
              onStart={() => navigate("/ball-catch")}
              onHandLandmark={() => navigate("/hand-filter")}
              onNew={() => navigate("/nose-protection")}
            />
          }
        />
        <Route
          path="/ball-catch"
          element={
            <BallCatch
              canvasRef={canvasRef}
              videoRef={videoRef}
              onRestart={() => navigate("/")}
              restartRef={restartRef}
            />
          }
        />
        <Route
          path="/hand-filter"
          element={<HandFilter onReturn={() => navigate("/")} />}
        />
        <Route
          path="/nose-protection"
          element={<NoseProtectionGame onReturn={() => navigate("/")} />}
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
