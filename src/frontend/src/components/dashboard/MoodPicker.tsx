import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useState } from "react";

const MOODS = [
  { emoji: "😔", label: "Rough", value: "rough", color: "#6b7280" },
  { emoji: "😕", label: "Tough", value: "tough", color: "#f97316" },
  { emoji: "😐", label: "Okay", value: "okay", color: "#eab308" },
  { emoji: "😊", label: "Good", value: "good", color: "#22c55e" },
  { emoji: "😄", label: "Amazing", value: "amazing", color: "#3b82f6" },
] as const;

type MoodValue = (typeof MOODS)[number]["value"];

interface MoodPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onSave: (mood: string) => void;
}

export function MoodPicker({
  open,
  onOpenChange,
  date,
  onSave,
}: MoodPickerProps) {
  const [selected, setSelected] = useState<MoodValue | null>(null);

  const handleSave = () => {
    if (selected) {
      onSave(selected);
      setSelected(null);
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    setSelected(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-foreground">
            🎉 Perfect Day!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            You completed all your habits on <strong>{date}</strong>! How are
            you feeling?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end justify-center gap-3 py-4">
          {MOODS.map((mood, i) => (
            <motion.button
              key={mood.value}
              type="button"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.07, ease: "easeOut" }}
              onClick={() => setSelected(mood.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                selected === mood.value
                  ? "scale-110 shadow-lg"
                  : "border-border/40 bg-muted/10 hover:bg-muted/30 hover:scale-105",
              )}
              style={
                selected === mood.value
                  ? {
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}15`,
                    }
                  : {}
              }
              aria-label={`Mood: ${mood.label}`}
              aria-pressed={selected === mood.value}
            >
              <span
                className="text-3xl leading-none"
                style={{
                  filter:
                    selected === mood.value
                      ? "drop-shadow(0 0 8px currentColor)"
                      : "none",
                  fontSize: selected === mood.value ? "2.2rem" : "1.875rem",
                  transition: "font-size 0.2s ease",
                }}
              >
                {mood.emoji}
              </span>
              <span
                className="text-[11px] font-semibold"
                style={{
                  color: selected === mood.value ? mood.color : undefined,
                }}
              >
                {mood.label}
              </span>
            </motion.button>
          ))}
        </div>

        <div className="flex justify-center gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground text-sm"
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!selected}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
          >
            Save Mood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
