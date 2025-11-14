export function checkCollision(playerLane, playerY, pH, obstacle) {
  const oH = obstacle.h || 80;
  const overlapY = obstacle.y + oH >= playerY && obstacle.y <= playerY + pH;
  return obstacle.lane === playerLane && overlapY;
}
