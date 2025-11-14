import { useEffect, useRef, useState } from "react";
import useVoiceModel from "../hooks/useVoiceModel";

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 500;
const LANES = 3;
const LANE_WIDTH = CANVAS_WIDTH / LANES;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 80;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 80;
const BASE_SPEED = 2;
const SPEED_INCREMENT = 0.002; // gradual speed increase per frame
const SPAWN_INTERVAL = 120; // frames (~2 seconds at 60fps)

export default function TrafficGame() {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const { modelLoaded, loadDefaultModel } = useVoiceModel();

  const [playerLane, setPlayerLane] = useState(1); // start center
  const [obstacles, setObstacles] = useState([]);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [frameCount, setFrameCount] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Load the default voice model
  useEffect(() => {
    loadDefaultModel();
  }, []);

  // Voice input listener
  useEffect(() => {
    const handler = (e) => {
      const action = e.detail.className.toLowerCase();
      if (gameOver) return;

      if (action.includes("left")) {
        setPlayerLane((prev) => Math.max(0, prev - 1));
      } else if (action.includes("right")) {
        setPlayerLane((prev) => Math.min(LANES - 1, prev + 1));
      }
    };
    window.addEventListener("voicePrediction", handler);
    return () => window.removeEventListener("voicePrediction", handler);
  }, [gameOver]);


    // Drawing function
  const draw = (ctx) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Lane dividers
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Player car
    ctx.fillStyle = "blue";
    const playerX = playerLane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    const playerY = CANVAS_HEIGHT - PLAYER_HEIGHT - 10;
    ctx.fillRect(playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);

    // Obstacles
    ctx.fillStyle = "red";
    obstacles.forEach((o) => {
      const x = o.lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_WIDTH) / 2;
      ctx.fillRect(x, o.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
    });

    // Score
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 25);
    setScore((s) => s + 0.1);
  };
  
  // Main game loop
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    const loop = () => {
      if (gameOver) return;

      setFrameCount((f) => f + 1);
      setSpeed((s) => s + SPEED_INCREMENT);

      // Spawn new obstacles
      if (frameCount % SPAWN_INTERVAL === 0) {
        const lane = Math.floor(Math.random() * LANES);
        setObstacles((prev) => [
          ...prev,
          { lane, y: -OBSTACLE_HEIGHT },
        ]);
      }

      // Move obstacles
      setObstacles((prev) =>
        prev
          .map((o) => ({ ...o, y: o.y + speed }))
          .filter((o) => o.y < CANVAS_HEIGHT + OBSTACLE_HEIGHT)
      );

      // Collision detection
      obstacles.forEach((o) => {
        if (
          o.lane === playerLane &&
          o.y + OBSTACLE_HEIGHT >= CANVAS_HEIGHT - PLAYER_HEIGHT - 10 &&
          o.y <= CANVAS_HEIGHT - 10
        ) {
          setGameOver(true);
        }
      });

      draw(ctx);

      if (!gameOver) requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [obstacles, playerLane, frameCount, gameOver, speed]);


  const handleRestart = () => {
    setObstacles([]);
    setPlayerLane(1);
    setSpeed(BASE_SPEED);
    setFrameCount(0);
    setScore(0);
    setGameOver(false);
    requestAnimationFrame(() => {}); // restart loop
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>AI Traffic Lane Game</h2>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ border: "2px solid #fff", background: "#333" }}
      />
      {gameOver && (
        <div>
          <h3>Game Over!</h3>
          <button onClick={handleRestart}>Restart</button>
        </div>
      )}
      {!modelLoaded && <p>Loading voice model...</p>}
    </div>
  );
}
