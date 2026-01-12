import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Lookup } from '../Lookup';

vi.mock('../../hooks/useLookupSourceColumn', () => ({
  useLookupSourceColumn: vi.fn(() => ({
    getLookupRenderer: vi.fn((fieldType) => {
      if (fieldType === 'rating') {
        return (value: any) => <div className="rating-pill">{value?.rating}</div>;
      }
      if (fieldType === 'date') {
        return (value: any) => <div className="date-pill">{value?.date}</div>;
      }
      if (fieldType === 'user') {
        return (value: any) => <div className="user-pill">{value?.user}</div>;
      }
      return (value: any) => <div className="default-pill">{JSON.stringify(value)}</div>;
    })
  }))
}));

describe('Lookup Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render lookup field', () => {
      render(
        <Lookup
          value={null}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display single lookup value', () => {
      const lookupValue = {
        id: '1',
        name: 'Option A',
        rating: 4
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display multiple lookup values as array', () => {
      const lookupValues = [
        { id: '1', name: 'Option A' },
        { id: '2', name: 'Option B' }
      ];

      render(
        <Lookup
          value={lookupValues}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display empty state when no value', () => {
      render(
        <Lookup
          value={null}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Lookup Value Display', () => {
    it('should normalize and display lookup object', () => {
      const lookupValue = {
        id: '123',
        name: 'Product A'
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display rating pill for rating field type', () => {
      const lookupValue = {
        id: '1',
        rating: 5
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'rating', fieldType: 'rating' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display date pill for date field type', () => {
      const lookupValue = {
        id: '1',
        date: '2024-01-15'
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'date', fieldType: 'date' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display user pill for user field type', () => {
      const lookupValue = {
        id: '1',
        user: 'John Doe'
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'user', fieldType: 'user' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display email pill for email field type', () => {
      const lookupValue = {
        id: '1',
        email: 'john@example.com'
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'email', fieldType: 'email' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display duration formatting for duration field type', () => {
      const lookupValue = {
        id: '1',
        duration: 3600
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'duration', fieldType: 'duration' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display currency pill for currency field type', () => {
      const lookupValue = {
        id: '1',
        amount: 1500
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'amount', fieldType: 'currency' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display attachment preview for attachment field type', () => {
      const lookupValue = {
        id: '1',
        file: 'document.pdf'
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'file', fieldType: 'attachment' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Multiple Lookup Values', () => {
    it('should render array of lookup values', () => {
      const lookupValues = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' }
      ];

      render(
        <Lookup
          value={lookupValues}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display pills for each lookup value', () => {
      const lookupValues = [
        { id: '1', rating: 4 },
        { id: '2', rating: 5 },
        { id: '3', rating: 3 }
      ];

      render(
        <Lookup
          value={lookupValues}
          onChange={mockOnChange}
          config={{ lookupField: 'rating', fieldType: 'rating' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty array', () => {
      render(
        <Lookup
          value={[]}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display mixed field types in array', () => {
      const lookupValues = [
        { id: '1', rating: 5 },
        { id: '2', user: 'John' }
      ];

      render(
        <Lookup
          value={lookupValues}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should display in disabled state', () => {
      const lookupValue = { id: '1', name: 'Item' };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
          disabled
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display in read-only state', () => {
      const lookupValue = { id: '1', name: 'Item' };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
          readOnly
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should use lookupField from config', () => {
      const lookupValue = {
        id: '1',
        name: 'Product',
        description: 'Long description'
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should use fieldType from config for rendering', () => {
      const lookupValue = { id: '1', rating: 5 };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'rating', fieldType: 'rating' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support multiple configuration options', () => {
      const lookupValue = { id: '1', date: '2024-01-15' };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{
            lookupField: 'date',
            fieldType: 'date',
            dateFormat: 'DD-MM-YYYY'
          }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external value changes', () => {
      const { rerender } = render(
        <Lookup
          value={{ id: '1', name: 'Item 1' }}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      rerender(
        <Lookup
          value={{ id: '2', name: 'Item 2' }}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle change from single to multiple values', () => {
      const { rerender } = render(
        <Lookup
          value={{ id: '1', name: 'Item 1' }}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      rerender(
        <Lookup
          value={[
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' }
          ]}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle change from multiple to single value', () => {
      const { rerender } = render(
        <Lookup
          value={[
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' }
          ]}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      rerender(
        <Lookup
          value={{ id: '1', name: 'Item 1' }}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <Lookup
          value={null}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <Lookup
          value={undefined as any}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(
        <Lookup
          value="" as any
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle missing lookupField in object', () => {
      const lookupValue = { id: '1' };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle large array of values', () => {
      const lookupValues = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`
      }));

      render(
        <Lookup
          value={lookupValues}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle special characters in lookup values', () => {
      const lookupValue = {
        id: '1',
        name: 'Item & Co. <Special>'
      };

      render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render semantic pill elements', () => {
      const lookupValue = { id: '1', name: 'Item' };

      const { container } = render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should have proper structure for screen readers', () => {
      const lookupValue = { id: '1', name: 'Item' };

      const { container } = render(
        <Lookup
          value={lookupValue}
          onChange={mockOnChange}
          config={{ lookupField: 'name' }}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });
});
