export interface SelectOption {
  option: string;
  color?: string;
}

export const normalizeSelectOptions = <T extends SelectOption = SelectOption>(
  options: Array<string | SelectOption>
): T[] =>
  (options || []).map((o: string | SelectOption) =>
    typeof o === 'string' ? ({ option: o, color: undefined } as T) : (o as T)
  );
