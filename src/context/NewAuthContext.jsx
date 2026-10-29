import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as auth from "../api/auth";
import { getAccessToken, getStoredUser, onSessionExpired, request } from "../api/client";

const NewAuthContext = createContext({
  user: null,
  login: async () => {},
  googleLogin: async () => {},
  signup: async () => {},
  logout: () => {},
  isLoading: false,
  fetchUser: async () => {},
  updateUser: async () => {},
  accessToken: null,
  isAuthenticated: false,
});

export function NewAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session saved by a previous visit. Sessions started on v1
  // keep working: their tokens are accepted by v2 and refreshed through v1.
  useEffect(() => {
    const stored = getStoredUser();
    if (stored && getAccessToken()) setUser(stored);
    setIsLoading(false);
    return onSessionExpired(() => setUser(null));
  }, []);

  /**
   * Authenticated request for pages that call the API directly. Kept for
   * compatibility with callers that pass a fetch-style { method, body }.
   */
  const apiCall = useCallback(
    (endpoint, options = {}) =>
      request(endpoint, {
        method: options.method,
        body: typeof options.body === "string" ? JSON.parse(options.body) : options.body,
      }),
    [],
  );

  const login = async (email, password) => {
    if (!email?.trim() || !password?.trim()) {
      throw new Error("Email and password are required");
    }
    const signedIn = await auth.login(email.trim(), password);
    setUser(signedIn);
    return signedIn;
  };

  /** @param {string} credential the ID token from Google's sign-in button */
  const googleLogin = async (credential) => {
    const signedIn = await auth.loginWithGoogle(credential);
    setUser(signedIn);
    return signedIn;
  };

  const signup = async (firstName, lastName, email, password, phone) => {
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim() || !phone?.trim()) {
      throw new Error("All fields are required");
    }
    const signedIn = await auth.register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
    });
    setUser(signedIn);
    return signedIn;
  };

  const logout = useCallback(() => {
    setUser(null);
    auth.logout();
  }, []);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const fresh = await auth.loadUser();
      setUser(fresh);
      return fresh;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates) => {
    if (!user?._id) throw new Error("No authenticated user");
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates || {}).filter(([, value]) => value !== undefined && value !== null),
    );
    if (Object.keys(cleanUpdates).length === 0) throw new Error("No valid updates provided");
    await auth.updateUser(user._id, cleanUpdates);
    return fetchUser();
  };

  const value = {
    apiCall,
    user,
    login,
    googleLogin,
    signup,
    logout,
    isLoading,
    fetchUser,
    updateUser,
    accessToken: getAccessToken(),
    isAuthenticated: Boolean(user && getAccessToken()),
  };

  return <NewAuthContext.Provider value={value}>{children}</NewAuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(NewAuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
