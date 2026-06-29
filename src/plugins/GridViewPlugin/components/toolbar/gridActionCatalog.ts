// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@aptlogica.com
import React from 'react';
import {
  Eraser,
  Merge,
  Split,
  TextSearch,
  Sparkles,
  CaseSensitive,
} from 'lucide-react';

export type GridActionGroup = 'clean' | 'transform';

export type GridActionId =
  | 'remove_duplicates'
  | 'fuzzy_deduplication'
  | 'remove_extra_spaces'
  | 'remove_special_characters'
  | 'remove_formatting'
  | 'case_normalization'
  | 'find_replace'
  | 'split_column'
  | 'merge_column'
  | 'extract_substring';

export interface GridActionDefinition {
  id: GridActionId;
  group: GridActionGroup;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sharedIconClass = 'w-4 h-4';
const themedIconClass = (className?: string) =>
  [className, 'dark:invert dark:brightness-0 dark:opacity-80'].filter(Boolean).join(' ');

const ExtraSpaceIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement('img', {
    src: '/assets/extra-space.svg',
    alt: 'Remove Extra Spaces',
    className: themedIconClass(className),
  });

const RemoveSpecialCharsIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement('img', {
    src: '/assets/remove-special-chars.svg',
    alt: 'Remove Special Characters',
    className: themedIconClass(className),
  });

const RemoveFormattingIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement('img', {
    src: '/assets/remove-formatting.svg',
    alt: 'Remove Formatting',
    className: themedIconClass(className),
  });

const ExtractSubstringIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement('img', {
    src: '/assets/extract-substring.svg',
    alt: 'Extract Substring',
    className: themedIconClass(className),
  });

export const GRID_ACTIONS: Record<GridActionId, GridActionDefinition> = {
  remove_duplicates: {
    id: 'remove_duplicates',
    group: 'clean',
    label: 'Remove Duplicates',
    description: 'Detect duplicate records and remove or preserve them based on your chosen rule.',
    icon: Eraser,
  },
  fuzzy_deduplication: {
    id: 'fuzzy_deduplication',
    group: 'clean',
    label: 'Fuzzy Deduplication',
    description: 'Find near-duplicate records by similarity.',
    icon: Sparkles,
  },
  remove_extra_spaces: {
    id: 'remove_extra_spaces',
    group: 'clean',
    label: 'Remove Extra Spaces',
    description: 'Collapse repeated spaces inside text values.',
    icon: ExtraSpaceIcon,
  },
  remove_special_characters: {
    id: 'remove_special_characters',
    group: 'clean',
    label: 'Remove Special Characters',
    description: 'Strip symbols and non-alphanumeric characters.',
    icon: RemoveSpecialCharsIcon,
  },
  remove_formatting: {
    id: 'remove_formatting',
    group: 'clean',
    label: 'Remove Formatting',
    description: 'Strip display formatting from values such as numbers, phones, and dates.',
    icon: RemoveFormattingIcon,
  },
  case_normalization: {
    id: 'case_normalization',
    group: 'clean',
    label: 'Case Normalization',
    description: 'Convert text to consistent case.',
    icon: CaseSensitive,
  },
  find_replace: {
    id: 'find_replace',
    group: 'clean',
    label: 'Find & Replace',
    description: 'Find matching text and replace it across selected values.',
    icon: TextSearch,
  },
  split_column: {
    id: 'split_column',
    group: 'transform',
    label: 'Split Column',
    description: 'Split one field into multiple columns.',
    icon: Split,
  },
  merge_column: {
    id: 'merge_column',
    group: 'transform',
    label: 'Merge Column',
    description: 'Combine multiple columns into one value.',
    icon: Merge,
  },
  extract_substring: {
    id: 'extract_substring',
    group: 'transform',
    label: 'Extract Substring',
    description: 'Extract part of a value using a delimiter, position, or pattern.',
    icon: ExtractSubstringIcon,
  },
};

export const GRID_ACTION_GROUPS: Record<GridActionGroup, GridActionDefinition[]> = {
  clean: [
    GRID_ACTIONS.remove_duplicates,
    // GRID_ACTIONS.fuzzy_deduplication is intentionally hidden for now.
    GRID_ACTIONS.remove_extra_spaces,
    GRID_ACTIONS.remove_special_characters,
    GRID_ACTIONS.remove_formatting,
    GRID_ACTIONS.case_normalization,
    GRID_ACTIONS.find_replace,
  ],
  transform: [
    GRID_ACTIONS.split_column,
    GRID_ACTIONS.merge_column,
    GRID_ACTIONS.extract_substring,
  ],
};

export const getGridActionById = (actionId: GridActionId) => GRID_ACTIONS[actionId];

export const getGridActionIconClassName = () => sharedIconClass;
