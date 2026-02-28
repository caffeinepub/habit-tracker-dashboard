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
import { Loader2, Phone, Smile } from "lucide-react";
import { useState } from "react";

interface ProfileSetupModalProps {
  open: boolean;
  onSave: (name: string, mobile: string) => void;
  isSaving: boolean;
}

export function ProfileSetupModal({
  open,
  onSave,
  isSaving,
}: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, mobile.trim());
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md card-surface border-border/50"
        // Prevent closing by clicking outside or pressing Escape
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center shadow-glow-purple">
              <Smile size={26} className="text-white" />
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
