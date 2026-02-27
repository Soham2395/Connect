"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { IUserBase as IUser } from "@/models/User";

interface UserSearchModalProps {
    onClose: () => void;
    onSelectUser: (user: IUser) => void;
    onlineUsers: Set<string>;
}

export default function UserSearchModal({
    onClose,
    onSelectUser,
    onlineUsers,
}: UserSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { token } = useAuth();
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchUsers = useCallback(
        async (searchQuery: string) => {
            if (!searchQuery.trim()) {
                setResults([]);
                setHasSearched(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(
                    `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const data = await res.json();
                setResults(data.users || []);
                setHasSearched(true);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsLoading(false);
            }
        },
        [token]
    );

    // Auto-search with debounce as user types
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        debounceRef.current = setTimeout(() => {
            searchUsers(query);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, searchUsers]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-xl glass-card rounded-[3rem] p-10 shadow-premium relative overflow-hidden flex flex-col max-h-[80vh]">
                <div className="absolute top-8 right-8">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">New Chat</h2>
                    <p className="text-foreground/50 font-medium tracking-wide uppercase text-xs mt-1">Discover people on Connect</p>
                </div>

                <div className="mb-8 relative group">
                    <svg
                        className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30 group-focus-within:text-primary transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-14 pr-6 py-4 bg-tertiary/50 border border-border rounded-3xl text-foreground placeholder-foreground/20 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        autoFocus
                    />
                    {isLoading && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {results.length > 0 ? (
                        results.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => onSelectUser(user)}
                                className="w-full flex items-center gap-4 p-4 rounded-3xl bg-surface/50 hover:bg-surface border border-transparent hover:border-border transition-all duration-300 group"
                            >
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md">
                                        <img
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.displayName}&background=1a1a24&color=fff&size=128`}
                                            alt={user.displayName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    {onlineUsers.has(user._id) && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-online border-2 border-surface shadow-sm" />
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{user.displayName}</h4>
                                    <p className="text-xs text-foreground/40 truncate font-medium">{user.email}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary flex items-center justify-center text-primary group-hover:text-white transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </div>
                            </button>
                        ))
                    ) : hasSearched && query.trim() ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4 opacity-30">
                                <svg className="w-10 h-10 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">No users found for &quot;{query}&quot;</p>
                        </div>
                    ) : !query.trim() ? (
                        <div className="text-center py-12">
                            <p className="text-foreground/30 text-sm font-medium">Start typing to find people</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
