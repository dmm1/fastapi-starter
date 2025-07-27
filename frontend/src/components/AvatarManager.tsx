import { useState, useRef } from "react";
import { Camera, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { useAuthStore } from "../stores/auth";

interface AvatarManagerProps {
    user: any;
    onAvatarUpdate?: (avatarUrl: string) => void;
}

export function AvatarManager({ user, onAvatarUpdate }: AvatarManagerProps) {
    const { uploadAvatar, deleteAvatar, isLoading } = useAuthStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentAvatarUrl = user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstname || user?.username}`;

    function handleAvatarClick() {
        setIsDialogOpen(true);
    }

    function handleFileSelect(file: File) {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setDragActive(true);
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault();
        setDragActive(false);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }

    async function handleUpload() {
        if (!selectedFile) return;

        const result = await uploadAvatar(selectedFile);
        if (result.success) {
            setIsDialogOpen(false);
            setSelectedFile(null);
            setPreviewUrl("");
            if (onAvatarUpdate && result.avatar_url) {
                onAvatarUpdate(result.avatar_url);
            }
        }
    }

    async function handleDelete() {
        const result = await deleteAvatar();
        if (result.success) {
            setIsDialogOpen(false);
            if (onAvatarUpdate) {
                onAvatarUpdate(""); // Clear the avatar
            }
        }
    }

    function resetSelection() {
        setSelectedFile(null);
        setPreviewUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function closeDialog() {
        setIsDialogOpen(false);
        resetSelection();
    }

    return (
        <>
            <div className="relative">
                <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage
                        src={currentAvatarUrl}
                        alt={user?.username}
                    />
                    <AvatarFallback className="text-lg">
                        {(user?.firstname?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={handleAvatarClick}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Camera className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage Avatar</DialogTitle>
                        <DialogDescription>
                            Upload a new profile picture or remove your current avatar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Current Avatar Preview */}
                        <div className="flex items-center justify-center">
                            <Avatar className="h-24 w-24">
                                <AvatarImage
                                    src={previewUrl || currentAvatarUrl}
                                    alt="Avatar preview"
                                />
                                <AvatarFallback className="text-xl">
                                    {(user?.firstname?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* File Upload Area */}
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Drag and drop an image, or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    PNG, JPG, GIF up to 5MB
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Choose File
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {selectedFile && (
                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetSelection}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <div className="flex items-center justify-between w-full">
                            <div>
                                {user?.avatar && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDelete}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="mr-2 h-4 w-4" />
                                        )}
                                        Delete Current
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={closeDialog}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
