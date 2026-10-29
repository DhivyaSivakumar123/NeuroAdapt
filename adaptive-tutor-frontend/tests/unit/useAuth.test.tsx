import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { AuthProvider } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabaseClient';
import { apiClient } from '../../src/lib/apiClient';

vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock('../../src/lib/apiClient', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(msg: string, status: number) {
      super(msg);
      this.status = status;
    }
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook - 401 Stale Session Regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips network call if session is expired pre-flight', async () => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          access_token: 'expired-token-123',
          expires_at: expiredTimestamp,
        },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(apiClient).not.toHaveBeenCalled();
    expect(result.current.profile).toBeNull();
  });

  it('invokes local scope signOut on 401 response without remote logout error', async () => {
    const validFutureTimestamp = Math.floor(Date.now() / 1000) + 3600;
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          access_token: 'stale-token-456',
          expires_at: validFutureTimestamp,
        },
      },
    });

    const { ApiError } = await import('../../src/lib/apiClient');
    (apiClient as any).mockRejectedValue(new ApiError('Unauthorized', 401));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(apiClient).toHaveBeenCalledWith('/auth/me');
    expect(result.current.profile).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
