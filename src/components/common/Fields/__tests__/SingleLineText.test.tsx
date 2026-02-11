import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SingleLineText } from "../SingleLineText";

vi.mock("lucide-react", () => ({
  Info: () => <svg data-testid="error-icon" />,
}));

vi.mock("../../../utils/helpers", async () => {
  const actual = await vi.importActual("../../../utils/helpers");
  return {
    ...actual,
    useClickHandler: (single: () => void, double: () => void) => {
      let clickTimeout: NodeJS.Timeout | null = null;
      return () => {
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
          double();
        } else {
          clickTimeout = setTimeout(() => {
            single();
            clickTimeout = null;
          }, 200);
        }
      };
    },
  };
});

describe("SingleLineText Component", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Editing behavior", () => {
    it("should enter edit mode on click", async () => {
      const user = userEvent.setup();
      render(<SingleLineText value="Edit" onChange={mockOnChange} />);
      await user.click(screen.getByRole("button"));
      expect(await screen.findByRole("textbox")).toBeInTheDocument();
    });

    it("should enter edit mode on double click when allowEdit is false", async () => {
      const user = userEvent.setup();
      render(
        <SingleLineText
          value="Edit"
          allowEdit={false}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole("button");
      await user.dblClick(button);

      expect(await screen.findByRole("textbox")).toBeInTheDocument();
    });

    it("should exit edit mode when readOnly becomes true", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SingleLineText value="Edit" onChange={mockOnChange} />
      );

      await user.click(screen.getByRole("button"));
      expect(await screen.findByRole("textbox")).toBeInTheDocument();

      rerender(
        <SingleLineText value="Edit" readOnly onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      });
    });
  });

  describe("Keyboard interaction", () => {
    it("should enter edit mode on Enter key", async () => {
      const user = userEvent.setup();
      render(<SingleLineText value="Edit" onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      button.focus();

      await user.keyboard("{Enter}");

      expect(await screen.findByRole("textbox")).toBeInTheDocument();
    });

    it("should not enter edit mode on Space key", async () => {
      const user = userEvent.setup();
      render(<SingleLineText value="Edit" onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      button.focus();

      await user.keyboard(" ");

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("should ignore key events when disabled", () => {
      render(
        <SingleLineText value="Edit" disabled onChange={mockOnChange} />
      );

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  describe("Value changes", () => {
    it("should update value on blur", async () => {
      const user = userEvent.setup();
      render(<SingleLineText value="Old" onChange={mockOnChange} />);
      await user.click(screen.getByRole("button"));

      const input = await screen.findByRole("textbox");
      fireEvent.change(input, { target: { value: "New" } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("New");
      });
    });

    it("should not call onChange when value does not change", async () => {
      const user = userEvent.setup();
      render(<SingleLineText value="Same" onChange={mockOnChange} />);
      await user.click(screen.getByRole("button"));

      const input = await screen.findByRole("textbox");
      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should update value on typing when updateOnType is true", async () => {
      const user = userEvent.setup();
      render(
        <SingleLineText value="" updateOnType onChange={mockOnChange} />
      );

      await user.click(screen.getByRole("button"));
      const input = await screen.findByRole("textbox");

      fireEvent.change(input, { target: { value: "A" } });

      expect(mockOnChange).toHaveBeenCalledWith("A");
    });

    it("should revert value on Escape key", async () => {
      const user = userEvent.setup();
      render(<SingleLineText value="Keep" onChange={mockOnChange} />);
      await user.click(screen.getByRole("button"));

      const input = await screen.findByRole("textbox");
      fireEvent.change(input, { target: { value: "Discard" } });
      fireEvent.keyDown(input, { key: "Escape" });

      expect(screen.getByText("Keep")).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("should show required error on blur", async () => {
      const user = userEvent.setup();
      render(
        <SingleLineText required value="" onChange={mockOnChange} />
      );

      await user.click(screen.getByRole("button"));
      const input = await screen.findByRole("textbox");
      fireEvent.blur(input);

      expect(
        screen.getByText("This field is required")
      ).toBeInTheDocument();
      expect(screen.getByTestId("error-icon")).toBeInTheDocument();
    });

    it("should show max length error", async () => {
      const user = userEvent.setup();
      render(
        <SingleLineText
          value=""
          config={{ maxLength: 3 }}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));
      const input = await screen.findByRole("textbox");

      fireEvent.change(input, { target: { value: "1234" } });
      fireEvent.blur(input);

      expect(
        screen.getByText(/Max 3 characters allowed/)
      ).toBeInTheDocument();
      expect(screen.getByTestId("error-icon")).toBeInTheDocument();
    });

    it("should not render error text when allowEdit is false", async () => {
      const user = userEvent.setup();
      render(
        <SingleLineText
          required
          allowEdit={false}
          value=""
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole("button");
      await user.dblClick(button);

      const input = await screen.findByRole("textbox");
      fireEvent.blur(input);

      expect(
        screen.queryByText("This field is required")
      ).not.toBeInTheDocument();
    });
  });

  describe("Config behavior", () => {
    it("should use defaultValue from config", () => {
      render(
        <SingleLineText
          onChange={mockOnChange}
          config={{ defaultValue: "Default" }}
        />
      );

      expect(screen.getByText("Default")).toBeInTheDocument();
    });

    it("should use placeholder from config", () => {
      render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          config={{ placeholder: "Config Placeholder" }}
        />
      );

      expect(
        screen.getByText("Config Placeholder")
      ).toBeInTheDocument();
    });
  });

  describe("Read-only behavior", () => {
    it("should not enter edit mode when readOnly", async () => {
      const user = userEvent.setup();
      render(
        <SingleLineText value="Edit" readOnly onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Edit"));

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("should update display when value prop changes", () => {
      const { rerender } = render(
        <SingleLineText value="Old" onChange={mockOnChange} />
      );

      rerender(<SingleLineText value="New" onChange={mockOnChange} />);

      expect(screen.getByText("New")).toBeInTheDocument();
    });
  });

  describe("Helper text", () => {
    it("should render helper text when allowEdit is true", () => {
      render(
        <SingleLineText
          value="Edit"
          helperText="Helper message"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Helper message")).toBeInTheDocument();
    });
  });

  describe("Disabled state", () => {
    it("should not enter edit mode when disabled", async () => {
      const user = userEvent.setup();
      render(
        <SingleLineText value="Edit" disabled onChange={mockOnChange} />
      );

      await user.click(screen.getByRole("button"));

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });
});
