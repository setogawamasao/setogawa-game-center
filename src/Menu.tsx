import { useState } from "react";

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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
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
          maxWidth: "200px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          cursor: "pointer",
        }}
        className="game-card"
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
        width: "100vw",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "30px 0",
        boxSizing: "border-box",
        background: "#000000",
        position: "relative",
        fontFamily: "'Courier New', monospace",
        overflow: "auto",
        overflowX: "hidden",
      }}
    >
      {/* ポップアップウィンドウ */}
      {isInfoOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#001100",
              border: "3px solid #00FF00",
              borderRadius: "8px",
              padding: "30px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "70vh",
              overflow: "auto",
              boxShadow: "0 0 30px #00FF00",
              color: "#00FF00",
              fontFamily: "'Courier New', monospace",
              textShadow: "0 0 10px #00FF00",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              はじめに
            </div>
            <div
              style={{ fontSize: "14px", lineHeight: "1.8", color: "#00FFFF" }}
            >
              <p>手や顔の動きをカメラで読み取って操作するゲームです。</p>
              <p>
                カメラ映像はあくまでゲーム内の動作認識にのみ利用しており、外部へ送信されることはありません。
              </p>
              <p>動画を押してゲームを始めてね！</p>
            </div>
            <button
              onClick={() => setIsInfoOpen(false)}
              style={{
                marginTop: "20px",
                backgroundColor: "#00FF00",
                color: "#000000",
                border: "2px solid #00FFFF",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "bold",
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
                borderRadius: "4px",
                boxShadow: "0 0 10px #00FF00",
                width: "100%",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          width: "100%",
        }}
        className="title-container"
      >
        <div
          style={{
            fontSize: "clamp(24px, 8vw, 40px)",
            fontWeight: "bold",
            letterSpacing: "clamp(0.5px, 0.3vw, 3px)",
            fontFamily: "'Courier New', monospace",
            color: "#00FF00",
            textShadow: "0 0 10px #00FF00, 0 0 20px #00FFFF, 0 0 30px #FF0080",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          瀬戸川ゲームセンター
        </div>
        <button
          onClick={() => setIsInfoOpen(true)}
          style={{
            backgroundColor: "#00FF00",
            color: "#000000",
            border: "2px solid #00FFFF",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            fontFamily: "'Courier New', monospace",
            cursor: "pointer",
            borderRadius: "4px",
            boxShadow: "0 0 10px #00FF00",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 20px #00FF00, 0 0 10px #00FFFF";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 10px #00FF00";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          はじめに
        </button>
      </div>

      {/* ゲームグリッド */}
      <div
        className="game-grid"
        style={{
          position: "relative",
          zIndex: 10,
          display: "grid",
          width: "100%",
          padding: "0 20px",
          boxSizing: "border-box",
          justifyItems: "center",
        }}
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

        /* PC用: 画面幅に対応する動的列数 */
        .game-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          max-width: 90vw;
          width: calc(100vw - 40px);
        }

        .game-card {
          width: 100%;
        }

        /* スマホ用: 1列グリッド */
        @media (max-width: 640px) {
          .game-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            max-width: 100%;
            width: calc(100vw - 40px);
          }

          .game-card {
            width: 100%;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
