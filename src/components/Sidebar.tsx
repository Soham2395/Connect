"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { IConversationBase as IConversation } from "@/models/Conversation";
import { IUserBase as IUser } from "@/models/User";

interface SidebarProps {
    conversations: IConversation[];
    activeConversation: string | null;
    onSelectConversation: (id: string) => void;
    onSearchClick: () => void;
    onProfileClick: () => void;
    onlineUsers: Set<string>;
}

export default function Sidebar({
    conversations,
    activeConversation,
    onSelectConversation,
    onSearchClick,
    onProfileClick,
    onlineUsers,
}: SidebarProps) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = conversations.filter((conv) => {
        const otherParticipant = conv.participants.find(
            (p) => (p as any)._id !== user?._id
        ) as any;
        return otherParticipant?.displayName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex flex-col h-full bg-secondary border-r border-border w-full md:w-[380px] z-20">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            onClick={onProfileClick}
                            className="relative w-12 h-12 rounded-2xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary transition-all duration-300"
                        >
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=6c5ce7&color=fff&size=128`}
                                alt="My Profile"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Connect</h2>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-online animate-pulse" />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-foreground/40">Online Now</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onSearchClick}
                        className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center text-foreground/60 hover:text-primary hover:bg-primary/10 transition-all duration-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-tertiary/50 border border-border rounded-2xl text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
                {filteredConversations.length === 0 ? (
                    <div className="text-center py-10 px-6">
                        <div className="w-16 h-16 bg-tertiary rounded-3xl flex items-center justify-center mx-auto mb-4 opacity-50">
                            <svg className="w-8 h-8 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <p className="text-foreground/40 text-sm font-medium">
                            No conversations found.
                        </p>
                        <button
                            onClick={onSearchClick}
                            className="mt-4 text-xs font-bold text-primary hover:underline"
                        >
                            Start a new chat
                        </button>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const otherParticipant = conv.participants.find(
                            (p) => (p as any)._id.toString() !== user?._id
                        ) as IUser;
                        if (!otherParticipant) return null;

                        const isOnline = onlineUsers.has(otherParticipant._id.toString());
                        const isActive = activeConversation === conv._id;

                        return (
                            <button
                                key={conv._id}
                                onClick={() => onSelectConversation(conv._id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02] z-10"
                                    : "hover:bg-surface text-foreground"
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className={`w-14 h-14 rounded-2xl overflow-hidden ${isActive ? "ring-2 ring-white/50" : "ring-1 ring-border group-hover:ring-primary/50"}`}>
                                        <img
                                            src={otherParticipant.avatar || `https://ui-avatars.com/api/?name=${otherParticipant.displayName}&background=1a1a24&color=fff&size=128`}
                                            alt={otherParticipant.displayName}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    {isOnline && (
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isActive ? "bg-white border-primary" : "bg-online border-secondary"} shadow-sm`} />
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`font-bold truncate ${isActive ? "text-white" : "text-foreground"}`}>
                                            {otherParticipant.displayName}
                                        </h3>
                                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? "text-white/70" : "text-foreground/30"}`}>
                                            {conv.lastMessage
                                                ? new Date((conv.lastMessage as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : ""}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${isActive ? "text-white/80" : "text-foreground/50"}`}>
                                        {conv.lastMessage ? (conv.lastMessage as any).content : "No messages yet"}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
