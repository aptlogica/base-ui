import { describe, it, expect } from 'vitest';
import {
  PRECISION_OPTIONS,
  CURRENCY_OPTIONS,
  PROGRESS_COLOR_OPTIONS,
  DURATION_FORMAT_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
} from '../componentOptions';

describe('componentOptions', () => {
  describe('PRECISION_OPTIONS', () => {
    it('should have correct number of precision options', () => {
      expect(PRECISION_OPTIONS).toHaveLength(7);
    });

    it('should have valid precision formats', () => {
      expect(PRECISION_OPTIONS[0]).toEqual({ label: '1', value: '1' });
      expect(PRECISION_OPTIONS[6]).toEqual({ label: '1.000000', value: '1.000000' });
    });

    it('should have increasing decimal places', () => {
      PRECISION_OPTIONS.forEach((option, index) => {
        const decimals = (option.value.split('.')[1] || '').length;
        expect(decimals).toBe(index);
      });
    });
  });

  describe('CURRENCY_OPTIONS', () => {
    it('should have major currency options', () => {
      expect(CURRENCY_OPTIONS).toHaveLength(10);
    });

    it('should include USD', () => {
      const usd = CURRENCY_OPTIONS.find(c => c.value === 'USD');
      expect(usd).toEqual({ label: 'USD ($)', value: 'USD' });
    });

    it('should include EUR', () => {
      const eur = CURRENCY_OPTIONS.find(c => c.value === 'EUR');
      expect(eur).toEqual({ label: 'EUR (€)', value: 'EUR' });
    });

    it('should have valid currency codes', () => {
      const validCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
      CURRENCY_OPTIONS.forEach(option => {
        expect(validCodes).toContain(option.value);
      });
    });
  });

  describe('PROGRESS_COLOR_OPTIONS', () => {
    it('should have color options', () => {
      expect(PROGRESS_COLOR_OPTIONS).toHaveLength(9);
    });

    it('should include basic colors', () => {
      const colors = PROGRESS_COLOR_OPTIONS.map(c => c.value);
      expect(colors).toContain('blue');
      expect(colors).toContain('green');
      expect(colors).toContain('red');
    });

    it('should have matching label and value', () => {
      PROGRESS_COLOR_OPTIONS.forEach(option => {
        expect(option.label.toLowerCase()).toBe(option.value);
      });
    });
  });

  describe('DURATION_FORMAT_OPTIONS', () => {
    it('should have duration format options', () => {
      expect(DURATION_FORMAT_OPTIONS).toHaveLength(5);
    });

    it('should start with h:mm', () => {
      expect(DURATION_FORMAT_OPTIONS[0]).toEqual({ label: 'h:mm', value: 'h:mm' });
    });

    it('should include seconds formats', () => {
      const formats = DURATION_FORMAT_OPTIONS.map(f => f.value);
      expect(formats).toContain('h:mm:ss');
      expect(formats).toContain('h:mm:ss.s');
      expect(formats).toContain('h:mm:ss.sss');
    });
  });

  describe('DATE_FORMAT_OPTIONS', () => {
    it('should have date format options', () => {
      expect(DATE_FORMAT_OPTIONS).toHaveLength(7);
    });

    it('should include YYYY-MM-DD format', () => {
      expect(DATE_FORMAT_OPTIONS[0]).toEqual({ label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' });
    });

    it('should include various date formats', () => {
      const formats = DATE_FORMAT_OPTIONS.map(f => f.value);
      expect(formats).toContain('DD-MM-YYYY');
      expect(formats).toContain('MM-DD-YYYY');
      expect(formats).toContain('DD/MM/YYYY');
    });
  });

  describe('TIME_FORMAT_OPTIONS', () => {
    it('should have time format options', () => {
      expect(TIME_FORMAT_OPTIONS.length).toBeGreaterThan(0);
    });

    it('should include HH:mm format', () => {
      const formats = TIME_FORMAT_OPTIONS.map(f => f.value);
      expect(formats).toContain('HH:mm');
    });
  });
});
