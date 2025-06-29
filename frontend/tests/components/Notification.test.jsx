import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithProviders } from "../utils";
import Notification from "../../src/components/Notification";

describe("Notification Component", () => {
  it("renders nothing when no message", () => {
    const { container } = renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: null, type: null },
      },
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when message is empty string", () => {
    const { container } = renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "", type: "success" },
      },
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders basic notification with default styling", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Test message", type: null },
      },
    });

    const notification = screen.getByText("Test message");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("notification");
    expect(notification).not.toHaveClass("error", "warning", "success");
  });

  it("renders success notification with correct styling", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Success message", type: "success" },
      },
    });

    const notification = screen.getByText("Success message");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("notification", "success");
  });

  it("renders error notification with correct styling", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Error message", type: "error" },
      },
    });

    const notification = screen.getByText("Error message");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("notification", "error");
  });

  it("renders critical notification with error styling", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Critical error", type: "critical" },
      },
    });

    const notification = screen.getByText("Critical error");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("notification", "error");
  });

  it("renders warning notification with correct styling", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Warning message", type: "warning" },
      },
    });

    const notification = screen.getByText("Warning message");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("notification", "warning");
  });

  it("handles unknown notification type with default styling", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Unknown type", type: "unknown" },
      },
    });

    const notification = screen.getByText("Unknown type");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("notification");
    expect(notification).not.toHaveClass("error", "warning", "success");
  });

  it("renders complex messages with HTML-like content", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: {
          message: "User account has been updated successfully!",
          type: "success",
        },
      },
    });

    const notification = screen.getByText(
      "User account has been updated successfully!"
    );
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("notification", "success");
  });

  it("updates when notification state changes", () => {
    const { unmount } = renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "First message", type: "success" },
      },
    });

    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("First message")).toHaveClass(
      "notification",
      "success"
    );

    // Clean up first render
    unmount();

    // Render with different state
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Second message", type: "error" },
      },
    });

    expect(screen.queryByText("First message")).not.toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toHaveClass(
      "notification",
      "error"
    );
  });

  it("handles very long messages", () => {
    const longMessage =
      "This is a very long notification message that might span multiple lines and should still be rendered correctly in the notification component.";

    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: longMessage, type: "warning" },
      },
    });

    const notification = screen.getByText(longMessage);
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("notification", "warning");
  });
});
