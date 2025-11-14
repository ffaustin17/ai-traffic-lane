import { useState, useRef, useEffect } from "react";

export default function useGameSpeed(normal = 5, slowdown = 3, threshold = 150) {
  const [speed, setSpeed] = useState(normal);
  const targetRef = useRef(normal);
  const SPEED_EASE = 0.1;

  const update = ({ playerLane, obstacles }) => {
    const nextObstacle = obstacles.find((o) => o.lane === playerLane && o.y > 0);
    if (nextObstacle && nextObstacle.y < threshold) {
      targetRef.current = slowdown;
    } else {
      targetRef.current = normal;
    }
  };

  useEffect(() => {
    let frame;
    const loop = () => {
      setSpeed((prev) => prev + (targetRef.current - prev) * SPEED_EASE);
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, []);

  const restore = () => {
    targetRef.current = normal;
  };

  return { speed, update, restore };
}
