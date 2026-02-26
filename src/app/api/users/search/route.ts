import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get("q") || "";

        if (!query.trim()) {
            return NextResponse.json({ users: [] });
        }

        await connectDB();

        const users = await User.find({
            _id: { $ne: authUser._id },
            $or: [
                { displayName: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
            ],
        })
            .select("displayName email avatar about isOnline lastSeen")
            .limit(20);

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Search users error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
