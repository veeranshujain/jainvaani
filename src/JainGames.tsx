import { useState, useEffect } from "react";

const styles = `
.jg-wrap{background:#fffefa;border:1px solid #eee7dc;border-radius:14px;padding:20px;margin:18px 0}
.jg-wrap h2{font-size:19px;color:#50351e;margin:0 0 10px}
.jg-muted{color:#8e8578;font-size:13px;margin-bottom:16px}
.jg-tabs{display:flex;gap:10px;margin-bottom:16px}
.jg-tab{border:0;border-radius:8px;padding:9px 15px;background:#eee6d9;color:#60462d;font-weight:600;cursor:pointer}
.jg-tab.active{background:#a65e20;color:white}
.jg-btn{border:0;border-radius:8px;padding:10px 16px;background:#a65e20;color:white;font-weight:600;cursor:pointer;margin-top:10px}
`;

// ------------------------------------------------------
// 1. SPIRITUAL PUZZLE GAME (Clean Jain Attributes/Symbols)
// ------------------------------------------------------
function TirthankarPuzzleGame() {
  const [tiles, setTiles] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const [solved, setSolved] = useState<boolean>(false);
  const [moves, setMoves] = useState(0);

  const tileLabels = ["ॐ", "सिद्ध", "अरिहंत", "आचार्य", "उपाध्याय", "साधु", "रत्न", "ज्ञान", ""];

  function shuffle() {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
    setTiles(arr);
    setSolved(false);
    setMoves(0);
  }

  useEffect(() => {
    shuffle();
  }, []);

  function swap(idx: number) {
    if (solved) return;
    const emptyIdx = tiles.indexOf(8);
    const r1 = Math.floor(idx / 3), c1 = idx % 3;
    const r2 = Math.floor(emptyIdx / 3), c2 = emptyIdx % 3;

    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
      const nextTiles = [...tiles];
      [nextTiles[idx], nextTiles[emptyIdx]] = [nextTiles[emptyIdx], nextTiles[idx]];
      setTiles(nextTiles);
      setMoves(m => m + 1);

      if (nextTiles.every((val, index) => val === index)) {
        setSolved(true);
      }
    }
  }

  return (
    <div style={{ textAlign: "center", padding: 4 }}>
      <p className="jg-muted">पवित्र प्रतीकों और गुणों को सही क्रम में व्यवस्थित करें।</p>
      <div style={{ fontSize: 13, marginBottom: 8, color: "#50351e" }}>चालें (Moves): <b>{moves}</b></div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 86px)",
        gridTemplateRows: "repeat(3, 86px)",
        gap: 6,
        justifyContent: "center",
        margin: "0 auto",
        width: 276,
        padding: 6,
        borderRadius: 8,
        background: "#fbf7ef",
        border: "2px solid #dfd3bf"
      }}>
        {tiles.map((tileVal, idx) => {
          const isEmpty = tileVal === 8;

          return (
            <div
              key={idx}
              onClick={() => swap(idx)}
              style={{
                width: 86,
                height: 86,
                cursor: isEmpty ? "default" : "pointer",
                backgroundColor: isEmpty ? "#eee6d9" : "#fff",
                color: "#50351e",
                fontWeight: "bold",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                border: "1px solid #dfd3bf",
                boxShadow: isEmpty ? "none" : "0 2px 4px rgba(0,0,0,0.06)",
                userSelect: "none"
              }}
            >
              {isEmpty ? "" : tileLabels[tileVal]}
            </div>
          );
        })}
      </div>

      {solved && <div style={{ color: "#426b35", fontWeight: "bold", marginTop: 12 }}>✨ जय जिनेंद्र! पहेली सफलतापूर्वक हल हो गई!</div>}

      <button className="jg-btn" onClick={shuffle}>🔀 पुनः व्यवस्थित करें (Shuffle)</button>
    </div>
  );
}

// ------------------------------------------------------
// 2. 10x10 MAZE GAME
// ------------------------------------------------------
const MAZE_GRID = [
  [0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 1, 0, 1, 0, 1, 0, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  [1, 1, 0, 1, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
];

function JainMazeGame() {
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [won, setWon] = useState<boolean>(false);

  function move(dr: number, dc: number) {
    if (won) return;
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (
      nr >= 0 && nr < 10 &&
      nc >= 0 && nc < 10 &&
      MAZE_GRID[nr][nc] === 0
    ) {
      setPos({ r: nr, c: nc });
      if (nr === 9 && nc === 9) setWon(true);
    }
  }

  return (
    <div style={{ textAlign: "center", padding: 4 }}>
      <p className="jg-muted">10x10 विस्तृत मार्ग से होते हुए मंदिर (🚩) तक पहुँचें।</p>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(10, 26px)",
        gap: 2,
        justifyContent: "center",
        margin: "12px auto"
      }}>
        {MAZE_GRID.map((row, r) =>
          row.map((cell, c) => {
            const isPlayer = pos.r === r && pos.c === c;
            const isGoal = r === 9 && c === 9;
            let bg = cell === 1 ? "#50351e" : "#fbf7ef";
            if (isPlayer) bg = "#a65e20";
            if (isGoal) bg = "#426b35";

            return (
              <div
                key={`${r}-${c}`}
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: bg,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  border: "1px solid #dfd3bf"
                }}
              >
                {isPlayer ? "🏃" : isGoal ? "🚩" : ""}
              </div>
            );
          })
        )}
      </div>

      {won && <div style={{ color: "#426b35", fontWeight: "bold", margin: 8 }}>🎉 जय जिनेंद्र! आपने मंदिर तक की यात्रा पूरी कर ली!</div>}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginTop: 10 }}>
        <button className="jg-btn" style={{ padding: "6px 14px", marginTop: 0 }} onClick={() => move(-1, 0)}>⬆️ Up</button>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="jg-btn" style={{ padding: "6px 14px", marginTop: 0 }} onClick={() => move(0, -1)}>⬅️ Left</button>
          <button className="jg-btn" style={{ padding: "6px 14px", marginTop: 0 }} onClick={() => move(0, 1)}>➡️ Right</button>
        </div>
        <button className="jg-btn" style={{ padding: "6px 14px", marginTop: 0 }} onClick={() => move(1, 0)}>⬇️ Down</button>
      </div>
      <button className="jg-btn" style={{ marginTop: 10, background: "#8e8578" }} onClick={() => { setPos({ r: 0, c: 0 }); setWon(false); }}>पुनः आरंभ करें</button>
    </div>
  );
}

// ------------------------------------------------------
// MAIN EXPORTED COMPONENT
// ------------------------------------------------------
export function JainGamesSection() {
  const [game, setGame] = useState<"puzzle" | "maze">("puzzle");

  return (
    <div className="jg-wrap">
      <style>{styles}</style>
      <h2>🎮 जैन धार्मिक खेल (Jain Dharmik Games)</h2>
      <p className="jg-muted">मनोरंजन के साथ जैन दर्शन और ज्ञान का आनंद लें।</p>

      <div className="jg-tabs">
        <button className={`jg-tab ${game === "puzzle" ? "active" : ""}`} onClick={() => setGame("puzzle")}>
          पवित्र प्रतीक पहेली (Spiritual Puzzle)
        </button>
        <button className={`jg-tab ${game === "maze" ? "active" : ""}`} onClick={() => setGame("maze")}>
          विस्तृत मोक्ष मार्ग भूलभुलैया (10x10 Maze)
        </button>
      </div>

      {game === "puzzle" ? <TirthankarPuzzleGame /> : <JainMazeGame />}
    </div>
  );
}