import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

const DEMO_USERS = {
  PRIVACY_ADMIN: {
    user_id: 'USR_001',
    full_name: 'Security Administrator',
    email: 'admin@flyyy.ai',
    role: 'PRIVACY_ADMIN',
    two_factor_verified: true,
  },
  CUSTOMER_SUPPORT: {
    user_id: 'USR_002',
    full_name: 'Support Specialist Jane',
    email: 'support@flyyy.ai',
    role: 'CUSTOMER_SUPPORT',
    two_factor_verified: true,
  },
  MARKETING: {
    user_id: 'USR_003',
    full_name: 'Marketing Lead Alex',
    email: 'marketing@flyyy.ai',
    role: 'MARKETING',
    two_factor_verified: true,
  },
  AUDITOR: {
    user_id: 'USR_004',
    full_name: 'Compliance Auditor Claire',
    email: 'auditor@flyyy.ai',
    role: 'AUDITOR',
    two_factor_verified: true,
  },
};

export const AuthProvider = ({ children }) => {
  // Initialize with Security Administrator active by default
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('flyy_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEMO_USERS.PRIVACY_ADMIN;
  });

  const [currentRole, setCurrentRole] = useState(() => currentUser?.role || 'PRIVACY_ADMIN');
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem('flyy_session') || 'DEMO_SESSION_TOKEN');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('flyy_user', JSON.stringify(currentUser));
      setCurrentRole(currentUser.role);
    } else {
      localStorage.removeItem('flyy_user');
      localStorage.removeItem('flyy_session');
    }
  }, [currentUser]);

  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    if (currentUser) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
    }
  };

  const login = async (email, password) => {
    const response = await api.login(email, password);
    return response;
  };

  const complete2FA = async (challengeId, code) => {
    const res = await api.verify2FA(challengeId, code);
    if (res.status === 'AUTHENTICATED') {
      setCurrentUser(res.user);
      setSessionToken(res.session_token);
      localStorage.setItem('flyy_session', res.session_token);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    return res;
  };

  const switchPersona = (roleKey) => {
    if (DEMO_USERS[roleKey]) {
      setCurrentUser(DEMO_USERS[roleKey]);
      setCurrentRole(roleKey);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRole('ANONYMOUS');
    setSessionToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole: switchRole,
        isAuthenticated: !!currentUser,
        is2FAVerified: currentUser?.two_factor_verified || false,
        sessionToken,
        login,
        complete2FA,
        register,
        logout,
        switchPersona,
        DEMO_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
