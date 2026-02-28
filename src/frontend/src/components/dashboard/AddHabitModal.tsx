import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

const COLOR_OPTIONS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f97316", label: "Orange" },
  { value: "#a855f7", label: "Purple" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#ef4444", label: "Red" },
  { value: "#eab308", label: "Yellow" },
  { value: "#ec4899", label: "Pink" },
];

const EMOJI_SUGGESTIONS = [
  "⭐",
  "💧",
  "🏃",
  "📚",
  "🧘",
  "😴",
  "🎯",
  "💪",
  "🥗",
  "🎨",
  "🎵",
  "🌱",
];

interface AddHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, emoji: string, color: string) => void;
  isLoading: boolean;
}

export function AddHabitModal({
  open,
  onOpenChange,
  onAdd,
  isLoading,
}: AddHabitModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), emoji || "⭐", selectedColor);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      if (!newOpen) {
        // Reset form on close
        setName("");
        setEmoji("⭐");
        setSelectedColor(COLOR_OPTIONS[0].value);
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{
                backgroundColor: `${selectedColor}33`,
                border: `1px solid ${selectedColor}55`,
              }}
            >
              {emoji || "⭐"}
            </div>
            Add New Habit
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Create a new daily habit to track. Consistency is key!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-1">
          {/* Habit Name */}
          <div className="space-y-2">
            <Label
              htmlFor="habit-name"
              className="text-sm font-semibold text-foreground"
            >
              Habit Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="habit-name"
              placeholder="e.g. Drink 8 glasses of water"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              maxLength={30}
              required
              autoFocus
              className="bg-background/50 border-border/60 focus:border-primary/60"
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {name.length}/30
            </p>
          </div>

          {/* Emoji */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Emoji
            </Label>
            <div className="space-y-2">
              <Input
                placeholder="Enter any emoji"
                value={emoji}
                onChange={(e) => {
                  // Take only the first grapheme cluster (emoji)
                  const val = e.target.value;
                  if (val === "") {
                    setEmoji("");
                  } else {
                    // Extract first emoji/character
                    const segmenter =
                      typeof Intl !== "undefined" && "Segmenter" in Intl
                        ? new (
                            Intl as unknown as {
                              Segmenter: new (
                                locale: string,
                                opts: object,
                              ) => {
                                segment: (
                                  s: string,
                                ) => Iterable<{ segment: string }>;
                              };
                            }
                          ).Segmenter("en", { granularity: "grapheme" })
                        : null;
                    if (segmenter) {
                      const segments = [...segmenter.segment(val)];
                      setEmoji(segments[0]?.segment ?? val.charAt(0));
                    } else {
                      setEmoji(val.charAt(0));
                    }
                  }
                }}
                className="bg-background/50 border-border/60 focus:border-primary/60 text-lg w-24"
              />
              <div className="flex flex-wrap gap-2">
                {EMOJI_SUGGESTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all duration-150 hover:scale-110",
                      emoji === e
                        ? "bg-primary/20 border-2 border-primary/60 scale-110"
                        : "bg-muted/40 border border-border/40 hover:bg-muted/70",
                    )}
                    aria-label={`Select ${e} emoji`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Color
            </Label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all duration-150 hover:scale-110",
                    selectedColor === c.value
                      ? "ring-2 ring-offset-2 ring-offset-card scale-110"
                      : "ring-1 ring-border/30",
                  )}
                  style={{
                    backgroundColor: c.value,
                    ...(selectedColor === c.value
                      ? { boxShadow: `0 0 0 2px ${c.value}` }
                      : {}),
                  }}
                  aria-label={`Select ${c.label} color`}
                  aria-pressed={selectedColor === c.value}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-xl border border-border/40 bg-background/30 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{
                backgroundColor: `${selectedColor}33`,
                border: `1px solid ${selectedColor}44`,
              }}
            >
              {emoji || "⭐"}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {name || "Your habit name"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles size={9} />
                Preview
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="border-border/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Add Habit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
