import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { AdminDashboard } from "./AdminDashboard";

interface AdminDirectViewProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  isLoggingIn: boolean;
}

export function AdminDirectView({
  isAuthenticated,
  onLogin,
  isLoggingIn,
}: AdminDirectViewProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Admin header bar */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center shadow-glow-purple">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">
            HabitFlow
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Shield size={9} />
            Admin Panel
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Direct admin access
          </span>
          {!isAuthenticated && (
            <Button
              size="sm"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="h-8 text-xs bg-gradient-to-r from-primary to-chart-5 hover:opacity-90"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Fingerprint size={13} className="mr-1.5" />
                  Login to load data
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Login banner (shown when not authenticated) */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-6 mt-4 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Shield size={15} className="text-primary shrink-0" />
            <p className="text-xs text-foreground/80">
              <span className="font-semibold text-primary">
                Login with Internet Identity
              </span>{" "}
              to view live admin data. The panel is visible but data will be
              empty until you authenticate.
            </p>
          </div>
          <Button
            size="sm"
            onClick={onLogin}
            disabled={isLoggingIn}
            className="shrink-0 h-8 text-xs bg-gradient-to-r from-primary to-chart-5 hover:opacity-90"
          >
            {isLoggingIn ? (
              <>
                <Loader2 size={12} className="mr-1.5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Fingerprint size={12} className="mr-1.5" />
                Login
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Admin dashboard content */}
      <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">
        <AdminDashboard />
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground/50">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/60 hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
