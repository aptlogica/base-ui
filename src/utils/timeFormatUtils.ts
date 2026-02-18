export const pad2 = (n: number): string => n.toString().padStart(2, '0');

export const getTodayISO = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};
