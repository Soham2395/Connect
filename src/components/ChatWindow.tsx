"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { IMessageBase as IMessage } from "@/models/Message";
import MessageBubble from "./MessageBubble";

const EMOJI_LIST = [
    "😀", "😂", "🥹", "😍", "🥰", "😘", "😎", "🤩", "🥳", "😭",
    "😤", "🤯", "🫡", "🤔", "🫣", "😴", "🤮", "🥶", "🥵", "😈",
    "👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "💪", "🫶", "❤️",
    "🔥", "⭐", "✨", "💯", "🎉", "🎊", "💀", "👀", "🙏", "💫",
    "😊", "😇", "🤣", "😋", "😜", "🤪", "😝", "🤗", "🤭", "😶",
    "😑", "😏", "😒", "🙄", "😬", "😮", "😯", "😲", "😱", "😢",
    "🫠", "🤐", "🤨", "🧐", "🤓", "💩", "🤡", "👋",
    "🫰", "👌", "🤌", "🤏", "✊", "👊", "🤛", "🤜", "👆", "👇",
];

interface ChatWindowProps {
    messages: IMessage[];
    activeConversation: string | null;
    onSendMessage: (content: string) => void;
    typingUsers: Set<string>;
    onTyping: (isTyping: boolean) => void;
    otherParticipant: {
        _id: string;
        displayName: string;
        avatar: string;
        isOnline: boolean;
        lastSeen: Date;
    } | null;
    onLoadMore: () => void;
    hasMore: boolean;
    isLoadingMore: boolean;
}

export default function ChatWindow({
    messages,
    activeConversation,
    onSendMessage,
    typingUsers,
    onTyping,
    otherParticipant,
    onLoadMore,
    hasMore,
    isLoadingMore,
}: ChatWindowProps) {
    const [content, setContent] = useState("");
    const [showEmojis, setShowEmojis] = useState(false);
    const { user } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length]);

    // Close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
                setShowEmojis(false);
            }
        };
        if (showEmojis) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojis]);

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSendMessage(content);
        setContent("");
        setShowEmojis(false);
        onTyping(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);
        onTyping(true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    };

    const insertEmoji = (emoji: string) => {
        setContent((prev) => prev + emoji);
        inputRef.current?.focus();
    };

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-mesh p-10 text-center">
                <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20" />
                    <svg className="w-16 h-16 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-foreground mb-4">Start a Conversation</h2>
                <p className="text-foreground/50 max-w-sm text-lg font-medium">
                    Select a contact from the sidebar or find someone new to start messaging.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative z-10">
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-border">
                            <img
                                src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.displayName}&background=1a1a24&color=fff&size=128`}
                                alt={otherParticipant?.displayName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {otherParticipant?.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-online border-2 border-background shadow-lg" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-lg leading-tight">
                            {otherParticipant?.displayName}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-wider">
                            {otherParticipant?.isOnline ? (
                                <span className="text-online">Active Now</span>
                            ) : (
                                <span className="text-foreground/30">
                                    Last seen {otherParticipant?.lastSeen ? new Date(otherParticipant.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-xl hover:bg-surface flex items-center justify-center text-foreground/40 hover:text-foreground transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </button>
                    <button className="w-10 h-10 rounded-xl hover:bg-surface flex items-center justify-center text-foreground/40 hover:text-foreground transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
            >
                {hasMore && (
                    <div className="flex justify-center">
                        <button
                            onClick={onLoadMore}
                            disabled={isLoadingMore}
                            className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-full transition-all uppercase tracking-widest"
                        >
                            {isLoadingMore ? "Loading history..." : "Load Older Messages"}
                        </button>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={(msg as any)._id}
                        message={msg}
                        isOwn={msg.sender === user?._id || (msg.sender as any)?._id === user?._id}
                        showAvatar={idx === 0 || messages[idx - 1].sender !== msg.sender}
                    />
                ))}

                {typingUsers.size > 0 && (
                    <div className="flex items-center gap-3 animate-slide-left">
                        <div className="w-8 h-8 rounded-xl bg-tertiary flex items-center justify-center p-2">
                            <div className="flex gap-1">
                                <div className="typing-dot" style={{ animationDelay: '0s' }} />
                                <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                                <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                        <span className="text-xs font-bold text-foreground/30 uppercase tracking-widest">
                            {Array.from(typingUsers)[0]} is typing...
                        </span>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-8 pt-4 relative">
                {/* Emoji Picker */}
                {showEmojis && (
                    <div
                        ref={emojiRef}
                        className="absolute bottom-24 left-8 w-80 bg-secondary border border-border rounded-3xl shadow-premium p-4 z-30 animate-fade-in"
                    >
                        <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                            {EMOJI_LIST.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => insertEmoji(emoji)}
                                    className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-primary/10 transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-4 bg-tertiary/50 border border-border p-2 rounded-[2rem] focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/50 transition-all duration-300"
                >
                    <button
                        type="button"
                        onClick={() => setShowEmojis(!showEmojis)}
                        className={`w-12 h-12 flex items-center justify-center transition-colors rounded-full ${showEmojis ? "text-primary bg-primary/10" : "text-foreground/30 hover:text-primary"}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={content}
                        onChange={handleChange}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none text-foreground placeholder-foreground/20 focus:outline-none font-medium py-3"
                    />
                    <button
                        type="submit"
                        disabled={!content.trim()}
                        className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-full transition-all active:scale-90 disabled:opacity-20 disabled:grayscale"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
