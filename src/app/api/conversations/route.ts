import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import "@/models/Message";   // register schema for populate
import "@/models/User";      // register schema for populate
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const conversations = await Conversation.find({
            participants: authUser._id,
        })
            .populate("participants", "displayName email avatar isOnline lastSeen about")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("Get conversations error:", error);
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

        const { participantId } = await req.json();

        if (!participantId) {
            return NextResponse.json(
                { error: "Participant ID is required" },
                { status: 400 }
            );
        }

        if (participantId === authUser._id.toString()) {
            return NextResponse.json(
                { error: "Cannot create conversation with yourself" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if a conversation already exists between these two users
        let conversation = await Conversation.findOne({
            participants: { $all: [authUser._id, participantId], $size: 2 },
        })
            .populate("participants", "displayName email avatar isOnline lastSeen about")
            .populate("lastMessage");

        if (conversation) {
            return NextResponse.json({ conversation });
        }

        // Create new conversation
        conversation = await Conversation.create({
            participants: [authUser._id, participantId],
        });

        conversation = await Conversation.findById(conversation._id)
            .populate("participants", "displayName email avatar isOnline lastSeen about")
            .populate("lastMessage");

        return NextResponse.json({ conversation }, { status: 201 });
    } catch (error) {
        console.error("Create conversation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
