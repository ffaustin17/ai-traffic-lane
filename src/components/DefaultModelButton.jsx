export default function DefaultModelButton({ onLoad, disabled }) {
  return (
    <button disabled={disabled} onClick={onLoad}>
      Load Default Model
    </button>
  );
}
