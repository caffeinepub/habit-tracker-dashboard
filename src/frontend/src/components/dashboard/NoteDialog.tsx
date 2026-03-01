import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, X } from "lucide-react";
import { useState } from "react";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitName: string;
  habitEmoji: string;
  date: string;
  onSave: (note: string) => void;
  isSaving?: boolean;
}

export function NoteDialog({
  open,
  onOpenChange,
  habitName,
  habitEmoji,
  date,
  onSave,
  isSaving = false,
}: NoteDialogProps) {
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (note.trim()) {
      onSave(note.trim());
    }
    setNote("");
    onOpenChange(false);
  };

  const handleSkip = () => {
    setNote("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNote("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[380px] bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-base font-bold">
            <span className="text-xl">{habitEmoji}</span>
            <div>
              <div className="text-sm">Great work! ✨</div>
              <div className="text-xs font-normal text-muted-foreground mt-0.5">
                {habitName} — {date}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            How did it go? Add an optional note about this session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            placeholder="e.g. Felt great! Managed 30 minutes..."
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            className="bg-background/50 border-border/60 focus:border-primary/60 resize-none text-sm min-h-[80px]"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {note.length}/200
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground text-sm"
          >
            <X size={13} className="mr-1.5" />
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!note.trim() || isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? (
              <Loader2 size={13} className="mr-1.5 animate-spin" />
            ) : (
              <MessageSquare size={13} className="mr-1.5" />
            )}
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
