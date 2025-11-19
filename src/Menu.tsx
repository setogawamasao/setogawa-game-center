interface MenuProps {
  onStart: () => void;
  onHandLandmark: () => void;
  onNew?: () => void;
}

export default function Menu({
  onStart,
  onHandLandmark: onHandFilter,
  onNew,
}: MenuProps) {
  const colors = [
    { bg: "#001100", color: "#00FF00", glow: "#00FF00" }, // グリーン
    { bg: "#000011", color: "#00FFFF", glow: "#00FFFF" }, // シアン
    { bg: "#110000", color: "#FF0080", glow: "#FF0080" }, // マゼンタ
    { bg: "#001111", color: "#00FF88", glow: "#00FF88" }, // ライムグリーン
  ];

  const GameCard = ({
    title,
    description,
    explanation,
    onClick,
    colorIndex,
    videoPath,
  }: {
    title: string;
    description: string;
    explanation?: string;
    onClick: () => void;
    colorIndex: number;
    videoPath?: string;
  }) => {
    const col = colors[colorIndex];
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "180px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          cursor: "pointer",
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          const cardDiv = e.currentTarget.querySelector(
            "[data-card]"
          ) as HTMLElement;
          if (cardDiv) {
            cardDiv.style.boxShadow = `0px 0px 20px 4px ${
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
          }
        }}
        onMouseLeave={(e) => {
          const cardDiv = e.currentTarget.querySelector(
            "[data-card]"
          ) as HTMLElement;
          if (cardDiv) {
            cardDiv.style.boxShadow = `0px 0px 10px 2px ${
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
          }
        }}
      >
        {/* ビデオカード */}
        <div
          data-card
          style={{
            position: "relative",
            width: "100%",
            paddingBottom: "100%",
            height: 0,
            overflow: "hidden",
            borderRadius: "4px",
            border: `3px solid ${col.color}`,
            boxShadow: `0px 0px 10px 2px ${col.glow}, inset 0 0 5px rgba(${
              col.color === "#00FF00"
                ? "0, 255, 0"
                : col.color === "#00FFFF"
                ? "0, 255, 255"
                : col.color === "#FF0080"
                ? "255, 0, 128"
                : "0, 255, 136"
            }, 0.5)`,
            cursor: "pointer",
          }}
        >
          {/* 背景 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: col.bg,
              zIndex: 0,
            }}
          />

          {/* 動画プレビュー */}
          {videoPath && (
            <video
              src={videoPath}
              autoPlay
              muted
              loop
              playsInline
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 1,
              }}
            />
          )}
        </div>

        {/* テキストセクション */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: "4px",
            padding: 0,
            fontFamily: "'Courier New', monospace",
            color: col.color,
            textShadow: `0 0 10px ${col.glow}`,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              lineHeight: "1.1",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "9px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              lineHeight: "1",
            }}
          >
            {description}
          </div>
          {explanation && (
            <div
              style={{
                fontSize: "8px",
                fontWeight: "normal",
                lineHeight: "1.2",
                opacity: 0.9,
                marginTop: "2px",
              }}
            >
              {explanation}
            </div>
          )}
        </div>
      </div>
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
        justifyContent: "flex-start",
        padding: "30px 20px",
        boxSizing: "border-box",
        background: "#000000",
        position: "relative",
        fontFamily: "'Courier New', monospace",
        overflow: "auto",
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
        }}
      />

      {/* メインタイトル */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          marginBottom: "50px",
          textAlign: "center",
          padding: "0 20px",
          maxWidth: "100%",
          width: "100%",
        }}
        className="title-container"
      >
        <div
          style={{
            fontSize: "clamp(16px, 6vw, 36px)",
            fontWeight: "bold",
            letterSpacing: "clamp(0.5px, 0.3vw, 3px)",
            marginBottom: "8px",
            fontFamily: "'Courier New', monospace",
            color: "#00FF00",
            textShadow: "0 0 10px #00FF00, 0 0 20px #00FFFF, 0 0 30px #FF0080",
            whiteSpace: "wrap",
            wordWrap: "break-word",
          }}
        >
          瀬戸川ゲームセンター
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#00FFFF",
            textShadow: "0 0 5px #00FFFF, 0 0 10px #00FF00",
            fontFamily: "'Courier New', monospace",
            letterSpacing: "1px",
            animation: "blink 1s infinite",
          }}
        >
          TAP VIDEO TO START GAME
        </div>
      </div>

      {/* ゲームグリッド */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "grid",
          gridTemplateColumns: "repeat(2, 180px)",
          gap: "20px",
          padding: "0 20px",
          justifyContent: "center",
          margin: "0 auto 30px auto",
        }}
        className="game-grid"
      >
        <GameCard
          title="BALL CATCH"
          description=""
          explanation="落ちてくるボールをキャッチするゲーム"
          onClick={onStart}
          colorIndex={0}
          videoPath="/movies/BallCatch.webm"
        />
        <GameCard
          title="HAND FILTER"
          description=""
          explanation="手の動きを認識して映像にフィルターを適用"
          onClick={onHandFilter}
          colorIndex={1}
          videoPath="/movies/HandFilter.webm"
        />
        <GameCard
          title="NOSE PROTECTION"
          description=""
          explanation="ボールから手で鼻を守る！"
          onClick={onNew || (() => {})}
          colorIndex={2}
          videoPath="/movies/NoseProtectionGame.webm"
        />
        <GameCard
          title="COMING SOON"
          description=""
          explanation="お楽しみに!"
          onClick={() => {}}
          colorIndex={3}
        />
      </div>

      <style>{`
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
            opacity: 0.5;
          }
        }

        .title-container {
          max-width: 600px !important;
          width: auto !important;
        }

        .title-container > div:last-child {
          font-size: clamp(15px, 5vw, 18px);
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .title-container {
            max-width: 100% !important;
            width: 100% !important;
          }

          .title-container > div:first-child {
            font-size: 32px !important;
          }

          .title-container > div:last-child {
            font-size: 15px !important;
            white-space: nowrap;
          }

          .game-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
