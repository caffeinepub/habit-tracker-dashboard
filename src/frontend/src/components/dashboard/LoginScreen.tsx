import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, Shield, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";

const ADMIN_PRINCIPAL =
  "h3k33-vzkys-gtpvb-j7eqr-rvkzy-mzzsd-ll3yr-u36x5-hfopd-jkaib-hae";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

export function LoginScreen({ onLogin, isLoggingIn }: LoginScreenProps) {
  function handleOpenAdminPanel() {
    window.open(
      `${window.location.origin + window.location.pathname}#adminDirect=${ADMIN_PRINCIPAL}`,
      "_blank",
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-chart-5/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-chart-2/4 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center shadow-glow-purple animate-pulse-glow">
                <Zap size={36} className="text-white" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-5/20 blur-md -z-10" />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
              HabitFlow
            </h1>
            <p className="text-muted-foreground text-base mb-8">
              Build better habits. Track your progress. <br />
              Achieve your goals — one day at a time.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-3 gap-4 mb-10"
          >
            {[
              { icon: <TrendingUp size={18} />, label: "Track Streaks" },
              { icon: <Shield size={18} />, label: "Private & Secure" },
              { icon: <Zap size={18} />, label: "Daily Insights" },
            ].map((f) => (
              <div
                key={f.label}
                className="card-surface rounded-xl px-3 py-4 flex flex-col items-center gap-2"
              >
                <span className="text-primary">{f.icon}</span>
                <span className="text-xs text-muted-foreground font-medium leading-tight text-center">
                  {f.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Login button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Button
              onClick={onLogin}
              disabled={isLoggingIn}
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-chart-5 hover:opacity-90 transition-opacity shadow-glow-purple"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Fingerprint size={20} className="mr-2" />
                  Login with Internet Identity
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Internet Identity provides secure, anonymous login — no password
              needed.
            </p>

            {/* Admin access button */}
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAdminPanel}
                className="w-full h-10 text-xs border-border/50 hover:border-primary/40 hover:text-primary text-muted-foreground"
              >
                <Shield size={14} className="mr-2" />
                Admin Access
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
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
      </div>
    </div>
  );
}
