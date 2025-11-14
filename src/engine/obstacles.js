export function spawnObstacle(lanes, obstacleFiles) {
  const lane = Math.floor(Math.random() * lanes);
  const sprite =
    obstacleFiles[Math.floor(Math.random() * obstacleFiles.length)];
  return { lane, y: -120, sprite };
}
