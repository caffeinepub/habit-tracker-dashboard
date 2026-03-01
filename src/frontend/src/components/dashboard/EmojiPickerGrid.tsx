import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const EMOJI_GRID = [
  // Health & fitness
  "💧",
  "🏃",
  "🏋️",
  "🧘",
  "😴",
  "🥗",
  "🥦",
  "🍎",
  "🚴",
  "🤸",
  "🧗",
  "🏊",
  // Mind & learning
  "📚",
  "🎓",
  "🧠",
  "📝",
  "✏️",
  "🎯",
  "💡",
  "🔬",
  "📖",
  "🗒️",
  // Work & productivity
  "💼",
  "💻",
  "⏰",
  "✅",
  "📊",
  "📈",
  "🗂️",
  "📋",
  // Finance
  "💰",
  "💵",
  "🏦",
  "📉",
  "💳",
  // Personal & creativity
  "🎨",
  "🎵",
  "🎭",
  "🎬",
  "📸",
  "🌱",
  "🌿",
  "🌸",
  "🌞",
  "🌙",
  // Motivation
  "🔥",
  "⭐",
  "🏆",
  "🥇",
  "💪",
  "🎉",
  "✨",
  "💎",
  "🚀",
  "🎖️",
  // Activities & hobbies
  "🎮",
  "🎹",
  "🎸",
  "⚽",
  "🏀",
  "🎾",
  "🏈",
  "🧩",
  "🎲",
  // Misc positive
  "🤗",
  "😊",
  "😄",
  "🙏",
  "❤️",
  "💚",
  "💙",
  "💜",
];

interface EmojiPickerGridProps {
  selected: string;
  onSelect: (emoji: string) => void;
  customEmoji: string;
  onCustomChange: (val: string) => void;
}

export function EmojiPickerGrid({
  selected,
  onSelect,
  customEmoji,
  onCustomChange,
}: EmojiPickerGridProps) {
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onCustomChange("");
      return;
    }
    const segmenter =
      typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new (
            Intl as unknown as {
              Segmenter: new (
                locale: string,
                opts: object,
              ) => {
                segment: (s: string) => Iterable<{ segment: string }>;
              };
            }
          ).Segmenter("en", { granularity: "grapheme" })
        : null;
    if (segmenter) {
      const segments = [...segmenter.segment(val)];
      onCustomChange(segments[0]?.segment ?? val.charAt(0));
    } else {
      onCustomChange(val.charAt(0));
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-foreground">Emoji</Label>
      <ScrollArea className="h-36 w-full rounded-xl border border-border/50 bg-background/40 p-2">
        <div className="grid grid-cols-10 gap-1">
          {EMOJI_GRID.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onSelect(e)}
              className={cn(
                "w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all duration-100 hover:scale-110 hover:bg-muted/60",
                selected === e
                  ? "bg-primary/20 ring-2 ring-primary/50 scale-110"
                  : "bg-transparent",
              )}
              aria-label={`Select ${e}`}
              title={e}
            >
              {e}
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Custom:
          </span>
          <Input
            placeholder="Type any emoji"
            value={customEmoji}
            onChange={handleCustomChange}
            className="bg-background/50 border-border/60 focus:border-primary/60 text-base w-20"
            aria-label="Custom emoji input"
          />
        </div>
        {selected && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Selected:</span>
            <span className="text-2xl leading-none">{selected}</span>
          </div>
        )}
      </div>
    </div>
  );
}
