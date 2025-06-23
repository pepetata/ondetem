import { useEffect, useState } from "react";
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

  // Remove staged file
  const handleRemoveStaged = (idx) => {
    setImagesToAdd((prev) => prev.filter((_, i) => i !== idx));
  };

  // Mark uploaded image for deletion
  const handleDelete = (filename) => {
    setImagesToDelete((prev) => [...prev, filename]);
  };

  // Unmark image for deletion
  const handleUndoDelete = (filename) => {
    setImagesToDelete((prev) => prev.filter((f) => f !== filename));
  };

  // Add new files
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Only allow up to 5 total (existing - to delete + to add)
    const currentCount =
      (images?.length || 0) -
      (imagesToDelete?.length || 0) +
      (imagesToAdd?.length || 0);
    const remaining = 5 - currentCount;
    const filesToAdd = files.slice(0, remaining);
    setImagesToAdd((prev) => [...prev, ...filesToAdd]);
    e.target.value = "";
  };

  // Images to show: existing images minus those marked for deletion
  const visibleImages = (images || []).filter(
    (img) => !(imagesToDelete || []).includes(img)
  );

  return (
    <div>
      <div className="adimage-preview-list">
        {/* Show existing images (not marked for deletion) */}
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
              onClick={() => handleDelete(filename)}
              className="adimage-remove-btn"
              title="Remover"
            >
              ×
            </button>
          </div>
        ))}
        {/* Show images marked for deletion (faded, with undo) */}
        {(imagesToDelete || []).map((filename) => (
          <div
            key={filename}
            className="adimage-preview adimage-preview-deleting"
          >
            <img
              src={`/uploads/ad_images/${filename}`}
              alt="ad"
              className="adimage-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/nophoto.jpg";
              }}
            />
            <button
              type="button"
              onClick={() => handleUndoDelete(filename)}
              className="adimage-undo-btn"
              title="Desfazer remoção"
            >
              ↩
            </button>
          </div>
        ))}
        {/* Show staged new images */}
        {(imagesToAdd || []).map((file, idx) => (
          <div key={file.name + idx} className="adimage-preview">
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="adimage-img"
            />
            <button
              type="button"
              onClick={() => handleRemoveStaged(idx)}
              className="adimage-remove-btn"
              title="Remover"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {/* Only allow file input if total images < 5 */}
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
  adId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  imagesToAdd: PropTypes.array.isRequired,
  setImagesToAdd: PropTypes.func.isRequired,
  imagesToDelete: PropTypes.array.isRequired,
  setImagesToDelete: PropTypes.func.isRequired,
};
