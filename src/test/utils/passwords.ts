type PasswordOptions = {
  length?: number;
  includeUpper?: boolean;
  includeLower?: boolean;
  includeNumber?: boolean;
  includeSymbol?: boolean;
};

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUM = '0123456789';
const SYMBOL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export const makePassword = ({
  length = 12,
  includeUpper = true,
  includeLower = true,
  includeNumber = true,
  includeSymbol = true,
}: PasswordOptions = {}) => {
  const pools = [
    includeUpper ? UPPER : '',
    includeLower ? LOWER : '',
    includeNumber ? NUM : '',
    includeSymbol ? SYMBOL : '',
  ].filter(Boolean);

  const pool = pools.join('');
  if (!pool) return '';

  // Ensure at least one from each requested pool, then fill to length.
  const requiredChars: string[] = [];
  if (includeUpper) requiredChars.push(UPPER[0]);
  if (includeLower) requiredChars.push(LOWER[0]);
  if (includeNumber) requiredChars.push(NUM[0]);
  if (includeSymbol) requiredChars.push(SYMBOL[0]);

  const remaining = Math.max(0, length - requiredChars.length);
  const filler = Array.from({ length: remaining }, (_, i) => pool[i % pool.length]);
  return [...requiredChars, ...filler].join('');
};
