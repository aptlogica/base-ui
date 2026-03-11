import { useState, useCallback, useRef } from "react";

export function useUniqueTwoDigit() {
  const [usedNumbers, setUsedNumbers] = useState<Set<number>>(new Set());
  const availableNumbers = useRef<number[]>([]);
  const getRandomIndex = useCallback((max: number) => {
    if (max <= 0) return 0;
    const range = 0x100000000;
    const limit = Math.floor(range / max) * max;
    let value = 0;
    do {
      value = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (value >= limit);
    return value % max;
  }, []);

  // Initialize available numbers (10-99) if not already done
  if (availableNumbers.current.length === 0) {
    for (let i = 10; i <= 99; i++) {
      availableNumbers.current.push(i);
    }
  }

  const getNextNumber = useCallback(() => {
    // Filter out used numbers
    const unusedNumbers = availableNumbers.current.filter(num => !usedNumbers.has(num));
    
    if (unusedNumbers.length === 0) {
      // If all numbers are used, clear the used set and start over
      setUsedNumbers(new Set());
      return getRandomIndex(90) + 10; // Return random number
    }
    
    // Pick a random number from unused numbers
    const randomIndex = getRandomIndex(unusedNumbers.length);
    const randomNum = unusedNumbers[randomIndex];
    
    // Mark this number as used
    setUsedNumbers(prev => new Set([...prev, randomNum]));
    
    return randomNum;
  }, [usedNumbers]);

  const hasMore = usedNumbers.size < 90; // 90 possible numbers (10-99)

  const reset = useCallback(() => {
    setUsedNumbers(new Set());
  }, []);

  return { getNextNumber, hasMore, reset };
}
