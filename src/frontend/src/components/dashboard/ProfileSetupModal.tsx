import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Phone, Smile } from "lucide-react";
import { useRef, useState } from "react";

interface ProfileSetupModalProps {
  open: boolean;
  onSave: (name: string, mobile: string, avatarBase64?: string) => void;
  isSaving: boolean;
}

export function ProfileSetupModal({
  open,
  onSave,
  isSaving,
}: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [avatarBase64, setAvatarBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, mobile.trim(), avatarBase64 || undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setAvatarBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const initials = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md card-surface border-border/50"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-3">
            {/* Avatar upload circle */}
            <div className="relative group">
              <button
                type="button"
                className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border-2 border-primary/30 hover:border-primary/60 transition-colors"
                style={{
                  background: avatarBase64
                    ? "transparent"
                    : "linear-gradient(135deg, oklch(0.62 0.22 290), oklch(0.68 0.18 330))",
                }}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload avatar"
              >
                {avatarBase64 ? (
                  <img
                    src={avatarBase64}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {name ? initials : <Smile size={26} />}
                  </span>
                )}
                {/* Camera overlay on hover */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={18} className="text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Upload profile picture"
              />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Welcome to HabitFlow!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Let's set up your profile to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Your Name</Label>
            <Input
              id="profile-name"
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              autoFocus
              className="bg-muted/30 border-border/50 focus:border-primary/60"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="profile-mobile"
              className="flex items-center gap-1.5"
            >
              <Phone size={13} className="text-muted-foreground" />
              Mobile Number
            </Label>
            <Input
              id="profile-mobile"
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              autoComplete="tel"
              className="bg-muted/30 border-border/50 focus:border-primary/60"
            />
            <p className="text-xs text-muted-foreground">
              Required for WhatsApp reminders
            </p>
          </div>

          <Button
            type="submit"
            disabled={!name.trim() || !mobile.trim() || isSaving}
            className="w-full bg-gradient-to-r from-primary to-chart-5 hover:opacity-90"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
