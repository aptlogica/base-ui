import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Percent } from '../Percent';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Percent: () => <div data-testid="percentage-icon" />,
}));

describe('Percent Component', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render with default props', () => {
            const { container } = render(
                <Percent value={null} onChange={mockOnChange} />
            );
            const field = container.querySelector('.field-component');
            expect(field).toBeInTheDocument();
        });

        it('should display current value', () => {
            render(<Percent value={75.5} onChange={mockOnChange} />);
            expect(screen.getByText('75.5')).toBeInTheDocument();
        });

        it('should display placeholder when value is null', () => {
            render(
                <Percent value={null} onChange={mockOnChange} placeholder="Enter %" />
            );
            expect(screen.getByText('Enter %')).toBeInTheDocument();
        });

        it('should render helper text when allowEdit is true', () => {
            render(
                <Percent
                    value={null}
                    onChange={mockOnChange}
                    helperText="Helper message"
                    allowEdit={true}
                />
            );
            expect(screen.getByText('Helper message')).toBeInTheDocument();
        });

        it('should not render helper text when allowEdit is false', () => {
            render(
                <Percent
                    value={null}
                    onChange={mockOnChange}
                    helperText="Helper message"
                    allowEdit={false}
                />
            );
            expect(screen.queryByText('Helper message')).not.toBeInTheDocument();
        });
    });

    describe('Edit Mode Interaction', () => {
        it('should enter edit mode on single click by default (allowEdit=true)', async () => {
            render(<Percent value={50} onChange={mockOnChange} allowEdit={true} />);

            const displayValue = screen.getByText('50');
            fireEvent.click(displayValue);

            const input = await screen.findByRole('textbox');
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue('50');
        });

        it('should enter edit mode on double click when allowEdit is false', async () => {
            render(<Percent value={50} onChange={mockOnChange} allowEdit={false} />);

            const displayValue = screen.getByText('50');

            // Simulate double click using fireEvent since useClickHandler uses a timer
            fireEvent.click(displayValue);
            fireEvent.click(displayValue);

            const input = await screen.findByRole('textbox');
            expect(input).toBeInTheDocument();
        });

        it('should not enter edit mode when disabled', () => {
            render(<Percent value={50} onChange={mockOnChange} disabled={true} />);

            const displayValue = screen.getByText('50');
            fireEvent.click(displayValue);

            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });

        it('should not enter edit mode when readOnly', () => {
            render(<Percent value={50} onChange={mockOnChange} readOnly={true} />);

            const displayValue = screen.getByText('50');
            fireEvent.click(displayValue);

            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });
    });

    describe('Input Behavior', () => {
        it('should filter non-numeric characters except dots and dashes', async () => {
            const { container } = render(<Percent value={null} onChange={mockOnChange} />);

            const display = container.querySelector('.field-component');
            fireEvent.click(display!);

            const input = await screen.findByRole('textbox');
            // "a1b.2c-d" -> "1.2-"
            await userEvent.type(input, 'a1b.2c-d');

            expect(input).toHaveValue('1.2-');
        });

        it('should focus and select text when entering edit mode', async () => {
            render(<Percent value={12.3} onChange={mockOnChange} />);

            const display = screen.getByText('12.3');
            fireEvent.click(display);

            const input = await screen.findByRole('textbox');
            expect(document.activeElement).toBe(input);

            // The select() call happens in a useEffect, so we wait for it to be applied
            await waitFor(() => {
                expect(input.selectionStart).toBe(0);
                expect(input.selectionEnd).toBe(input.value.length);
            });
        });
    });

    describe('Blur and Value Synchronization', () => {
        it('should trigger onChange with rounded value (1 decimal) on blur', async () => {
            render(<Percent value={10} onChange={mockOnChange} />);

            fireEvent.click(screen.getByText('10'));
            const input = await screen.findByRole('textbox');

            await userEvent.clear(input);
            await userEvent.type(input, '15.678');
            fireEvent.blur(input);

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith(15.7);
            });
        });

        it('should set value to null when input is empty on blur', async () => {
            render(<Percent value={10} onChange={mockOnChange} />);

            fireEvent.click(screen.getByText('10'));
            const input = await screen.findByRole('textbox');

            await userEvent.clear(input);
            fireEvent.blur(input);

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith(null);
            });
        });

        it('should reset to previous valid value if input is > 100', async () => {
            render(<Percent value={50} onChange={mockOnChange} />);

            fireEvent.click(screen.getByText('50'));
            const input = await screen.findByRole('textbox');

            await userEvent.clear(input);
            await userEvent.type(input, '101');
            fireEvent.blur(input);

            // In Percent.tsx, it resets to prevValueRef.current if out of 0-100 range
            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith(50);
            });
            // Component should show the reset value back in display mode
            expect(screen.getByText('50')).toBeInTheDocument();
        });

        it('should reset to previous valid value if input is < 0', async () => {
            render(<Percent value={50} onChange={mockOnChange} />);

            fireEvent.click(screen.getByText('50'));
            const input = await screen.findByRole('textbox');

            await userEvent.clear(input);
            await userEvent.type(input, '-5');
            fireEvent.blur(input);

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith(50);
            });
        });

        it('should reset to null if input becomes empty due to filtering', async () => {
            const { container } = render(<Percent value={null} onChange={mockOnChange} />);

            const display = container.querySelector('.field-component');
            fireEvent.click(display!);

            const input = await screen.findByRole('textbox');
            // Typing 'abc' will cause it to be empty string due to regex filter in handleChange
            await userEvent.type(input, 'abc');
            fireEvent.blur(input);

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith(null);
            });
        });

        it('should not trigger onChange if value did not change', async () => {
            render(<Percent value={50} onChange={mockOnChange} />);

            fireEvent.click(screen.getByText('50'));
            const input = await screen.findByRole('textbox');

            fireEvent.blur(input);

            await new Promise(resolve => setTimeout(resolve, 50));
            expect(mockOnChange).not.toHaveBeenCalled();
        });
    });

    describe('Progress Bar Mode', () => {
        const config = { displayAsProgress: true, progressColor: 'orange' };

        it('should render progress bar container', () => {
            const { container } = render(
                <Percent value={60} onChange={mockOnChange} config={config} />
            );

            const progressBar = container.querySelector('.bg-orange-500');
            expect(progressBar).toBeInTheDocument();
            expect(progressBar).toHaveStyle('width: 60%');
        });

        it('should enter edit mode on double click in progress mode', async () => {
            const { container } = render(
                <Percent value={60} onChange={mockOnChange} config={config} />
            );

            const clickableArea = container.firstChild;
            fireEvent.doubleClick(clickableArea!);

            const input = await screen.findByRole('textbox');
            expect(input).toBeInTheDocument();
        });

        it('should clamp progress between 0 and 100', () => {
            const { rerender, container } = render(
                <Percent value={150} onChange={mockOnChange} config={config} />
            );

            let progressBar = container.querySelector('.bg-orange-500');
            expect(progressBar).toHaveStyle('width: 100%');

            rerender(<Percent value={-50} onChange={mockOnChange} config={config} />);
            progressBar = container.querySelector('.bg-orange-500');
            expect(progressBar).toHaveStyle('width: 0%');
        });

        it('should use default progress color if mapping fails', () => {
            const { container } = render(
                <Percent value={50} onChange={mockOnChange} config={{ displayAsProgress: true, progressColor: 'unknown' as any }} />
            );

            const progressBar = container.querySelector(String.raw`.bg-\[var\(--color-utility-brand-500\)\]`);
            expect(progressBar).toBeInTheDocument();
        });
    });

    describe('External Props Synchronization', () => {
        it('should update local value when external value changes', async () => {
            const { rerender } = render(<Percent value={10} onChange={mockOnChange} />);
            expect(screen.getByText('10')).toBeInTheDocument();

            rerender(<Percent value={20} onChange={mockOnChange} />);
            await waitFor(() => {
                expect(screen.getByText('20')).toBeInTheDocument();
            });
        });

        it('should use defaultValue if value is null', () => {
            render(
                <Percent
                    value={null}
                    onChange={mockOnChange}
                    config={{ defaultValue: 42 }}
                />
            );
            expect(screen.getByText('42')).toBeInTheDocument();
        });
    });

    describe('Miscellaneous', () => {
        it('should render border class when isBorder is true', () => {
            const { container } = render(
                <Percent value={null} onChange={mockOnChange} isBorder={true} />
            );
            expect(container.firstChild).toHaveClass('field-component-border');
        });

        it('should show error red border on validation error (during editing)', async () => {
            render(<Percent value={50} onChange={mockOnChange} required={true} />);

            fireEvent.click(screen.getByText('50'));
            const input = await screen.findByRole('textbox');

            await userEvent.clear(input);
            // validate function in Percent.tsx returns string if required and empty
            // handleChange calls validate and setShowError(true)

            await waitFor(() => {
                expect(input).toHaveClass('border-red-500');
            });
        });

        it('should apply custom className', () => {
            const { container } = render(
                <Percent value={10} onChange={mockOnChange} className="custom-test-class" />
            );
            expect(container.firstChild).toHaveClass('custom-test-class');
        });
    });
});
