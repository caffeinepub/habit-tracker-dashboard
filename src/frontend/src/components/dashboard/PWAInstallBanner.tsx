import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface PWAInstallBannerProps {
  isInstallable: boolean;
  promptInstall: () => Promise<void>;
}

const DISMISS_KEY = "habitflow-pwa-banner-dismissed";

export function PWAInstallBanner({
  isInstallable,
  promptInstall,
}: PWAInstallBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISS_KEY) === "1";
  });

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handleInstall = async () => {
    await promptInstall();
    setDismissed(true);
  };

  const show = isInstallable && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-2.5 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.04 290), oklch(0.15 0.03 265))",
            borderBottom: "1px solid oklch(0.62 0.22 290 / 0.3)",
            paddingTop: "calc(0.625rem + env(safe-area-inset-top))",
          }}
        >
          {/* App icon */}
          <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10">
            <img
              src="/assets/generated/habitflow-icon.dim_512x512.png"
              alt="HabitFlow"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">
              Install HabitFlow
            </p>
            <p className="text-xs text-white/60 leading-tight truncate">
              Add to your home screen for the best experience
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download size={13} />
              Install
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss install banner"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
