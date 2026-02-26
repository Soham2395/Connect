import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function PUT(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { displayName, about, avatar } = await req.json();

        await connectDB();

        const updateData: Record<string, string> = {};
        if (displayName !== undefined) updateData.displayName = displayName.trim();
        if (about !== undefined) updateData.about = about.substring(0, 200);
        if (avatar !== undefined) updateData.avatar = avatar;

        const user = await User.findByIdAndUpdate(authUser._id, updateData, {
            new: true,
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                about: user.about,
                avatar: user.avatar,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
