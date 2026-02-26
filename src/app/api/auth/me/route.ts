import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        console.error("Me error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
