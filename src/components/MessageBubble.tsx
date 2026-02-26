"use client";

import { IMessageBase as IMessage } from "@/models/Message";

interface MessageBubbleProps {
    message: IMessage;
    isOwn: boolean;
    showAvatar: boolean;
}

export default function MessageBubble({
    message,
    isOwn,
    showAvatar,
}: MessageBubbleProps) {
    const time = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} items-end gap-3 group`}>
            {!isOwn && (
                <div className="w-8 h-8 flex-shrink-0 animate-fade-in">
                    {showAvatar ? (
                        <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-border">
                            <img
                                src={(message.sender as any)?.avatar || `https://ui-avatars.com/api/?name=${(message.sender as any)?.displayName || "User"}&background=111118&color=fff`}
                                alt="User"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-8" />
                    )}
                </div>
            )}

            <div className={`relative max-w-[75%] lg:max-w-[65%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                <div
                    className={`px-5 py-3.5 rounded-[2rem] shadow-sm transition-all duration-300 ${isOwn
                        ? "bg-primary text-white rounded-br-lg shadow-primary/10"
                        : "bg-surface text-foreground rounded-bl-lg shadow-black/5"
                        }`}
                >
                    <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">
                        {message.content}
                    </p>
                </div>

                <div className={`flex items-center gap-1.5 mt-2 transition-opacity duration-300 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">
                        {time}
                    </span>
                    {isOwn && (
                        <div className="flex items-center">
                            <svg
                                className={`w-3.5 h-3.5 ${message.readBy && message.readBy.length > 1 ? "text-primary" : "text-foreground/20"}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <svg
                                className={`w-3.5 h-3.5 -ml-2.5 ${message.readBy && message.readBy.length > 1 ? "text-primary" : "text-foreground/20"}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
