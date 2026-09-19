import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return localStorage.getItem('crm_token');
  });
  const [loading, setLoading] = useState(true);

  // Verify logged-in user from MongoDB/backend
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');

        if (res.success && res.data) {
          // User comes from backend/MongoDB
          setUser(res.data);
        } else {
          await logout();
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token]);

  // LOGIN
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
      });

      if (res.success && res.data) {
        const { token: jwtToken, user: userData } = res.data;

        // Keep JWT for authentication
        setToken(jwtToken);

        // User data comes from backend
        setUser(userData);

        // Only token is stored locally
        localStorage.setItem('crm_token', jwtToken);

        return userData;
      }

      throw new Error(res.message || 'Login failed');
    } catch (error) {
      throw error;
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);

      // Remove only authentication token
      localStorage.removeItem('crm_token');
    }
  };

<<<<<<< HEAD
  // SIGNUP
  const signup = async (formData) => {
    try {
      const res = await api.post('/auth/signup', formData);
      if (res.success && res.data) {
        if (res.data.token && res.data.user) {
          setToken(res.data.token);
          setUser(res.data.user);
          localStorage.setItem('crm_token', res.data.token);
          return res.data.user;
        }
        return res.data;
      }
      throw new Error(res.message || 'Signup failed');
    } catch (error) {
      throw error;
    }
  };

=======
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const isAdmin = [
    'SUPER_ADMIN',
    'ADMIN',
  ].includes(user?.role);

  const isHRAdmin = [
    'SUPER_ADMIN',
    'HR_ADMIN',
  ].includes(user?.role);

  const isTeamLead = user?.role === 'TEAM_LEAD';

  const isCallerOrBDE = [
    'EMPLOYEE',
    'TELECALLER',
    'BDE',
  ].includes(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
<<<<<<< HEAD
        signup,
=======
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
        logout,

        isAuthenticated: !!token && !!user,

        isSuperAdmin,
        isAdmin,
        isHRAdmin,
        isTeamLead,
        isCallerOrBDE,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};