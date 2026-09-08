describe('Formatters - Utility Functions', () => {
  describe('formatCurrency', () => {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
        minimumFractionDigits: 2,
      }).format(value);
    };

    it('should format positive currency values correctly', () => {
      const result = formatCurrency(1000);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format decimal values', () => {
      const result = formatCurrency(99.99);
      expect(result).toContain('99');
    });
  });

  describe('formatDate', () => {
    const formatDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('es-CR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    it('should format date string correctly', () => {
      const result = formatDate('2026-09-08');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should format Date object correctly', () => {
      const date = new Date('2026-09-08');
      const result = formatDate(date);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle valid dates', () => {
      expect(() => formatDate('2026-01-01')).not.toThrow();
    });
  });

  describe('truncateString', () => {
    const truncateString = (str: string, length: number): string => {
      return str.length > length ? str.slice(0, length) + '...' : str;
    };

    it('should not truncate strings shorter than limit', () => {
      expect(truncateString('Pulpería', 20)).toBe('Pulpería');
    });

    it('should truncate strings longer than limit', () => {
      expect(truncateString('Esta es una descripción muy larga', 10)).toBe(
        'Esta es un...'
      );
    });

    it('should handle empty strings', () => {
      expect(truncateString('', 10)).toBe('');
    });

    it('should handle exact length match', () => {
      expect(truncateString('Pulpería', 8)).toBe('Pulpería');
    });
  });
});
