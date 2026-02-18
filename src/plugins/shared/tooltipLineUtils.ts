export type TooltipFieldLine = {
  value: string;
  priority: number;
};

interface BulletLineOptions {
  fieldsPerLine?: number;
  separator?: string;
  prefix?: string;
}

export function toBulletLines(
  fields: TooltipFieldLine[],
  { fieldsPerLine = 3, separator = ' • ', prefix = '• ' }: BulletLineOptions = {}
): string[] {
  const lines: string[] = [];
  const sortedFields = fields.toSorted((a, b) => a.priority - b.priority);

  for (let i = 0; i < sortedFields.length; i += fieldsPerLine) {
    const lineFields = sortedFields.slice(i, i + fieldsPerLine);
    const lineValues = lineFields.map(({ value }) => value).join(separator);
    if (lineValues) {
      lines.push(`${prefix}${lineValues}`);
    }
  }

  return lines;
}
