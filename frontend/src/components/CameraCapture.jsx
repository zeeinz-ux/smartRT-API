import { useState, useRef, useEffect, useCallback } from "react";
import { X, Camera } from "lucide-react";
import API_BASE_URL from "../utils/api.js";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Izin kamera ditolak. Izinkan akses kamera di pengaturan browser.");
        } else if (err.name === "NotFoundError") {
          setError("Kamera tidak ditemukan di perangkat ini.");
        } else {
          setError("Gagal membuka kamera: " + err.message);
        }
      }
    })();
    return stopCamera;
  }, [stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setSnapshot(URL.createObjectURL(blob));
      stopCamera();

      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
      uploadPhoto(file);
    }, "image/jpeg", 0.85);
  };

  const uploadPhoto = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST", credentials: "include", body: fd,
      });
      const json = await res.json();
      if (json.success) {
        onCapture(json.data.url);
        onClose();
      } else {
        setError(json.message || "Gagal upload foto");
      }
    } catch {
      setError("Gagal upload foto. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const retake = () => {
    setSnapshot(null);
    setError(null);
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setError("Gagal membuka kamera");
      }
    })();
  };

  return (
    <div className="camera-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
        <div className="camera-modal__header">
          <h3>Ambil Foto</h3>
          <button className="camera-modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="camera-modal__body">
          {error ? (
            <div className="camera-error">
              <p>{error}</p>
              <button className="camera-btn camera-btn--retake" onClick={retake}>Coba Lagi</button>
            </div>
          ) : snapshot ? (
            <div className="camera-snapshot">
              <img src={snapshot} alt="Hasil jepretan" />
              {uploading && <div className="camera-uploading"><div className="camera-spinner" /><p>Mengupload...</p></div>}
            </div>
          ) : (
            <div className="camera-viewfinder">
              <video ref={videoRef} autoPlay playsInline muted />
              <button className="camera-capture-btn" onClick={handleCapture}>
                <Camera size={28} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
