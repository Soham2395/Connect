"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace("/chat");
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await login(email, password);
            router.push("/chat");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh p-6 relative overflow-hidden">
            <div className="w-full max-w-[440px] animate-fade-in z-10">
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-6 group transition-all duration-500 hover:scale-110">
                        <svg
                            className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(108,92,231,0.5)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-foreground/60 text-lg font-medium">
                        Sign in to your Connect account
                    </p>
                </div>

                {/* Card */}
                <div className="glass-card rounded-[2.5rem] p-10 shadow-premium relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-[2.6rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 pointer-events-none"></div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        {error && (
                            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-2xl text-sm font-medium animate-fade-in flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground/70 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-tertiary/50 border border-border rounded-2xl text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-sm font-semibold text-foreground/70">
                                    Password
                                </label>
                                <Link href="#" className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-tertiary/50 border border-border rounded-2xl text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-lg shadow-primary/25 transform transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </span>
                            ) : (
                                "Continue to App"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-border/50 text-center relative z-10">
                        <p className="text-foreground/50 text-sm font-medium">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/register"
                                className="text-primary hover:text-primary-hover font-bold transition-colors ml-1"
                            >
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer info */}
                <p className="mt-10 text-center text-foreground/30 text-xs font-medium tracking-wide uppercase">
                    SECURE & END-TO-END ENCRYPTED
                </p>
            </div>
        </div>
    );
}
