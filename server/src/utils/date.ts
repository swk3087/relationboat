export const startOfUtcDay = (value: Date): Date => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

export const parseDateOnly = (value: string): Date => {
  const match = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!match) throw new Error('Expected date format YYYY-MM-DD');
  return new Date(`${value}T00:00:00.000Z`);
};

export const canEditMemo = (memoDate: Date, now = new Date()): boolean => {
  const memoDay = startOfUtcDay(memoDate);
  const cutoff = new Date(memoDay);
  cutoff.setUTCDate(cutoff.getUTCDate() + 2);
  return startOfUtcDay(now) < cutoff;
};
