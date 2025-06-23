import { useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdImages } from "../../redux/adImagesSlice";

export default function AdImageManager({
  adId,
  imagesToAdd,
  setImagesToAdd,
  imagesToDelete,
  setImagesToDelete,
}) {
  const dispatch = useDispatch();
  const images = useSelector((state) => state.adImages.images);
  const loading = useSelector((state) => state.adImages.loading);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (adId) {
      dispatch(fetchAdImages(adId));
    }
  }, [adId, dispatch]);

  const handleRemoveStaged = useCallback(
    (idx) => {
      setImagesToAdd((prev) => prev.filter((_, i) => i !== idx));
    },
    [setImagesToAdd]
  );

  const handleDelete = useCallback(
    (filename) => {
      setImagesToDelete((prev) => [...prev, filename]);
    },
    [setImagesToDelete]
  );

  const handleUndoDelete = useCallback(
    (filename) => {
      setImagesToDelete((prev) => prev.filter((f) => f !== filename));
    },
    [setImagesToDelete]
  );

  const handleFileChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      const currentCount =
        (images?.length || 0) -
        (imagesToDelete?.length || 0) +
        (imagesToAdd?.length || 0);
      const remaining = 5 - currentCount;
      const filesToAdd = files.slice(0, remaining);
      setImagesToAdd((prev) => [...prev, ...filesToAdd]);
      e.target.value = "";
    },
    [images, imagesToDelete, imagesToAdd, setImagesToAdd]
  );

  const visibleImages = useMemo(
    () => (images || []).filter((img) => !(imagesToDelete || []).includes(img)),
    [images, imagesToDelete]
  );

  return (
    <div>
      <div className="adimage-preview-list">
        {visibleImages.map((filename) => (
          <div key={filename} className="adimage-preview">
            <img
              src={`${API_URL}/uploads/ad_images/${filename}`}
              alt="ad"
              className="adimage-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/nophoto.jpg";
              }}
            />
            <button
              type="button"
              aria-label="Remover imagem"
              onClick={() => handleDelete(filename)}
              className="adimage-remove-btn"
              title="Remover"
            >
              ×
            </button>
          </div>
        ))}
        {(imagesToDelete || []).map((filename) => (
          <div
            key={filename}
            className="adimage-preview adimage-preview-deleting"
          >
            <img
              src={`${API_URL}/uploads/ad_images/${filename}`}
              alt="ad"
              className="adimage-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/nophoto.jpg";
              }}
            />
            <button
              type="button"
              aria-label="Desfazer remoção"
              onClick={() => handleUndoDelete(filename)}
              className="adimage-undo-btn"
              title="Desfazer remoção"
            >
              ↩
            </button>
          </div>
        ))}
        {(imagesToAdd || []).map((file, idx) => (
          <div key={file.name + idx} className="adimage-preview">
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="adimage-img"
            />
            <button
              type="button"
              aria-label="Remover imagem"
              onClick={() => handleRemoveStaged(idx)}
              className="adimage-remove-btn"
              title="Remover"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {visibleImages.length + (imagesToAdd?.length || 0) < 5 && (
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={loading}
          className="adimage-file-input"
        />
      )}
    </div>
  );
}

AdImageManager.propTypes = {
  adId: PropTypes.string,
  imagesToAdd: PropTypes.array.isRequired,
  setImagesToAdd: PropTypes.func.isRequired,
  imagesToDelete: PropTypes.array.isRequired,
  setImagesToDelete: PropTypes.func.isRequired,
};
