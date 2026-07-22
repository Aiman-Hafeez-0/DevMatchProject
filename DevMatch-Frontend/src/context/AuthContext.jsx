import { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserSession = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/session`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        console.log("SESSION DATA:", data);
        setUser(data.user || data); // Use `data.user` if available, fallback to full data
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("session error", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateSession = fetchUserSession;

  useEffect(() => {
    fetchUserSession();
  }, []);

  const login = async (formData) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user || data); // match structure
    }
    return data;
  };

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, fetchUserSession, updateSession, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
