import { useEffect, useRef } from "react";

export default function useSprites() {
  const playerCar = useRef(null);
  const obstacleSprites = useRef({});
  const OBSTACLE_FILES = [
    "ambulance.png",
    "black_viper.png",
    "car.png",
    "mini_truck.png",
    "mini_van.png",
    "police.png"
  ];

  useEffect(() => {
    const img = new Image();
    img.src = "/car_sprites/audi.png";
    playerCar.current = img;

    OBSTACLE_FILES.forEach((file) => {
      const oImg = new Image();
      oImg.src = `/car_sprites/${file}`;
      obstacleSprites.current[file] = oImg;
    });
  }, []);

  return { playerCar, obstacleSprites, obstacleFiles: OBSTACLE_FILES };
}
