import { NextRequest, NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const conversationId = searchParams.get("conversationId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 30;

        if (!conversationId) {
            return NextResponse.json(
                { error: "Conversation ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify user is part of the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: authUser._id,
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "displayName avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Message.countDocuments({
            conversation: conversationId,
        });

        return NextResponse.json({
            messages: messages.reverse(),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (error) {
        console.error("Get messages error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { conversationId, content } = await req.json();

        if (!conversationId || !content) {
            return NextResponse.json(
                { error: "Conversation ID and content are required" },
                { status: 400 }
            );
        }

        // Sanitize message content to prevent XSS
        const sanitizedContent = DOMPurify.sanitize(content.trim(), {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
        });

        if (!sanitizedContent) {
            return NextResponse.json(
                { error: "Message content cannot be empty" },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify user is part of the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: authUser._id,
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: authUser._id,
            content: sanitizedContent,
            readBy: [authUser._id],
        });

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            updatedAt: new Date(),
        });

        const populatedMessage = await Message.findById(message._id).populate(
            "sender",
            "displayName avatar"
        );

        return NextResponse.json({ message: populatedMessage }, { status: 201 });
    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
