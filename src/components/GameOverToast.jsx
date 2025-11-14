export default function GameOverToast({ score, onRestart, onSwitchModel }) {
  return (
    <div className="toast">
      <h3>Game Over!</h3>
      <p>Distance traveled: {Math.floor(score)}</p>
      <button onClick={onRestart}>Restart</button>
      <button onClick={onSwitchModel}>Switch Model</button>
    </div>
  );
}
