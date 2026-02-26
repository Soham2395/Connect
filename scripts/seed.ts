import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ---------- Load .env.local ----------
function loadEnv() {
    const envPath = path.join(__dirname, "..", ".env.local");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
                const eqIndex = trimmed.indexOf("=");
                if (eqIndex > 0) {
                    const key = trimmed.substring(0, eqIndex).trim();
                    const val = trimmed.substring(eqIndex + 1).trim();
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        });
    }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found. Create a .env.local file.");
    process.exit(1);
}

// ---------- Schemas ----------
const UserSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, select: false },
        displayName: { type: String, required: true },
        about: { type: String, default: "Hey there! I'm using Connect." },
        avatar: { type: String, default: "" },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

const ConversationSchema = new mongoose.Schema(
    {
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
    },
    { timestamps: true },
);

const MessageSchema = new mongoose.Schema(
    {
        conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true },
);

// ---------- Seed ----------
async function seed() {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);

    const User = mongoose.model("User", UserSchema);
    const Conversation = mongoose.model("Conversation", ConversationSchema);
    const Message = mongoose.model("Message", MessageSchema);

    // Clear existing data
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    console.log("🧹 Cleared existing data");

    // Create test users
    const password = await bcrypt.hash("password123", 12);

    const alice = await User.create({
        email: "alice@connect.app",
        password,
        displayName: "Alice Johnson",
        about: "Full-stack developer & coffee enthusiast ☕",
    });

    const bob = await User.create({
        email: "bob@connect.app",
        password,
        displayName: "Bob Smith",
        about: "Designer | Pixel perfectionist 🎨",
    });

    console.log("👤 Created test users:");
    console.log("   alice@connect.app / password123");
    console.log("   bob@connect.app / password123");

    // Create a conversation
    const conversation = await Conversation.create({
        participants: [alice._id, bob._id],
    });

    // Sample messages
    const sampleMessages = [
        { sender: alice._id, content: "Hey Bob! 👋 Have you seen the new design?" },
        { sender: bob._id, content: "Hi Alice! Yes, it looks amazing. The dark theme is 🔥" },
        { sender: alice._id, content: "Glad you like it! I spent a lot of time on the glassmorphism effects." },
        { sender: bob._id, content: "The animations are really smooth too. Great work!" },
        { sender: alice._id, content: "Thanks! Let me know if you want to tweak anything." },
    ];

    let lastMsg: mongoose.Document | null = null;
    for (const msg of sampleMessages) {
        lastMsg = await Message.create({
            conversation: conversation._id,
            sender: msg.sender,
            content: msg.content,
            readBy: [msg.sender],
        });
        await new Promise((r) => setTimeout(r, 100));
    }

    await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: lastMsg!._id,
    });

    console.log("💬 Created sample conversation with 5 messages");
    console.log("\n✅ Seed complete!");

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
