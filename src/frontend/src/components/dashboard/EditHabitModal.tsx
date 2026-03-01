import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Pencil, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Habit } from "../../backend.d";
import { useGetHabitNotes, useSetHabitGoal } from "../../hooks/useQueries";
import { CATEGORY_COLORS, DIFFICULTY_COLORS } from "./AddHabitModal";
import { EmojiPickerGrid } from "./EmojiPickerGrid";

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

const CATEGORIES = [
  "Health",
  "Work",
  "Personal",
  "Finance",
  "Learning",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy", color: "#22c55e", pts: 10 },
  { value: "medium", label: "Medium", color: "#eab308", pts: 20 },
  { value: "hard", label: "Hard", color: "#ef4444", pts: 30 },
] as const;

interface EditHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
  onEdit: (
    habitId: bigint,
    name: string,
    emoji: string,
    color: string,
    category: string,
    difficulty: string,
  ) => void;
  isLoading: boolean;
}

export function EditHabitModal({
  open,
  onOpenChange,
  habit,
  onEdit,
  isLoading,
}: EditHabitModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [customEmoji, setCustomEmoji] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [category, setCategory] = useState<string>("Health");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTargetCount, setGoalTargetCount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  const setHabitGoalMutation = useSetHabitGoal();
  const { data: habitNotes = [] } = useGetHabitNotes(
    open && habit ? habit.id : null,
  );

  const activeEmoji = customEmoji || emoji;

  // Populate fields when habit changes
  useEffect(() => {
    if (habit) {
      setName(habit.name);
      const habitEmoji = habit.emoji || "⭐";
      setEmoji(habitEmoji);
      setCustomEmoji("");
      setSelectedColor(habit.color || COLOR_OPTIONS[0].value);
      setCategory(habit.category || "Health");
      setDifficulty(habit.difficulty || "medium");
      setGoalDescription(habit.goalDescription || "");
      setGoalTargetCount(
        habit.goalTargetCount && Number(habit.goalTargetCount) > 0
          ? habit.goalTargetCount.toString()
          : "",
      );
      setGoalDeadline(habit.goalDeadline || "");
      if (habit.goalDescription || Number(habit.goalTargetCount) > 0) {
        setGoalOpen(true);
      }
    }
  }, [habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit || !name.trim()) return;
    onEdit(
      habit.id,
      name.trim(),
      activeEmoji || "⭐",
      selectedColor,
      category,
      difficulty,
    );
    // Also save goal if filled
    if (
      habit &&
      (goalDescription.trim() ||
        (goalTargetCount && Number(goalTargetCount) > 0))
    ) {
      setHabitGoalMutation.mutate(
        {
          habitId: habit.id,
          description: goalDescription.trim(),
          targetCount: goalTargetCount ? BigInt(goalTargetCount) : 0n,
          deadline: goalDeadline,
        },
        {
          onSuccess: () => toast.success("Goal saved!"),
          onError: () => toast.error("Failed to save goal."),
        },
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
    }
  };

  if (!habit) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{
                backgroundColor: `${selectedColor}33`,
                border: `1px solid ${selectedColor}55`,
              }}
            >
              {activeEmoji || "⭐"}
            </div>
            Edit Habit
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Update your habit details. Your streak and history are preserved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Habit Name */}
          <div className="space-y-2">
            <Label
              htmlFor="edit-habit-name"
              className="text-sm font-semibold text-foreground"
            >
              Habit Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-habit-name"
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

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background/50 border-border/60">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                      />
                      {cat}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Difficulty
            </Label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-150",
                    difficulty === d.value
                      ? "scale-[1.02]"
                      : "border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                  style={
                    difficulty === d.value
                      ? {
                          borderColor: d.color,
                          backgroundColor: `${d.color}18`,
                          color: d.color,
                        }
                      : {}
                  }
                  aria-pressed={difficulty === d.value}
                >
                  {d.label}
                  <span className="text-[10px] opacity-75">+{d.pts}pts</span>
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Grid Picker */}
          <EmojiPickerGrid
            selected={emoji}
            onSelect={(e) => {
              setEmoji(e);
              setCustomEmoji("");
            }}
            customEmoji={customEmoji}
            onCustomChange={(val) => {
              setCustomEmoji(val);
              if (val) setEmoji("");
            }}
          />

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

          {/* Goal Section */}
          <Collapsible open={goalOpen} onOpenChange={setGoalOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Target size={14} />
                {habit.goalDescription || Number(habit.goalTargetCount) > 0
                  ? "Edit Goal"
                  : "Set a Goal (optional)"}
                <ChevronDown
                  size={14}
                  className={cn(
                    "ml-auto transition-transform duration-200",
                    goalOpen && "rotate-180",
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="p-3 rounded-xl border border-border/40 bg-background/30 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Goal description
                  </Label>
                  <Input
                    placeholder="e.g. Run 100km this month"
                    value={goalDescription}
                    onChange={(e) =>
                      setGoalDescription(e.target.value.slice(0, 60))
                    }
                    className="bg-background/50 border-border/60 focus:border-primary/60 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Target count
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 30"
                      value={goalTargetCount}
                      onChange={(e) => setGoalTargetCount(e.target.value)}
                      className="bg-background/50 border-border/60 focus:border-primary/60 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Deadline
                    </Label>
                    <Input
                      type="date"
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                      className="bg-background/50 border-border/60 focus:border-primary/60 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Past Notes Section */}
          {habitNotes.length > 0 && (
            <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <span>📝</span>
                  Past Notes ({habitNotes.length})
                  <ChevronDown
                    size={14}
                    className={cn(
                      "ml-auto transition-transform duration-200",
                      notesOpen && "rotate-180",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {[...habitNotes]
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([date, note]) => (
                      <div
                        key={date}
                        className="p-2.5 rounded-lg bg-muted/20 border border-border/40"
                      >
                        <p className="text-[10px] text-muted-foreground mb-1">
                          {date}
                        </p>
                        <p className="text-xs text-foreground">{note}</p>
                      </div>
                    ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Preview */}
          <div className="p-3 rounded-xl border border-border/40 bg-background/30 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{
                backgroundColor: `${selectedColor}33`,
                border: `1px solid ${selectedColor}44`,
              }}
            >
              {activeEmoji || "⭐"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {name || "Your habit name"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[category as Category] ?? "#6b7280",
                  }}
                />
                <p className="text-xs text-muted-foreground">{category}</p>
                {difficulty && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${DIFFICULTY_COLORS[difficulty]}20`,
                      color: DIFFICULTY_COLORS[difficulty],
                    }}
                  >
                    {difficulty}
                  </span>
                )}
              </div>
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
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
