export default function StartButton({ onStart, disabled }) {
  return (
    <button disabled={disabled} onClick={onStart}>
      Start Game
    </button>
  );
}
