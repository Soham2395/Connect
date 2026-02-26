import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessageBase {
    _id: string;
    conversation: string;
    sender: string | any;
    content: string;
    readBy: string[];
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IMessage extends Document, Omit<IMessageBase, "_id" | "conversation" | "sender" | "readBy" | "createdAt" | "updatedAt"> {
    _id: mongoose.Types.ObjectId;
    conversation: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    readBy: mongoose.Types.ObjectId[];
}

const MessageSchema = new Schema<IMessage>(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000,
        },
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

const Message: Model<IMessage> =
    mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
