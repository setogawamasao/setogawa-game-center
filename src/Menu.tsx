interface MenuProps {
  onStart: () => void;
}

export default function Menu({ onStart }: MenuProps) {
  const isSmall = typeof window !== "undefined" && window.innerWidth < 600;
  const gameSize = isSmall ? 120 : 160;
  const gap = isSmall ? 12 : 20;
  const titleSize = isSmall ? 36 : 48;
  const subtitleSize = isSmall ? 32 : 40;
  const subsubTitleSize = isSmall ? 24 : 32;

  const GameCard = ({
    title,
    description,
    colors,
    onClick,
  }: {
    title: string;
    description: string;
    colors: { bg: string; text: string; accent: string };
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        width: `${gameSize}px`,
        height: `${gameSize}px`,
        backgroundColor: colors.bg,
        border: "3px solid #000000",
        borderRadius: "15px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        transition: "all 0.15s",
        padding: "10px",
        boxSizing: "border-box",
        position: "relative",
        boxShadow: `
          0 4px 0px #000000,
          0 5px 10px rgba(0, 0, 0, 0.3),
          inset 0 2px 0px rgba(255, 255, 255, 0.4)
        `,
        fontFamily: "'Comic Sans MS', 'Arial', sans-serif",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `
          0 6px 0px #000000,
          0 7px 15px rgba(0, 0, 0, 0.4),
          inset 0 2px 0px rgba(255, 255, 255, 0.4)
        `;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `
          0 4px 0px #000000,
          0 5px 10px rgba(0, 0, 0, 0.3),
          inset 0 2px 0px rgba(255, 255, 255, 0.4)
        `;
      }}
    >
      {/* KID CORE的な装飾小要素 */}
      <div
        style={{
          position: "absolute",
          top: "-8px",
          right: "-8px",
          width: "16px",
          height: "16px",
          backgroundColor: colors.accent,
          borderRadius: "50%",
          border: "2px solid #000000",
          boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-6px",
          left: "-6px",
          width: "14px",
          height: "14px",
          backgroundColor: colors.accent,
          transform: "rotate(45deg)",
          border: "2px solid #000000",
        }}
      />

      <div
        style={{
          fontSize: isSmall ? "20px" : "24px",
          fontWeight: "900",
          color: colors.text,
          textTransform: "uppercase",
          textShadow: "2px 2px 0px rgba(255, 255, 255, 0.7)",
          letterSpacing: "0.5px",
          lineHeight: "1.1",
          transform: "rotate(-3deg)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: isSmall ? "8px" : "10px",
          color: colors.text,
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          lineHeight: "1",
          transform: "rotate(2deg)",
        }}
      >
        {description}
      </div>
    </button>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isSmall ? "15px 10px" : "30px 20px",
        boxSizing: "border-box",
        background: `
          linear-gradient(135deg, #F5E6F0 0%, #E8F4F8 50%, #F0F0E8 100%)
        `,
        position: "relative",
        fontFamily: "'Comic Sans MS', 'Arial', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 背景パターン - KID CORE的 */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          background: "transparent",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* デコレーション絵文字 */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          left: "20px",
          fontSize: "50px",
          opacity: 0.3,
          transform: "rotate(-25deg)",
          zIndex: 2,
        }}
      >
        ⭐
      </div>
      <div
        style={{
          position: "absolute",
          top: "40px",
          right: "30px",
          fontSize: "45px",
          opacity: 0.3,
          transform: "rotate(30deg)",
          zIndex: 2,
        }}
      >
        💫
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "30px",
          fontSize: "40px",
          opacity: 0.25,
          transform: "rotate(-15deg)",
          zIndex: 2,
        }}
      >
        🌈
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          right: "40px",
          fontSize: "45px",
          opacity: 0.3,
          transform: "rotate(20deg)",
          zIndex: 2,
        }}
      >
        ✨
      </div>

      {/* メインタイトルコンテナ */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          marginBottom: "30px",
          textAlign: "center",
          background: `
            linear-gradient(
              135deg,
              #FFFF00 0%,
              #FF1493 25%,
              #00FFFF 50%,
              #FF69B4 75%,
              #FFFF00 100%
            )
          `,
          padding: isSmall ? "15px 25px" : "20px 40px",
          borderRadius: "30px",
          border: "4px solid #000000",
          boxShadow: `
            0 6px 0px #000000,
            0 8px 15px rgba(0, 0, 0, 0.3),
            inset 0 2px 5px rgba(255, 255, 255, 0.5)
          `,
          transform: "rotate(-2deg)",
        }}
      >
        <div
          style={{
            fontSize: isSmall ? "36px" : "48px",
            fontWeight: "900",
            color: "#000000",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "2px",
            textShadow: `
              2px 2px 0px #FFFF00,
              4px 4px 0px #FF1493,
              6px 6px 0px #00FFFF
            `,
            transform: "rotate(3deg)",
          }}
        >
          ゲーム
        </div>
        <div
          style={{
            fontSize: isSmall ? "32px" : "40px",
            fontWeight: "900",
            color: "#FF1493",
            margin: "-5px 0 0 0",
            textTransform: "uppercase",
            letterSpacing: "1px",
            textShadow: `
              2px 2px 0px #00FFFF,
              3px 3px 0px #FFFF00
            `,
            transform: "rotate(-2deg)",
          }}
        >
          センター
        </div>
        <div
          style={{
            fontSize: isSmall ? "24px" : "32px",
            fontWeight: "900",
            color: "#00FFFF",
            margin: "0px 0 0 0",
            textTransform: "uppercase",
            letterSpacing: "1px",
            textShadow: `
              1px 1px 0px #FF1493,
              2px 2px 0px #FFFF00
            `,
            transform: "rotate(1deg)",
          }}
        >
          瀬戸川
        </div>
      </div>

      {/* サブタイトル */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          fontSize: isSmall ? "14px" : "18px",
          fontWeight: "900",
          color: "#000000",
          marginBottom: "30px",
          textTransform: "uppercase",
          letterSpacing: "1px",
          textShadow: `
            1px 1px 0px #FFFF00,
            2px 2px 0px #FF1493,
            3px 3px 0px #00FFFF
          `,
          transform: "rotate(2deg)",
        }}
      >
        ✨ KIDCORE GAMEPARK ✨
      </div>

      {/* ゲームグリッド */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${gameSize}px, 1fr))`,
          gap: `${gap}px`,
          maxWidth: isSmall ? "100%" : "560px",
          padding: isSmall ? "0 10px" : "0",
          filter: "drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.3))",
        }}
      >
        <GameCard
          title="BALL"
          description="CATCH"
          colors={{ bg: "#FFFF00", text: "#FF1493", accent: "#00FFFF" }}
          onClick={onStart}
        />
        <GameCard
          title="COMING"
          description="SOON"
          colors={{ bg: "#FF69B4", text: "#FFFF00", accent: "#00FFFF" }}
          onClick={() => {}}
        />
        <GameCard
          title="COMING"
          description="SOON"
          colors={{ bg: "#00FFFF", text: "#FF1493", accent: "#FFFF00" }}
          onClick={() => {}}
        />
        <GameCard
          title="COMING"
          description="SOON"
          colors={{ bg: "#00FF7F", text: "#FF1493", accent: "#FF69B4" }}
          onClick={() => {}}
        />
      </div>

      {/* デコレーション星 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "10px",
          fontSize: "30px",
          opacity: 0.2,
          animation: "spin 10s linear infinite",
          zIndex: 2,
        }}
      >
        ⭐
      </div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "10px",
          fontSize: "30px",
          opacity: 0.2,
          animation: "spin 8s linear infinite reverse",
          zIndex: 2,
        }}
      >
        💫
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
