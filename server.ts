import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// ---------- ENV ----------
const envFiles = [
    path.join(__dirname, ".env.local"),
    path.join(__dirname, ".env"),
];

for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, "utf-8");
        content.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
                const eqIndex = trimmed.indexOf("=");
                if (eqIndex > 0) {
                    const key = trimmed.substring(0, eqIndex).trim();
                    let val = trimmed.substring(eqIndex + 1).trim();
                    // Strip surrounding quotes
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        });
    }
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const JWT_SECRET = process.env.JWT_SECRET!;
const MONGODB_URI = process.env.MONGODB_URI!;

// ---------- Online-user tracking ----------
const onlineUsers = new Map<string, Set<string>>();

// ---------- Mongoose (lazy) ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let User: mongoose.Model<any>;

async function getUser() {
    if (User) return User;

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ MongoDB connected for Socket.io");
    }

    if (mongoose.models.User) {
        User = mongoose.models.User as mongoose.Model<mongoose.Document>;
    } else {
        const UserSchema = new mongoose.Schema(
            {
                email: String,
                password: { type: String, select: false },
                displayName: String,
                about: { type: String, default: "Hey there! I'm using Connect." },
                avatar: { type: String, default: "" },
                isOnline: { type: Boolean, default: false },
                lastSeen: { type: Date, default: Date.now },
            },
            { timestamps: true },
        );
        User = mongoose.model("User", UserSchema);
    }
    return User;
}

function verifyToken(token: string): { userId: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
        return null;
    }
}

// ---------- Boot ----------
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });

    // ---------- Socket.io ----------
    const io = new SocketIOServer(server, {
        path: "/api/socketio",
        addTrailingSlash: false,
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
        },
        transports: ["websocket", "polling"],
    });

    // Auth middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token as string | undefined;
            if (!token) return next(new Error("Authentication required"));

            const decoded = verifyToken(token);
            if (!decoded) return next(new Error("Invalid token"));

            socket.data.userId = decoded.userId;
            next();
        } catch {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", async (socket) => {
        const userId: string = socket.data.userId;
        console.log(`👤 User connected: ${userId} (${socket.id})`);

        // Track online
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId)!.add(socket.id);

        // Update DB
        try {
            const UserModel = await getUser();
            await UserModel.findByIdAndUpdate(userId, { isOnline: true });
        } catch (err) {
            console.error("Error updating online status:", err);
        }

        // Broadcast online
        socket.broadcast.emit("user:status", { userId, isOnline: true });

        // Join / leave conversation rooms
        socket.on("conversation:join", (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
        });

        socket.on("conversation:leave", (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // Relay message
        socket.on("message:send", (data: { conversationId: string; message: unknown }) => {
            socket.to(`conversation:${data.conversationId}`).emit("message:new", data.message);
        });

        // Typing indicators
        socket.on("typing:start", (data: { conversationId: string; userId: string; displayName: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
                userId: data.userId,
                displayName: data.displayName,
            });
        });

        socket.on("typing:stop", (data: { conversationId: string; userId: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
                userId: data.userId,
            });
        });

        // Read receipts
        socket.on("message:read", (data: { conversationId: string; userId: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit("message:read", {
                userId: data.userId,
                conversationId: data.conversationId,
            });
        });

        // Disconnect
        socket.on("disconnect", async () => {
            console.log(`👋 User disconnected: ${userId} (${socket.id})`);

            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);

                    try {
                        const UserModel = await getUser();
                        await UserModel.findByIdAndUpdate(userId, {
                            isOnline: false,
                            lastSeen: new Date(),
                        });
                    } catch (err) {
                        console.error("Error updating offline status:", err);
                    }

                    socket.broadcast.emit("user:status", {
                        userId,
                        isOnline: false,
                        lastSeen: new Date(),
                    });
                }
            }
        });
    });

    console.log("✅ Socket.io server initialized");

    server.listen(port, () => {
        console.log(`\n🚀 Connect is running on http://${hostname}:${port}`);
        console.log(`📡 Socket.io path: /api/socketio\n`);
    });
});
