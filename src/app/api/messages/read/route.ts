import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import { getAuthUser } from "@/lib/auth";

export async function PUT(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { conversationId } = await req.json();

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

        // Mark all messages in this conversation as read by current user
        await Message.updateMany(
            {
                conversation: conversationId,
                readBy: { $ne: authUser._id },
            },
            {
                $addToSet: { readBy: authUser._id },
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Read messages error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
