export default function UploadModelButton({ onLoad, disabled }) {
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) onLoad(file);
  };
  return (
    <input
      type="file"
      accept=".zip"
      disabled={disabled}
      onChange={handleUpload}
    />
  );
}
