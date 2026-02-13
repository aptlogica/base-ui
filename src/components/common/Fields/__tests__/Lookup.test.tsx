import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Lookup } from '../Lookup';

const useLookupSourceColumnMock = vi.fn();
const normalizeFieldTypeMock = vi.fn();

const renderRatingPillMock = vi.fn();
const renderLongTextPillMock = vi.fn();
const renderDateTimePillMock = vi.fn();
const renderEmailPillMock = vi.fn();
const renderUserPillMock = vi.fn();
const renderDurationPillMock = vi.fn();
const renderAttachmentPillMock = vi.fn();
const renderCheckboxPillMock = vi.fn();
const renderCurrencyPillMock = vi.fn();
const renderPercentPillMock = vi.fn();
const renderDecimalPillMock = vi.fn();
const renderURLPillMock = vi.fn();
const renderPhoneNumberPillMock = vi.fn();
const renderYearPillMock = vi.fn();
const renderNumberPillMock = vi.fn();
const renderJSONPillMock = vi.fn();
const renderMultiSelectPillMock = vi.fn();
const renderSingleSelectPillMock = vi.fn();
const renderTextPillMock = vi.fn();

vi.mock('../../../../hooks/useLookupSourceColumn', () => ({
  useLookupSourceColumn: (id: string | undefined) => useLookupSourceColumnMock(id),
}));

vi.mock('../../../../utils/fieldType', () => ({
  normalizeFieldType: (uidt: string) => normalizeFieldTypeMock(uidt),
}));

vi.mock('../lookupRenderers', () => ({
  renderRatingPill: (...args: unknown[]) => renderRatingPillMock(...args),
  renderLongTextPill: (...args: unknown[]) => renderLongTextPillMock(...args),
  renderDateTimePill: (...args: unknown[]) => renderDateTimePillMock(...args),
  renderEmailPill: (...args: unknown[]) => renderEmailPillMock(...args),
  renderUserPill: (...args: unknown[]) => renderUserPillMock(...args),
  renderDurationPill: (...args: unknown[]) => renderDurationPillMock(...args),
  renderAttachmentPill: (...args: unknown[]) => renderAttachmentPillMock(...args),
  renderCheckboxPill: (...args: unknown[]) => renderCheckboxPillMock(...args),
  renderCurrencyPill: (...args: unknown[]) => renderCurrencyPillMock(...args),
  renderPercentPill: (...args: unknown[]) => renderPercentPillMock(...args),
  renderDecimalPill: (...args: unknown[]) => renderDecimalPillMock(...args),
  renderURLPill: (...args: unknown[]) => renderURLPillMock(...args),
  renderPhoneNumberPill: (...args: unknown[]) => renderPhoneNumberPillMock(...args),
  renderYearPill: (...args: unknown[]) => renderYearPillMock(...args),
  renderNumberPill: (...args: unknown[]) => renderNumberPillMock(...args),
  renderJSONPill: (...args: unknown[]) => renderJSONPillMock(...args),
  renderMultiSelectPill: (...args: unknown[]) => renderMultiSelectPillMock(...args),
  renderSingleSelectPill: (...args: unknown[]) => renderSingleSelectPillMock(...args),
  renderTextPill: (...args: unknown[]) => renderTextPillMock(...args),
}));

const allRendererMocks = [
  renderRatingPillMock,
  renderLongTextPillMock,
  renderDateTimePillMock,
  renderEmailPillMock,
  renderUserPillMock,
  renderDurationPillMock,
  renderAttachmentPillMock,
  renderCheckboxPillMock,
  renderCurrencyPillMock,
  renderPercentPillMock,
  renderDecimalPillMock,
  renderURLPillMock,
  renderPhoneNumberPillMock,
  renderYearPillMock,
  renderNumberPillMock,
  renderJSONPillMock,
  renderMultiSelectPillMock,
  renderSingleSelectPillMock,
  renderTextPillMock,
];

const setOffsetWidth = (value: number) => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => value,
  });
};

describe('Lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOffsetWidth(600);

    useLookupSourceColumnMock.mockReturnValue({
      data: { uidt: 'text' },
      isLoading: false,
    });

    normalizeFieldTypeMock.mockImplementation((uidt: string) => uidt);

    allRendererMocks.forEach((mockFn) => {
      mockFn.mockImplementation(({ value, index }: { value: unknown; index: number }) => (
        <span key={index}>{String(value)}</span>
      ));
    });
  });

  it('renders nothing when value is null', () => {
    const { container } = render(<Lookup value={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders label, required marker, helper text and calls hook with meta lookup id', () => {
    useLookupSourceColumnMock.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(
      <Lookup
        label="Lookup Field"
        required={true}
        helperText="Select values"
        icon="I"
        value={['Alpha']}
        field={{ meta: JSON.stringify({ lookup_column_id: 'col-123' }) }}
      />
    );

    expect(useLookupSourceColumnMock).toHaveBeenCalledWith('col-123');
    expect(screen.getByText('Lookup Field')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('Select values')).toBeInTheDocument();
    expect(screen.getByText('I')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(renderTextPillMock).toHaveBeenCalled();
  });

  it('shows loading pill while source column is loading', () => {
    useLookupSourceColumnMock.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<Lookup value={['Alpha']} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('opens dropdown, filters hidden items and closes on outside click', () => {
    setOffsetWidth(160);

    render(<Lookup value={['One', 'Two', 'Three']} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'zzz' } });
    expect(screen.getByText('No matching values')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('uses mapped renderer for known field type and falls back to text renderer', () => {
    useLookupSourceColumnMock.mockReturnValue({
      data: { uidt: 'rating' },
      isLoading: false,
    });
    render(<Lookup value={[5]} />);
    expect(renderRatingPillMock).toHaveBeenCalledTimes(1);

    useLookupSourceColumnMock.mockReturnValue({
      data: { uidt: 'unknown-type' },
      isLoading: false,
    });
    render(<Lookup value={['fallback']} />);
    expect(renderTextPillMock).toHaveBeenCalled();
  });
});
