import { useState } from "react";
import "./DevErrorButton.scss";

const DevErrorButton = () => {
  const [shouldError, setShouldError] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (shouldError) {
    // This will trigger the ErrorBoundary
    throw new Error("🧪 Dev Test: ErrorBoundary triggered!");
  }

  return (
    <button
      className="dev-error-button"
      onClick={() => setShouldError(true)}
      title="Trigger ErrorBoundary (Development Only)"
    >
      🚨 Test Error
    </button>
  );
};

export default DevErrorButton;
