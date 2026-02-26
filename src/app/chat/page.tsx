"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import ProfileModal from "@/components/ProfileModal";
import UserSearchModal from "@/components/UserSearchModal";
import { IConversationBase as IConversation } from "@/models/Conversation";
import { IMessageBase as IMessage } from "@/models/Message";
import { IUserBase as IUser } from "@/models/User";

export default function ChatPage() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const { on, emit, socket } = useSocket(token);

    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const activeConversationRef = useRef<string | null>(null);

    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    const fetchConversations = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/conversations", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
        }
    }, [token]);

    const fetchMessages = useCallback(
        async (conversationId: string, pageNum: number = 1, append: boolean = false) => {
            if (!token) return;
            if (pageNum > 1) setIsLoadingMore(true);
            try {
                const res = await fetch(
                    `/api/messages?conversationId=${conversationId}&page=${pageNum}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const data = await res.json();
                if (append) {
                    setMessages((prev) => [...data.messages, ...prev]);
                } else {
                    setMessages(data.messages);
                }
                setHasMore(data.hasMore);
            } catch (err) {
                console.error("Failed to fetch messages:", err);
            } finally {
                setIsLoadingMore(false);
            }
        },
        [token]
    );

    useEffect(() => {
        if (token) {
            fetchConversations();
        }
    }, [token, fetchConversations]);

    useEffect(() => {
        if (!on) return;

        on("user:status", (data: { userId: string; isOnline: boolean }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                if (data.isOnline) next.add(data.userId);
                else next.delete(data.userId);
                return next;
            });
        });

        on("message:new", (message: IMessage) => {
            if (message.conversation.toString() === activeConversationRef.current) {
                setMessages((prev) => [...prev, message]);
                emit("message:read", {
                    conversationId: message.conversation.toString(),
                    userId: user?._id,
                });
            }
            fetchConversations();
        });

        on("typing:start", (data: { userId: string; displayName: string }) => {
            setTypingUsers((prev) => new Set(prev).add(data.displayName));
        });

        on("typing:stop", (data: { userId: string; displayName: string }) => {
            setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(data.displayName);
                return next;
            });
        });

        on("message:read", (data: { userId: string; conversationId: string }) => {
            if (data.conversationId === activeConversationRef.current) {
                setMessages((prev) =>
                    prev.map((msg) => ({
                        ...msg,
                        readBy: [...(msg.readBy || []), data.userId],
                    }))
                );
            }
        });

        // Get initial online users status
        fetch("/api/socketio")
            .then((res) => res.json())
            .then((data) => {
                if (data.onlineUsers) {
                    setOnlineUsers(new Set(data.onlineUsers));
                }
            });
    }, [on, emit, user?._id, fetchConversations]);

    const handleSelectConversation = (id: string) => {
        if (activeConversation) {
            emit("conversation:leave", activeConversation);
        }
        setActiveConversation(id);
        setPage(1);
        fetchMessages(id, 1, false);
        emit("conversation:join", id);
        emit("message:read", { conversationId: id, userId: user?._id });

        // Mark messages as read in DB
        fetch("/api/messages/read", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ conversationId: id }),
        });
    };

    const handleSendMessage = async (content: string) => {
        if (!activeConversation || !token) return;
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ conversationId: activeConversation, content }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, data.message]);
            emit("message:send", {
                conversationId: activeConversation,
                message: data.message,
            });
            fetchConversations();
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const handleTyping = (isTyping: boolean) => {
        if (!activeConversation) return;
        emit(isTyping ? "typing:start" : "typing:stop", {
            conversationId: activeConversation,
            userId: user?._id,
            displayName: user?.displayName,
        });
    };

    const handleSelectUser = async (targetUser: IUser) => {
        setIsSearchOpen(false);
        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ participantId: targetUser._id }),
            });
            const data = await res.json();
            fetchConversations();
            handleSelectConversation(data.conversation._id);
        } catch (err) {
            console.error("Failed to initiate conversation:", err);
        }
    };

    const handleLoadMore = () => {
        if (!activeConversation || !hasMore || isLoadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchMessages(activeConversation, nextPage, true);
    };

    if (loading || !user) return null;

    const currentConv = conversations.find((c) => c._id === activeConversation);
    const otherParticipant = (currentConv?.participants.find(
        (p) => (p as any)._id.toString() !== user?._id
    ) as any) || null;

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />

            <Sidebar
                conversations={conversations}
                activeConversation={activeConversation}
                onSelectConversation={handleSelectConversation}
                onSearchClick={() => setIsSearchOpen(true)}
                onProfileClick={() => setIsProfileOpen(true)}
                onlineUsers={onlineUsers}
            />

            <ChatWindow
                messages={messages}
                activeConversation={activeConversation}
                onSendMessage={handleSendMessage}
                typingUsers={typingUsers}
                onTyping={handleTyping}
                otherParticipant={otherParticipant}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
            />

            {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
            {isSearchOpen && (
                <UserSearchModal
                    onClose={() => setIsSearchOpen(false)}
                    onSelectUser={handleSelectUser}
                    onlineUsers={onlineUsers}
                />
            )}
        </div>
    );
}
