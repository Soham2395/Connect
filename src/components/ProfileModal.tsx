"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { IUserBase as IUser } from "@/models/User";

interface ProfileModalProps {
    onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
    const { user, updateProfile, logout } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [about, setAbout] = useState(user?.about || "");
    const [avatar, setAvatar] = useState(user?.avatar || "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setMessage({ type: "", text: "" });

        try {
            await updateProfile({ displayName, about, avatar });
            setMessage({ type: "success", text: "Profile updated successfully!" });
            setTimeout(onClose, 2000);
        } catch (err) {
            setMessage({ type: "error", text: "Failed to update profile" });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-lg glass-card rounded-[3rem] p-10 shadow-premium relative overflow-hidden">
                <div className="absolute top-8 right-8">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Profile Settings</h2>
                    <p className="text-foreground/50 font-medium">Customize your online identity</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 animate-fade-in ${message.type === "success" ? "bg-online/10 text-online" : "bg-danger/10 text-danger"
                            }`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {message.text}
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-4 mb-2">
                        <div className="relative group">
                            <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-500 shadow-xl">
                                <img
                                    src={avatar || `https://ui-avatars.com/api/?name=${displayName}&background=6c5ce7&color=fff&size=128`}
                                    alt="Preview"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-foreground/50 ml-1 uppercase tracking-widest">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-5 py-3.5 bg-tertiary/50 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-foreground/50 ml-1 uppercase tracking-widest">About / Status</label>
                            <input
                                type="text"
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                className="w-full px-5 py-3.5 bg-tertiary/50 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-foreground/50 ml-1 uppercase tracking-widest">Avatar URL (Optional)</label>
                            <input
                                type="text"
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                className="w-full px-5 py-3.5 bg-tertiary/50 border border-border rounded-2xl text-foreground placeholder-foreground/20 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                placeholder="https://example.com/photo.jpg"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transform transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { logout(); onClose(); }}
                            className="w-full py-4 bg-danger/10 hover:bg-danger text-danger hover:text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
                        >
                            Log Out
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
