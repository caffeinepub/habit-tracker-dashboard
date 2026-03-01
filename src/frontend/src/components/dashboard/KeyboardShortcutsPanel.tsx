import { cn } from "@/lib/utils";
import { Keyboard, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ShortcutRowProps {
  keys: string[];
  description: string;
}

function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((key, i) => (
          <span key={key}>
            <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-md text-xs font-semibold font-mono bg-muted/60 border border-border/60 text-foreground shadow-sm">
              {key}
            </kbd>
            {i < keys.length - 1 && (
              <span className="text-xs text-muted-foreground mx-1">or</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsPanel({
  open,
  onClose,
}: KeyboardShortcutsPanelProps) {
  const shortcuts = [
    { keys: ["N", "A"], description: "Add new habit (opens modal)" },
    { keys: ["/"], description: "Focus quick-add input" },
    { keys: ["C"], description: "Complete all habits for today" },
    { keys: ["1–9"], description: "Toggle habit by position in list" },
    { keys: ["Esc"], description: "Close open modal or panel" },
    { keys: ["?"], description: "Toggle this shortcuts panel" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "w-full max-w-sm card-surface rounded-2xl p-6 shadow-2xl",
              "border border-border/50",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Keyboard size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Keyboard Shortcuts
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Power user controls
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Close keyboard shortcuts"
              >
                <X size={15} />
              </button>
            </div>

            {/* Shortcuts */}
            <div className="divide-y divide-border/40">
              {shortcuts.map((s) => (
                <ShortcutRow
                  key={s.description}
                  keys={s.keys}
                  description={s.description}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2">
              <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-md text-xs font-semibold font-mono bg-muted/60 border border-border/60 text-foreground shadow-sm">
                ?
              </kbd>
              <span className="text-xs text-muted-foreground">
                Press again to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
