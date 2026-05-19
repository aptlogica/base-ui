import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, within } from '@testing-library/react';
import {
  renderRatingPill,
  renderLongTextPill,
  renderDateTimePill,
  renderEmailPill,
  renderUserPill,
  renderDurationPill,
  renderAttachmentPill,
  renderCheckboxPill,
  renderCurrencyPill,
  renderPercentPill,
  renderDecimalPill,
  renderURLPill,
  renderPhoneNumberPill,
  renderYearPill,
  renderNumberPill,
  renderJSONPill,
  renderMultiSelectPill,
  renderSingleSelectPill,
  renderTextPill,
} from '../lookupRenderers';

const renderNode = (node: React.ReactNode) => render(<div>{node}</div>);

describe('lookupRenderers', () => {
  it('renders numeric and text pills', () => {
    const rating = renderNode(renderRatingPill({ value: 3, sourceColumn: {}, index: 0 }));
    const ratingQueries = within(rating.container);
    expect(ratingQueries.getByText('3')).toBeInTheDocument();
    expect(renderRatingPill({ value: 0, sourceColumn: {}, index: 0 })).toBeNull();

    const longText = renderNode(renderLongTextPill({ value: '<b>Hello World</b>', sourceColumn: {}, index: 0 }));
    const longTextQueries = within(longText.container);
    expect(longTextQueries.getByText('Hello World')).toBeInTheDocument();
    expect(longTextQueries.queryByText('...')).not.toBeInTheDocument();

    expect(renderTextPill({ value: 'Plain', sourceColumn: {}, index: 0 })).not.toBeNull();
  });

  it('renders date, duration, and boolean pills', () => {
    const date = renderNode(renderDateTimePill({ value: '2024-01-02', sourceColumn: {}, index: 0 }));
    expect(within(date.container).getByText(/Jan|2024/)).toBeInTheDocument();

    const duration = renderNode(renderDurationPill({ value: '3600', sourceColumn: { meta: { durationFormat: 'h:mm:ss' } }, index: 0 }));
    expect(within(duration.container).getByText('01:00:00')).toBeInTheDocument();

    const checkbox = renderNode(renderCheckboxPill({ value: true, sourceColumn: {}, index: 0 }));
    expect(within(checkbox.container).getByText('True')).toBeInTheDocument();

    const checkboxFalse = renderNode(renderCheckboxPill({ value: false, sourceColumn: {}, index: 0 }));
    expect(within(checkboxFalse.container).getByText('False')).toBeInTheDocument();

    const durationWithMs = renderNode(renderDurationPill({ value: '20.5', sourceColumn: { meta: { durationFormat: 'h:mm:ss.s' } }, index: 0 }));
    expect(within(durationWithMs.container).getByText('00:00:20.500')).toBeInTheDocument();
  });

  it('renders email, user, attachment, and link pills', () => {
    const email = renderNode(renderEmailPill({ value: 'a@b.com', sourceColumn: {}, index: 0 }));
    expect(within(email.container).getByText('a@b.com')).toBeInTheDocument();

    const user = renderNode(renderUserPill({ value: { name: 'Alice' }, sourceColumn: {}, index: 0 }));
    expect(within(user.container).getByText('Alice')).toBeInTheDocument();

    const attachment = renderNode(renderAttachmentPill({ value: [{ title: 'file.txt' }], sourceColumn: {}, index: 0 }));
    expect(within(attachment.container).getByText('file.txt')).toBeInTheDocument();

    const multiAttachment = renderNode(renderAttachmentPill({ value: [{ title: 'a.txt' }, { title: 'b.txt' }], sourceColumn: {}, index: 0 }));
    expect(within(multiAttachment.container).getByText(/a\.txt \(2\)/)).toBeInTheDocument();

    const url = renderNode(renderURLPill({ value: 'https://example.com', sourceColumn: {}, index: 0 }));
    expect(within(url.container).getByText('https://example.com')).toBeInTheDocument();

    const phone = renderNode(renderPhoneNumberPill({ value: '+1 111 222', sourceColumn: {}, index: 0 }));
    expect(within(phone.container).getByText('+1 111 222')).toBeInTheDocument();
  });

  it('renders numeric format pills', () => {
    const currency = renderNode(renderCurrencyPill({ value: 1234.5, sourceColumn: { meta: { currencyType: 'USD' } }, index: 0 }));
    expect(within(currency.container).getByText(/\$1,234\.50|USD/)).toBeInTheDocument();

    const percent = renderNode(renderPercentPill({ value: 12.5, sourceColumn: {}, index: 0 }));
    expect(within(percent.container).getByText('12.5%')).toBeInTheDocument();

    const decimal = renderNode(renderDecimalPill({ value: 1.234, sourceColumn: { meta: { precision: '1.00' } }, index: 0 }));
    expect(within(decimal.container).getByText('1.23')).toBeInTheDocument();

    const year = renderNode(renderYearPill({ value: 2024, sourceColumn: {}, index: 0 }));
    expect(within(year.container).getByText('2024')).toBeInTheDocument();

    const number = renderNode(renderNumberPill({ value: 1000, sourceColumn: {}, index: 0 }));
    expect(within(number.container).getByText('1,000')).toBeInTheDocument();
  });

  it('renders json and select pills', () => {
    const json = renderNode(renderJSONPill({ value: { a: 1 }, sourceColumn: {}, index: 0 }));
    expect(within(json.container).getByText(/"a"/)).toBeInTheDocument();

    const multi = renderNode(renderMultiSelectPill({
      value: ['Red', 'Blue', 'Green'],
      sourceColumn: { meta: { options: [{ option: 'Red', color: 'red' }] } },
      index: 0
    }));
    const multiQueries = within(multi.container);
    expect(multiQueries.getByText('Red')).toBeInTheDocument();
    expect(multiQueries.getByText('+1')).toBeInTheDocument();

    const single = renderNode(renderSingleSelectPill({
      value: 'Blue',
      sourceColumn: { meta: { options: [{ option: 'Blue', color: '#00f' }] } },
      index: 0
    }));
    expect(within(single.container).getByText('Blue')).toBeInTheDocument();
  });

  it('handles null and invalid values', () => {
    expect(renderDateTimePill({ value: null, sourceColumn: {}, index: 0 })).toBeNull();
    expect(renderCurrencyPill({ value: 'not-number', sourceColumn: {}, index: 0 })).toBeNull();
    expect(renderPercentPill({ value: 'abc', sourceColumn: {}, index: 0 })).toBeNull();
    expect(renderNumberPill({ value: 'abc', sourceColumn: {}, index: 0 })).toBeNull();
    expect(renderDecimalPill({ value: null, sourceColumn: {}, index: 0 })).toBeNull();
  });

  it('renders nested multiselect values', () => {
    const multi = renderNode(renderMultiSelectPill({
      value: [['Alpha', 'Beta'], [null, 'Gamma']],
      sourceColumn: { meta: { options: [] } },
      index: 0
    }));

    const multiQueries = within(multi.container);
    expect(multiQueries.getByText('Alpha')).toBeInTheDocument();
  });
});
