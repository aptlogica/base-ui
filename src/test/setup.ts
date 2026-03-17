// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock SDK imports to prevent vitest from trying to transform built SDK code
vi.mock('../../sdk/index.esm.js', () => {
  // Create a mock EventEmitter for the http client
  const mockHttpClient = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };

  // Mock services
  const mockAuthService = {
    login: vi.fn().mockResolvedValue({ data: { success: true } }),
    logout: vi.fn().mockResolvedValue({ data: { success: true } }),
    verifyOtp: vi.fn().mockResolvedValue({ data: { success: true } }),
    resendOtp: vi.fn().mockResolvedValue({ data: { success: true } }),
    forgotPassword: vi.fn().mockResolvedValue({ data: { success: true } }),
    resetPassword: vi.fn().mockResolvedValue({ data: { success: true } }),
    validateToken: vi.fn().mockResolvedValue({ data: { success: true } }),
    verifyToken: vi.fn().mockResolvedValue({ data: { success: true } }),
  };

  const mockUserService = {
    listUsers: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', email: 'user1@example.com', first_name: 'User', last_name: 'One' },
          { id: '2', email: 'user2@example.com', first_name: 'User', last_name: 'Two' },
        ]
      }
    }),
    getProfile: vi.fn().mockResolvedValue({ data: { success: true } }),
    updateProfile: vi.fn().mockResolvedValue({ data: { success: true } }),
    changePassword: vi.fn().mockResolvedValue({ data: { success: true } }),
    getWorkspaces: vi.fn().mockResolvedValue({ data: { success: true } }),
    getUserAccessDetails: vi.fn().mockResolvedValue({ data: { success: true } }),
    addUser: vi.fn().mockResolvedValue({ data: { success: true } }),
    editUser: vi.fn().mockResolvedValue({ data: { success: true } }),
    removeUser: vi.fn().mockResolvedValue({ data: { success: true } }),
    activateUser: vi.fn().mockResolvedValue({ data: { success: true } }),
    deactivateUser: vi.fn().mockResolvedValue({ data: { success: true } }),
  };

  const mockWorkspaceService = {
    create: vi.fn().mockResolvedValue({ data: { success: true } }),
    getAll: vi.fn().mockResolvedValue({ data: { success: true } }),
    getById: vi.fn().mockResolvedValue({ data: { success: true } }),
    update: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
    getMembers: vi.fn().mockResolvedValue({ data: { success: true } }),
    removeUserFromWorkspace: vi.fn().mockResolvedValue({ data: { success: true } }),
  };

  const mockBaseService = {
    create: vi.fn().mockResolvedValue({ data: { success: true } }),
    getAll: vi.fn().mockResolvedValue({ data: { success: true } }),
    getById: vi.fn().mockResolvedValue({ data: { success: true } }),
    update: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
    getMembers: vi.fn().mockResolvedValue({ data: { success: true } }),
  };

  const mockTableService = {
    create: vi.fn().mockResolvedValue({ data: { success: true } }),
    getAll: vi.fn().mockResolvedValue({ data: { success: true } }),
    getById: vi.fn().mockResolvedValue({ data: { success: true } }),
    update: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
    getColumnsByTableId: vi.fn().mockResolvedValue({ data: { success: true } }),
    addColumn: vi.fn().mockResolvedValue({ data: { success: true } }),
    updateColumn: vi.fn().mockResolvedValue({ data: { success: true } }),
    deleteColumn: vi.fn().mockResolvedValue({ data: { success: true } }),
    getAllRecords: vi.fn().mockResolvedValue({ data: { success: true } }),
    createRow: vi.fn().mockResolvedValue({ data: { success: true } }),
    deleteRow: vi.fn().mockResolvedValue({ data: { success: true } }),
    insertRowData: vi.fn().mockResolvedValue({ data: { success: true } }),
  };

  const SereniBaseClient = vi.fn().mockImplementation((config) => ({
    // HTTP client (accessed as client.http in clientService.ts)
    http: mockHttpClient,

    // Services
    auth: mockAuthService,
    userService: mockUserService,
    workspace: mockWorkspaceService,
    baseService: mockBaseService,
    tableService: mockTableService,

    // Methods
    setAuth: vi.fn(),
    setHeaders: vi.fn(),
    clearAuth: vi.fn(),
    updateConfig: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }));

  return {
    SereniBaseClient,
  };
});

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock scrollTo
window.scrollTo = vi.fn();

// Create storage mock factory that returns vi.fn() with real storage implementation
function createStorageMock() {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
}

globalThis.localStorage = createStorageMock() as any;
globalThis.sessionStorage = createStorageMock() as any;

// Mock window.location to prevent jsdom navigation errors
delete (globalThis as any).location;
(globalThis as any).location = {
  href: '',
  pathname: '/',
  search: '',
  hash: '',
  hostname: 'localhost',
  protocol: 'http:',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};
