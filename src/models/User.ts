import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserBase {
    _id: string;
    email: string;
    password?: string;
    displayName: string;
    about: string;
    avatar: string;
    isOnline: boolean;
    lastSeen: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface IUser extends Document, Omit<IUserBase, "_id" | "lastSeen" | "createdAt" | "updatedAt"> {
    _id: mongoose.Types.ObjectId;
    lastSeen: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        about: {
            type: String,
            default: "Hey there! I'm using Connect.",
            maxlength: 200,
        },
        avatar: {
            type: String,
            default: "",
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

UserSchema.index({ email: 1 });
UserSchema.index({ displayName: "text", email: "text" });

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
