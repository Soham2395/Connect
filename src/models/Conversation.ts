import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversationBase {
    _id: string;
    participants: string[] | any[];
    lastMessage: string | any | null;
    updatedAt: Date | string;
    createdAt: Date | string;
}

export interface IConversation extends Document, Omit<IConversationBase, "_id" | "participants" | "lastMessage" | "updatedAt" | "createdAt"> {
    _id: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    lastMessage: mongoose.Types.ObjectId | null;
}

const ConversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation: Model<IConversation> =
    mongoose.models.Conversation ||
    mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
