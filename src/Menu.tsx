import React from "react";

interface MenuProps {
  onStart: () => void;
}

export default function Menu({ onStart }: MenuProps) {
  const gameSize = 200;
  const gap = 20;

  const GameCard = ({
    title,
    description,
    color,
    onClick,
  }: {
    title: string;
    description: string;
    color: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        width: `${gameSize}px`,
        height: `${gameSize}px`,
        backgroundColor: color,
        border: "3px solid #FFFFFF",
        borderRadius: "10px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        transition: "all 0.3s",
        padding: "10px",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#000000" }}>
        {title}
      </div>
      <div style={{ fontSize: "12px", color: "#000000" }}>{description}</div>
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
        color: "#FFFFFF",
        padding: "40px",
        boxSizing: "border-box",
      }}
    >
      {/* タイトル */}
      <h1 style={{ fontSize: "80px", margin: "0 0 60px 0" }}>
        ゲームセンター瀬戸川
      </h1>

      {/* ゲームグリッド */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${gameSize}px, 1fr))`,
          gap: `${gap}px`,
          maxWidth: "700px",
        }}
      >
        <GameCard
          title="ボール"
          description="キャッチゲーム"
          color="#00FF00"
          onClick={onStart}
        />
        {/* 今後追加のゲーム用スロット */}
        <div
          style={{
            width: `${gameSize}px`,
            height: `${gameSize}px`,
            backgroundColor: "#333333",
            border: "3px dashed #AAAAAA",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#AAAAAA",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          近日公開
        </div>
      </div>
    </div>
  );
}
