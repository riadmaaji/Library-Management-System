import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, login as loginRequest } from '../api/services/authService';
import { TOKEN_STORAGE_KEY } from '../api/axios';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!storedToken) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setToken(storedToken);
      }

      try {
        const response = await getMe();

        if (isMounted) {
          setUser(response.data.user);
        }
      } catch {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const response = await loginRequest(email, password);
    const nextToken = response.data.token;
    const nextUser = response.data.user;

    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);

    return response;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    navigate('/login');
  }, [clearSession, navigate]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
