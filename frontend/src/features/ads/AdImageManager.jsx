import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdImages,
  uploadAdImage,
  deleteAdImage,
} from "../../redux/adImagesSlice";

export default function AdImageManager({ adId, onImagesReady }) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const images = useSelector((state) => state.adImages.images);
  const loading = useSelector((state) => state.adImages.loading);

  const [selectedFiles, setSelectedFiles] = useState([]);

  // Fetch images for existing ad
  useEffect(() => {
    if (adId) {
      dispatch(fetchAdImages(adId));
      setSelectedFiles([]); // REMOVE THIS LINE
    }
  }, [adId, dispatch]);

  // For new ad: notify parent of selected files
  useEffect(() => {
    if (!adId && onImagesReady) {
      onImagesReady(selectedFiles);
    }
  }, [selectedFiles, adId, onImagesReady]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (adId) {
      const remaining = 5 - images.length;
      const filesToUpload = files.slice(0, remaining);
      filesToUpload.forEach((file) => {
        dispatch(uploadAdImage({ adId, file }));
      });
    } else {
      const remaining = 5 - selectedFiles.length;
      const filesToAdd = files.slice(0, remaining);
      setSelectedFiles((prev) => [...prev, ...filesToAdd]);
    }
    e.target.value = "";
  };

  const handleRemoveStaged = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDelete = (filename) => {
    dispatch(deleteAdImage({ adId, filename }));
  };

  const renderStagedPreviews = () =>
    selectedFiles.map((file, idx) => (
      <div
        key={file.name + idx}
        style={{ display: "inline-block", margin: 8, position: "relative" }}
      >
        <img
          src={URL.createObjectURL(file)}
          alt="preview"
          style={{
            width: 100,
            height: 100,
            objectFit: "cover",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
        <button
          type="button"
          onClick={() => handleRemoveStaged(idx)}
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            background: "rgba(255,255,255,0.8)",
            border: "none",
            borderRadius: "50%",
            width: 24,
            height: 24,
            cursor: "pointer",
            fontWeight: "bold",
            color: "#d00",
          }}
          title="Remover"
        >
          ×
        </button>
      </div>
    ));

  const renderUploadedPhotos = () =>
    images.map((filename) => (
      <div
        key={filename}
        style={{ display: "inline-block", margin: 8, position: "relative" }}
      >
        <img
          src={`/uploads/ad_images/${filename}`}
          alt="ad"
          style={{
            width: 100,
            height: 100,
            objectFit: "cover",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
        <button
          type="button"
          onClick={() => handleDelete(filename)}
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            background: "rgba(255,255,255,0.8)",
            border: "none",
            borderRadius: "50%",
            width: 24,
            height: 24,
            cursor: "pointer",
            fontWeight: "bold",
            color: "#d00",
          }}
          title="Remover"
        >
          ×
        </button>
      </div>
    ));

  const count = adId ? images.length : selectedFiles.length;

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        {adId ? renderUploadedPhotos() : renderStagedPreviews()}
      </div>
      {count < 5 && (
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={loading}
        />
      )}
      <div>{count}/5 fotos</div>
    </div>
  );
}
