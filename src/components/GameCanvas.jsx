export default function GameCanvas({ canvasRef, width, height }) {
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: "2px solid #fff", background: "#333" }}
    />
  );
}
