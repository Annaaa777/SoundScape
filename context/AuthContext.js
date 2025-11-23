// context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'vibenav_user';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on app start
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
        }
      } catch (e) {
        console.error('Error loading user', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    // HACKATHON MODE: fake auth
    // In real life you'd call your backend here.
    const fakeUser = { email, name: email.split('@')[0] };
    setUser(fakeUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(fakeUser));
  };

  const signup = async (email, password) => {
    // For demo, behave like login.
    const newUser = { email, name: email.split('@')[0] };
    setUser(newUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
