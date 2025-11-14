import { useRef, useState, useEffect } from "react";
import useVoiceModel from "../hooks/useVoiceModel";
import useGameSpeed from "../hooks/useGameSpeed";
import useSprites from "../hooks/useSprites";
import GameCanvas from "./GameCanvas";
import StartButton from "./StartButton";
import DefaultModelButton from "./DefaultModelButton";
import UploadModelButton from "./UploadModelButton";
import GameOverToast from "./GameOverToast";
import { spawnObstacle } from "../engine/obstacles";

const LANES = 3;
const SPAWN_INTERVAL = 120;

export default function Game() {
  const { modelLoaded, loadDefaultModel, loadZipModel, stopListening, startListening } = useVoiceModel();
  const { speed, update: updateSpeed, restore } = useGameSpeed();
  const { playerCar, obstacleSprites, obstacleFiles } = useSprites();

  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState([]);
  const [frameCount, setFrameCount] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const lastVoiceRef = useRef(0);
  const VOICE_COOLDOWN = 400;

  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(1000);
  const [laneOffset, setLaneOffset] = useState(0); //for parallax
  
  //responsive scaling
  useEffect(() => {
    const resize = () => {
        const maxW = 900;
        const maxH = 1600;
        const minW = 400;
        const minH = 600;
        const w = Math.min(maxW, Math.max(minW, window.innerWidth * 0.6));
        const h = Math.min(maxH, Math.max(minH, window.innerHeight * 0.8));
        setCanvasHeight(h);
        setCanvasWidth(w);
    };

    window.addEventListener("resize", resize);
    resize();
    return  () => window.removeEventListener("resize", resize);
  }, []);

  // Voice input
  useEffect(() => {
    function handler(e) {
      if (!started || gameOver) return;
      const now = Date.now();
      if (now - lastVoiceRef.current < VOICE_COOLDOWN) return;
      lastVoiceRef.current = now;

      const action = e.detail.className.toLowerCase();
      if (action.includes("left")) setPlayerLane((p) => Math.max(0, p - 1));
      if (action.includes("right")) setPlayerLane((p) => Math.min(LANES - 1, p + 1));

      restore();
    }
    window.addEventListener("voicePrediction", handler);
    return () => window.removeEventListener("voicePrediction", handler);
  }, [started, gameOver, restore]);

  // Game loop
  useEffect(() => {
    if (!started || gameOver) return;
    const ctx = canvasRef.current.getContext("2d");

    const loop = () => {
      if (gameOver) return;

      updateSpeed({ playerLane, obstacles });

      //move lane stripes
      setLaneOffset((prev) => (prev + speed ) % 40);

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      //background
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      //lane stripes(parallax)
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      const laneW = canvasWidth / LANES;
      for(let i = 1; i < LANES; i++){
        ctx.beginPath();
        for(let y = -20; y < canvasHeight; y += 40){
            ctx.moveTo(i * laneW, y + laneOffset);
            ctx.lineTo(i * laneW, y + 20 + laneOffset);
        }
        ctx.stroke();
      }

      // Player
      if (playerCar.current) {
        const pW = playerCar.current.width * (canvasWidth / 1200);//0.22;
        const pH = playerCar.current.height * (canvasHeight / 1200);//0.22;
        const pX = playerLane * laneW + (laneW - pW) / 2;
        const pY = canvasHeight - pH - 10;
        ctx.drawImage(playerCar.current, pX, pY, pW, pH);
      }

      // Obstacles
      setObstacles((prev) =>
        prev
          .map((o) => ({ ...o, y: o.y + speed }))
          .filter((o) => o.y < canvasHeight + 200)
      );

      obstacles.forEach((o) => {
        const img = obstacleSprites.current[o.sprite];
        const oW = img.width * (canvasWidth/1200);
        const oH = img.height * (canvasHeight / 1200);
        const oX = o.lane * laneW + (laneW - oW) / 2;
        ctx.drawImage(img, oX, o.y, oW, oH);

        const pH = playerCar.current.height * (canvasHeight / 1200);
        const pY = canvasHeight - pH - 10;
        if (o.lane === playerLane && o.y + oH >= pY && o.y <= pY + pH) {
          stopListening();
          setGameOver(true);
        }
      });

      ctx.fillStyle = "white";
      ctx.font = `${18 * (canvasWidth / 600)}px sans-serif`;
      ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

      setScore((s) => s + 0.1);
      setFrameCount((f) => f + 1);

      if (frameCount % SPAWN_INTERVAL === 0) {
        setObstacles((prev) => [...prev, spawnObstacle(LANES, obstacleFiles)]);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [started, gameOver, obstacles, speed, frameCount, playerLane, canvasHeight, canvasWidth]);

  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    setFrameCount(0);
    setObstacles([]);
    setPlayerLane(1);
    setStarted(true);
    startListening();
  };

  const handleSwitchModel = () => {
    setStarted(false);
    setGameOver(false);
    setScore(0);
    setObstacles([]);
    setPlayerLane(1);
  };

  return (
    <div style={{ textAlign: "center" }}>
      {!started && (
        <>
          <DefaultModelButton onLoad={loadDefaultModel} disabled={started} />
          <UploadModelButton onLoad={loadZipModel} disabled={started} />
        </>
      )}

      {modelLoaded && !started && <StartButton onStart={() => setStarted(true)} />}

      <GameCanvas canvasRef={canvasRef} width={canvasWidth} height={canvasHeight} />

      {gameOver && (
        <GameOverToast
          score={score}
          onRestart={handleRestart}
          onSwitchModel={handleSwitchModel}
        />
      )}
    </div>
  );
}
