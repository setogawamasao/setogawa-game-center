interface MenuProps {
  onStart: () => void;
  onHandLandmark: () => void;
}

export default function Menu({ onStart, onHandLandmark }: MenuProps) {
  const colors = [
    { bg: "#001100", color: "#00FF00", glow: "#00FF00" }, // グリーン
    { bg: "#000011", color: "#00FFFF", glow: "#00FFFF" }, // シアン
    { bg: "#110000", color: "#FF0080", glow: "#FF0080" }, // マゼンタ
    { bg: "#001111", color: "#00FF88", glow: "#00FF88" }, // ライムグリーン
  ];

  const GameCard = ({
    title,
    description,
    onClick,
    colorIndex,
  }: {
    title: string;
    description: string;
    onClick: () => void;
    colorIndex: number;
  }) => {
    const col = colors[colorIndex];
    return (
      <button
        onClick={onClick}
        style={{
          width: "120px",
          height: "120px",
          backgroundColor: col.color,
          border: `3px solid ${col.color}`,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          transition: "all 0.1s",
          padding: "8px",
          boxSizing: "border-box",
          position: "relative",
          boxShadow: `0px 0px 10px 2px ${col.glow}, inset 0 0 5px rgba(${
            col.color === "#00FF00"
              ? "0, 255, 0"
              : col.color === "#00FFFF"
              ? "0, 255, 255"
              : col.color === "#FF0080"
              ? "255, 0, 128"
              : "0, 255, 136"
          }, 0.5)`,
          fontFamily: "'Courier New', monospace",
          background: col.bg,
          color: col.color,
          textShadow: `0 0 10px ${col.glow}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0px 0px 20px 4px ${
            col.glow
          }, inset 0 0 10px rgba(${
            col.color === "#00FF00"
              ? "0, 255, 0"
              : col.color === "#00FFFF"
              ? "0, 255, 255"
              : col.color === "#FF0080"
              ? "255, 0, 128"
              : "0, 255, 136"
          }, 0.7)`;
          e.currentTarget.style.backgroundColor = col.color;
          e.currentTarget.style.color = col.bg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0px 0px 10px 2px ${
            col.glow
          }, inset 0 0 5px rgba(${
            col.color === "#00FF00"
              ? "0, 255, 0"
              : col.color === "#00FFFF"
              ? "0, 255, 255"
              : col.color === "#FF0080"
              ? "255, 0, 128"
              : "0, 255, 136"
          }, 0.5)`;
          e.currentTarget.style.backgroundColor = col.bg;
          e.currentTarget.style.color = col.color;
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "1px",
            lineHeight: "1.1",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            lineHeight: "1",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {description}
        </div>
      </button>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px",
        boxSizing: "border-box",
        background: "#000000",
        position: "relative",
        fontFamily: "'Courier New', monospace",
        overflow: "hidden",
      }}
    >
      {/* スキャンライン効果 */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0, 255, 0, 0.02) 0px, rgba(0, 255, 255, 0.02) 1px, transparent 2px, transparent 3px)",
          pointerEvents: "none",
          zIndex: 1,
          animation: "scanlines 8s linear infinite",
        }}
      />

      {/* インベーダーキャラクター装飾 - 上部左 */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "30px",
          fontSize: "24px",
          zIndex: 2,
          animation: "invaderMove 2s ease-in-out infinite",
          fontFamily: "'Courier New', monospace",
          color: "#00FF00",
          textShadow: "0 0 10px #00FF00",
        }}
      >
        ▓▓▓
        <div style={{ letterSpacing: "3px" }}>▓ ▓</div>
        ▓▓▓
      </div>

      {/* インベーダーキャラクター装飾 - 上部右 */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "30px",
          fontSize: "24px",
          zIndex: 2,
          animation: "invaderMove 2.5s ease-in-out infinite reverse",
          fontFamily: "'Courier New', monospace",
          color: "#FF0080",
          textShadow: "0 0 10px #FF0080",
        }}
      >
        ▓▓▓
        <div style={{ letterSpacing: "3px" }}>▓ ▓</div>
        ▓▓▓
      </div>

      {/* メインタイトル */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          marginBottom: "50px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            letterSpacing: "3px",
            marginBottom: "8px",
            fontFamily: "'Courier New', monospace",
            animation: "flicker 0.15s infinite",
            color: "#00FF00",
            textShadow: "0 0 10px #00FF00, 0 0 20px #00FFFF, 0 0 30px #FF0080",
          }}
        >
          瀬戸川ゲームセンター
        </div>
      </div>

      {/* ゲームグリッド */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          padding: "0 20px",
          marginBottom: "30px",
        }}
      >
        <GameCard
          title="BALL"
          description="CATCH"
          onClick={onStart}
          colorIndex={0}
        />
        <GameCard
          title="HAND"
          description="LANDMARK"
          onClick={onHandLandmark}
          colorIndex={1}
        />
        <GameCard
          title="COMING"
          description="SOON"
          onClick={() => {}}
          colorIndex={2}
        />
        <GameCard
          title="COMING"
          description="SOON"
          onClick={() => {}}
          colorIndex={3}
        />
      </div>

      {/* ゲーム開始メッセージ */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          fontSize: "14px",
          color: "#00FFFF",
          textShadow: "0 0 5px #00FFFF, 0 0 10px #00FF00",
          fontFamily: "'Courier New', monospace",
          letterSpacing: "1px",
          animation: "blink 1s infinite",
        }}
      >
        PRESS START TO CONTINUE
      </div>

      <style>{`
        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(10px);
          }
        }

        @keyframes invaderMove {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(15px);
          }
        }

        @keyframes flicker {
          0%, 100% {
            opacity: 1;
            textShadow: 0 0 10px #00FF00, 0 0 20px #00AA00;
          }
          50% {
            opacity: 0.9;
            textShadow: 0 0 5px #00FF00, 0 0 10px #007700;
          }
        }

        @keyframes blink {
          0%, 49%, 100% {
            opacity: 1;
          }
          50%, 99% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
