import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = '';

function decodePayload(token) {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isExpired(token) {
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('jiit_token');
    const storedUser = localStorage.getItem('jiit_user');

    if (storedToken && !isExpired(storedToken)) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('jiit_user');
        }
      }
    } else {
      localStorage.removeItem('jiit_token');
      localStorage.removeItem('jiit_user');
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.error || 'Failed to login');
    }

    setToken(body.token);
    setUser(body.user);
    localStorage.setItem('jiit_token', body.token);
    localStorage.setItem('jiit_user', JSON.stringify(body.user));
    return body;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jiit_token');
    localStorage.removeItem('jiit_user');
  };

  const value = useMemo(
    () => ({ user, token, login, logout, loading }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
