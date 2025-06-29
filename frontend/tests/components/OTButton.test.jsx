import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import OTButton from "../../src/components/OTButton";

describe("OTButton Component", () => {
  it("renders button with children", () => {
    render(<OTButton>Test Button</OTButton>);

    expect(
      screen.getByRole("button", { name: "Test Button" })
    ).toBeInTheDocument();
  });

  it("renders with correct variant", () => {
    render(<OTButton variant="primary">Primary Button</OTButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("btn-primary");
  });

  it("renders with custom className", () => {
    render(<OTButton className="custom-class">Styled Button</OTButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("otbutton");
    expect(button).toHaveClass("custom-class");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<OTButton onClick={handleClick}>Clickable Button</OTButton>);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders with image when imgSrc is provided", () => {
    render(
      <OTButton imgSrc="/test-icon.png" imgAlt="Test Icon">
        Button with Icon
      </OTButton>
    );

    const button = screen.getByRole("button");
    const image = screen.getByAltText("Test Icon");

    expect(button).toBeInTheDocument();
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/test-icon.png");
  });

  it("renders image with empty alt when imgAlt is not provided", () => {
    render(<OTButton imgSrc="/test-icon.png">Button with Icon</OTButton>);

    const image = screen.getByRole("presentation");
    expect(image).toHaveAttribute("alt", "");
  });

  it("applies correct button type", () => {
    render(<OTButton type="submit">Submit Button</OTButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
  });

  it("defaults to button type when type is not provided", () => {
    render(<OTButton>Default Button</OTButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("handles disabled state", () => {
    render(<OTButton disabled>Disabled Button</OTButton>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("defaults disabled to false", () => {
    render(<OTButton>Enabled Button</OTButton>);

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  it("handles empty className gracefully", () => {
    render(<OTButton>No Class Button</OTButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("otbutton");
    expect(button.className).toContain("otbutton ");
  });

  it("renders with multiple children types", () => {
    render(
      <OTButton>
        <span>Text</span>
        <strong>Bold Text</strong>
      </OTButton>
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Bold Text")).toBeInTheDocument();
  });

  it("combines variant and custom className correctly", () => {
    render(
      <OTButton variant="success" className="my-custom-class">
        Combined Classes
      </OTButton>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("btn-success");
    expect(button).toHaveClass("otbutton");
    expect(button).toHaveClass("my-custom-class");
  });

  it("works with complex image and text combination", () => {
    render(
      <OTButton
        imgSrc="/icons/save.png"
        imgAlt="Save Icon"
        variant="primary"
        className="save-btn"
        type="submit"
      >
        Save Changes
      </OTButton>
    );

    const button = screen.getByRole("button");
    const image = screen.getByAltText("Save Icon");
    const text = screen.getByText("Save Changes");

    expect(button).toHaveClass("btn-primary", "otbutton", "save-btn");
    expect(button).toHaveAttribute("type", "submit");
    expect(image).toHaveAttribute("src", "/icons/save.png");
    expect(text).toBeInTheDocument();
  });
});
