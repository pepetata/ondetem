import { describe, it, expect } from "vitest";
import notificationReducer, {
  setNotification,
} from "../../src/redux/notificationSlice";

describe("notificationSlice", () => {
  const initialState = {
    type: "",
    message: "",
  };

  it("should return the initial state", () => {
    expect(notificationReducer(undefined, { type: "unknown" })).toEqual(
      initialState
    );
  });

  it("should handle setNotification with complete payload", () => {
    const action = setNotification({
      type: "success",
      message: "Operation completed successfully",
    });

    const expectedState = {
      type: "success",
      message: "Operation completed successfully",
    };

    expect(notificationReducer(initialState, action)).toEqual(expectedState);
  });

  it("should handle setNotification with partial payload (only message)", () => {
    const action = setNotification({
      message: "Only message provided",
    });

    const expectedState = {
      type: "",
      message: "Only message provided",
    };

    expect(notificationReducer(initialState, action)).toEqual(expectedState);
  });

  it("should handle setNotification with partial payload (only type)", () => {
    const action = setNotification({
      type: "error",
    });

    const expectedState = {
      type: "error",
      message: "",
    };

    expect(notificationReducer(initialState, action)).toEqual(expectedState);
  });

  it("should reset to defaults when setting notification", () => {
    const currentState = {
      type: "warning",
      message: "Previous warning",
    };

    const action = setNotification({
      type: "success",
      message: "New success message",
    });

    const expectedState = {
      type: "success",
      message: "New success message",
    };

    expect(notificationReducer(currentState, action)).toEqual(expectedState);
  });

  it("should clear notification when empty payload provided", () => {
    const currentState = {
      type: "error",
      message: "Some error message",
    };

    const action = setNotification({});

    const expectedState = {
      type: "",
      message: "",
    };

    expect(notificationReducer(currentState, action)).toEqual(expectedState);
  });

  it("should handle different notification types", () => {
    const types = ["success", "error", "warning", "critical", "info"];

    types.forEach((type) => {
      const action = setNotification({
        type,
        message: `Test ${type} message`,
      });

      const result = notificationReducer(initialState, action);

      expect(result.type).toBe(type);
      expect(result.message).toBe(`Test ${type} message`);
    });
  });

  it("should handle very long messages", () => {
    const longMessage =
      "This is a very long notification message that might be used for detailed error descriptions or comprehensive success confirmations that provide additional context to the user.";

    const action = setNotification({
      type: "info",
      message: longMessage,
    });

    const result = notificationReducer(initialState, action);

    expect(result.type).toBe("info");
    expect(result.message).toBe(longMessage);
  });

  it("should handle special characters in messages", () => {
    const specialMessage =
      "Error: User@domain.com não pôde ser criado! (código: 404)";

    const action = setNotification({
      type: "error",
      message: specialMessage,
    });

    const result = notificationReducer(initialState, action);

    expect(result.type).toBe("error");
    expect(result.message).toBe(specialMessage);
  });

  it("should maintain immutability", () => {
    const currentState = {
      type: "warning",
      message: "Original message",
    };

    const action = setNotification({
      type: "success",
      message: "New message",
    });

    const newState = notificationReducer(currentState, action);

    // Original state should not be mutated
    expect(currentState).toEqual({
      type: "warning",
      message: "Original message",
    });

    // New state should be different
    expect(newState).toEqual({
      type: "success",
      message: "New message",
    });

    expect(newState).not.toBe(currentState);
  });
});
