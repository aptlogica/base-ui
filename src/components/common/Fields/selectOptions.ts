// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
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
