import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { email, password, displayName } = await req.json();

        if (!email || !password || !displayName) {
            return NextResponse.json(
                { error: "Email, password, and display name are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        await connectDB();

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            displayName: displayName.trim(),
        });

        const token = signToken(user._id.toString());

        return NextResponse.json(
            {
                token,
                user: {
                    _id: user._id,
                    email: user.email,
                    displayName: user.displayName,
                    about: user.about,
                    avatar: user.avatar,
                    isOnline: user.isOnline,
                    lastSeen: user.lastSeen,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
