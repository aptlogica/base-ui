// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
declare global {
  interface Window {
    pluginServices?: Record<string, any>;
    showNotification?: (message: string, type?: string) => string;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Semver type declarations if not using @types/semver
declare module 'semver' {
  export function satisfies(version: string, range: string): boolean;
  export function valid(version: string): string | null;
  export function clean(version: string): string | null;
  export function gt(version1: string, version2: string): boolean;
  export function lt(version1: string, version2: string): boolean;
  export function gte(version1: string, version2: string): boolean;
  export function lte(version1: string, version2: string): boolean;
  export function eq(version1: string, version2: string): boolean;
}

export {};

