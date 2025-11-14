import { useState, useRef } from "react";

export default function useVoiceModel() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognizerRef = useRef(null);

  const loadDefaultModel = async () => {
    setLoading(true);
    try {
      const modelURL = `${window.location.origin}/default_model/model.json`;
      const metadataURL = `${window.location.origin}/default_model/metadata.json`;
      await initRecognizer(modelURL, metadataURL);
    } finally {
      setLoading(false);
    }
  };

  const loadZipModel = async (file) => {
    setLoading(true);

    try{
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);
      const modelFile = zip.file("model.json");
      const metadataFile = zip.file("metadata.json");

      if(!modelFile || !metadataFile)
        throw new Error("Zip must include model.json and metadata.json");

      const modelBlob = await modelFile.async("blob");
      const metadataBlob = await metadataFile.async("blob");

      const modelURL = URL.createObjectURL(modelBlob);
      const metadataURL = URL.createObjectURL(metadataBlob);

      await initRecognizer(modelURL, metadataURL);
    }
    finally{
      setLoading(false);
    }
  }

  const initRecognizer = async (modelURL, metadataURL) => {
    await navigator.mediaDevices.getUserMedia({ audio: true });

    recognizerRef.current = window.speechCommands.create(
      "BROWSER_FFT",
      undefined,
      modelURL,
      metadataURL
    );

    await recognizerRef.current.ensureModelLoaded();
    setModelLoaded(true);
    startListening();
  };

  const startListening = () => {
    if(!recognizerRef.current) return;

    recognizerRef.current.listen(
      (result) => {
        const scores = result.scores;
        const labels = recognizerRef.current.wordLabels();
        const highestIndex = scores.indexOf(Math.max(...scores));
        const className = labels[highestIndex];

        window.dispatchEvent(new CustomEvent("voicePrediction", {
          detail: {className, scores}
        }));

      },
      {
        probabilityThreshold: 0.7,
        includeSpectrogram: true,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.5
      }
    );
  }

  const stopListening = () => recognizerRef.current?.stopListening();

  return {
    modelLoaded,
    loading,
    loadDefaultModel,
    loadZipModel,
    startListening,
    stopListening,
  };
}
