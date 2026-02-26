import { NextResponse } from "next/server";

// Socket.io is initialized in server.js, not in Next.js API routes.
// This route exists as a placeholder for the Socket.io path.
export async function GET() {
    return NextResponse.json({
        status: "Socket.io server runs via custom server.js",
        path: "/api/socketio",
    });
}
