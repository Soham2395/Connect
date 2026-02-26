"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(token: string | null) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        const socket = io(
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            {
                path: "/api/socketio",
                auth: { token },
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
            }
        );

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    const emit = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: string, data?: any) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit(event, data);
            }
        },
        []
    );

    const on = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: string, handler: (...args: any[]) => void) => {
            socketRef.current?.on(event, handler);
            return () => {
                socketRef.current?.off(event, handler);
            };
        },
        []
    );

    const joinConversation = useCallback(
        (conversationId: string) => {
            emit("conversation:join", conversationId);
        },
        [emit]
    );

    const leaveConversation = useCallback(
        (conversationId: string) => {
            emit("conversation:leave", conversationId);
        },
        [emit]
    );

    return {
        socket: socketRef.current,
        emit,
        on,
        joinConversation,
        leaveConversation,
    };
}
