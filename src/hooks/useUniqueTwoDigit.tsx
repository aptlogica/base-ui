// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useState, useCallback, useRef } from "react";

export function useUniqueTwoDigit() {
  const [usedNumbers, setUsedNumbers] = useState<Set<number>>(new Set());
  const availableNumbers = useRef<number[]>([]);
  const getRandomIndex = useCallback((max: number) => {
    if (max <= 0) return 0;
    // Use Fisher-Yates-like approach to avoid modulo bias
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    // Use the full 32-bit range and scale properly
    return Math.floor((randomBytes[0] / 0x100000000) * max);
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
