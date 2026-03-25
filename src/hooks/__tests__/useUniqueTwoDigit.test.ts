import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUniqueTwoDigit } from '../useUniqueTwoDigit';

describe('useUniqueTwoDigit', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useUniqueTwoDigit());
    
    expect(result.current.hasMore).toBe(true);
    expect(typeof result.current.getNextNumber).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should generate numbers between 10 and 99', () => {
    const { result } = renderHook(() => useUniqueTwoDigit());
    
    let number: number = 0;
    act(() => {
      number = result.current.getNextNumber();
    });
    
    expect(number).toBeGreaterThanOrEqual(10);
    expect(number).toBeLessThanOrEqual(99);
  });

  it('should generate unique numbers', () => {
    const { result } = renderHook(() => useUniqueTwoDigit());
    const generatedNumbers: number[] = [];
    
    // Generate 10 numbers one at a time to ensure state updates
    for (let i = 0; i < 10; i++) {
      act(() => {
        const number = result.current.getNextNumber();
        generatedNumbers.push(number);
      });
    }
    
    // All 10 numbers should be unique
    const uniqueNumbers = new Set(generatedNumbers);
    expect(uniqueNumbers.size).toBe(generatedNumbers.length);
    expect(generatedNumbers.length).toBe(10);
  });

  it('should track hasMore correctly after generating many numbers', () => {
    const { result } = renderHook(() => useUniqueTwoDigit());
    
    expect(result.current.hasMore).toBe(true);
    
    // Generate 50 numbers - should still have more
    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.getNextNumber();
      }
    });
    
    expect(result.current.hasMore).toBe(true);
  });

  it('should reset and allow generating numbers again', () => {
    const { result } = renderHook(() => useUniqueTwoDigit());
    
    let firstNumber: number = 0;
    act(() => {
      firstNumber = result.current.getNextNumber();
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.hasMore).toBe(true);
    
    // Should be able to generate numbers after reset
    let secondNumber: number = 0;
    act(() => {
      secondNumber = result.current.getNextNumber();
    });
    
    expect(secondNumber).toBeGreaterThanOrEqual(10);
    expect(secondNumber).toBeLessThanOrEqual(99);
  });

  it('should recycle numbers after all are used', () => {
    const { result } = renderHook(() => useUniqueTwoDigit());
    
    // Generate all 90 numbers
    act(() => {
      for (let i = 0; i < 90; i++) {
        result.current.getNextNumber();
      }
    });
    
    // After generating all 90, hasMore should be false
    // but generating one more should recycle and return a valid number
    let recycledNumber: number = 0;
    act(() => {
      recycledNumber = result.current.getNextNumber();
    });
    
    expect(recycledNumber).toBeGreaterThanOrEqual(10);
    expect(recycledNumber).toBeLessThanOrEqual(99);
    // After recycling, hasMore should be true again
    expect(result.current.hasMore).toBe(true);
  });

  it('should maintain state across multiple calls', () => {
    const { result } = renderHook(() => useUniqueTwoDigit());
    const numbers: number[] = [];

    // Call getNextNumber in separate act() blocks so state updates flush between calls
    act(() => {
      numbers.push(result.current.getNextNumber());
    });
    act(() => {
      numbers.push(result.current.getNextNumber());
    });
    act(() => {
      numbers.push(result.current.getNextNumber());
    });

    // All numbers should be unique
    expect(new Set(numbers).size).toBe(3);
  });

  it('uses crypto.getRandomValues for randomness', () => {
    const getRandomValues = vi.fn((arr: Uint32Array) => {
      arr[0] = 0;
      return arr;
    });
    vi.stubGlobal('crypto', { getRandomValues });

    const { result } = renderHook(() => useUniqueTwoDigit());
    act(() => {
      result.current.getNextNumber();
    });

    expect(getRandomValues).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
