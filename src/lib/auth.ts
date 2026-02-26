import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import connectDB from "./mongodb";
import User, { IUser } from "@/models/User";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("Please define JWT_SECRET in .env.local");
    }
    return secret;
}

export function signToken(userId: string): string {
    return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
    try {
        return jwt.verify(token, getJwtSecret()) as { userId: string };
    } catch {
        return null;
    }
}

export async function getAuthUser(req: NextRequest): Promise<IUser | null> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return null;
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    return user;
}
