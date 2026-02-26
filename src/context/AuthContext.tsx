"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";

interface User {
    _id: string;
    email: string;
    displayName: string;
    about: string;
    avatar: string;
    isOnline: boolean;
    lastSeen: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        password: string,
        displayName: string
    ) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async (authToken: string) => {
        try {
            const res = await fetch("/api/auth/me", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setToken(authToken);
            } else {
                localStorage.removeItem("connect_token");
                setUser(null);
                setToken(null);
            }
        } catch {
            localStorage.removeItem("connect_token");
            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const savedToken = localStorage.getItem("connect_token");
        if (savedToken) {
            fetchUser(savedToken);
        } else {
            setLoading(false);
        }
    }, [fetchUser]);

    const login = async (email: string, password: string) => {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem("connect_token", data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const register = async (
        email: string,
        password: string,
        displayName: string
    ) => {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, displayName }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem("connect_token", data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem("connect_token");
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (profileData: Partial<User>) => {
        if (!token) return;

        const res = await fetch("/api/users/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setUser(data.user);
    };

    return (
        <AuthContext.Provider
            value={{ user, token, loading, login, register, logout, updateProfile }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
