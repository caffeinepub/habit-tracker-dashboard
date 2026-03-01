import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  Shield,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  id: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", id: "dashboard" },
  { icon: <ListChecks size={18} />, label: "Habits", id: "habits" },
  { icon: <BarChart3 size={18} />, label: "Analytics", id: "analytics" },
  { icon: <Trophy size={18} />, label: "Achievements", id: "achievements" },
  { icon: <BarChart2 size={18} />, label: "Stats", id: "stats" },
  { icon: <Trophy size={18} />, label: "Leaderboard", id: "leaderboard" },
  { icon: <Settings size={18} />, label: "Settings", id: "settings" },
];

const ADMIN_PRINCIPAL =
  "h3k33-vzkys-gtpvb-j7eqr-rvkzy-mzzsd-ll3yr-u36x5-hfopd-jkaib-hae";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  userName?: string;
  userPrincipal?: string;
  userPoints?: number;
  avatarBase64?: string;
  onLogout?: () => void;
  onAdminTokenSubmit?: (token: string) => void;
}

function getLevelInfo(points: number): { label: string; color: string } {
  if (points >= 5000) return { label: "Master", color: "#f59e0b" };
  if (points >= 2000) return { label: "Expert", color: "#8b5cf6" };
  if (points >= 500) return { label: "Intermediate", color: "#3b82f6" };
  return { label: "Beginner", color: "#6b7280" };
}

export function Sidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  isAdmin,
  userName,
  userPrincipal,
  userPoints,
  avatarBase64,
  onLogout,
  onAdminTokenSubmit,
}: SidebarProps) {
  const [copied, setCopied] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [tokenError, setTokenError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdminAccessClick = () => {
    setShowTokenInput((v) => !v);
    setTokenValue("");
    setTokenError(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleTokenSubmit = () => {
    const token = tokenValue.trim();
    if (!token) return;
    if (token === ADMIN_PRINCIPAL) {
      setTokenError(false);
      setTokenValue("");
      setShowTokenInput(false);
      if (onAdminTokenSubmit) onAdminTokenSubmit(token);
    } else {
      setTokenError(true);
    }
  };

  const handleCopyPrincipal = () => {
    if (!userPrincipal) return;
    navigator.clipboard.writeText(userPrincipal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const truncatedPrincipal = userPrincipal
    ? `${userPrincipal.slice(0, 12)}...${userPrincipal.slice(-6)}`
    : "";

  const handleNavClick = (id: string) => {
    onSectionChange(id);
    // Scroll to section (not applicable for admin view)
    if (id !== "admin") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    onClose();
  };

  const displayName =
    userName || (userPrincipal ? `${userPrincipal.slice(0, 8)}...` : "You");

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center shadow-glow-purple animate-pulse-glow">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">
            HabitFlow
          </h1>
          <p className="text-xs text-muted-foreground">Track. Grow. Thrive.</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "sidebar-active text-sidebar-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-sidebar-foreground",
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <ChevronRight size={14} className="text-primary opacity-70" />
              )}
            </button>
          );
        })}

        {/* Admin nav item — only shown to admins */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleNavClick("admin")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              activeSection === "admin"
                ? "sidebar-active text-sidebar-foreground"
                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
            )}
          >
            <span
              className={cn(
                "transition-colors",
                activeSection === "admin"
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-sidebar-foreground",
              )}
            >
              <Shield size={18} />
            </span>
            <span className="flex-1 text-left">Admin</span>
            {activeSection === "admin" && (
              <ChevronRight size={14} className="text-primary opacity-70" />
            )}
          </button>
        )}

        {/* Admin Access token entry — shown to non-admins */}
        {!isAdmin && (
          <div className="mt-2">
            <button
              type="button"
              onClick={handleAdminAccessClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 group"
            >
              <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors">
                <KeyRound size={18} />
              </span>
              <span className="flex-1 text-left">Admin Access</span>
            </button>

            <AnimatePresence>
              {showTokenInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 px-1 space-y-2">
                    <p className="text-xs text-muted-foreground px-2">
                      Paste your admin token below:
                    </p>
                    <input
                      ref={inputRef}
                      type="text"
                      value={tokenValue}
                      onChange={(e) => {
                        setTokenValue(e.target.value);
                        setTokenError(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTokenSubmit();
                        if (e.key === "Escape") setShowTokenInput(false);
                      }}
                      placeholder="Paste token here..."
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-xs font-mono bg-sidebar-accent border text-sidebar-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-colors",
                        tokenError
                          ? "border-destructive focus:ring-destructive"
                          : "border-sidebar-border",
                      )}
                    />
                    {tokenError && (
                      <p className="text-xs text-destructive px-2">
                        Invalid token. Try again.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleTokenSubmit}
                        className="flex-1 h-8 text-xs"
                      >
                        Go to Admin
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowTokenInput(false)}
                        className="h-8 text-xs text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Bottom user */}
      <div className="px-3 pb-6 border-t border-sidebar-border pt-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/50">
          <div
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border/30"
            style={{
              background: avatarBase64
                ? "transparent"
                : "linear-gradient(135deg, oklch(0.62 0.22 290), oklch(0.68 0.18 330))",
            }}
          >
            {avatarBase64 ? (
              <img
                src={avatarBase64}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : userName ? (
              <span className="text-xs font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={14} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              {userPoints !== undefined && (
                <span
                  className="text-[9px] font-bold px-1 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: `${getLevelInfo(userPoints).color}20`,
                    color: getLevelInfo(userPoints).color,
                  }}
                >
                  {getLevelInfo(userPoints).label}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">HabitFlow Member</p>
          </div>
        </div>
        {userPrincipal && (
          <div className="px-3 py-2.5 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Your Principal ID
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-sidebar-foreground font-mono truncate leading-relaxed">
                {truncatedPrincipal}
              </code>
              <button
                type="button"
                onClick={handleCopyPrincipal}
                title="Copy full Principal ID"
                className={cn(
                  "shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200",
                  copied
                    ? "bg-green-500/20 text-green-400"
                    : "bg-sidebar-accent hover:bg-primary/20 hover:text-primary text-muted-foreground",
                )}
              >
                {copied ? (
                  <>
                    <Check size={12} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-sidebar-accent/50 transition-colors">
          <span className="text-sm font-medium text-muted-foreground">
            Theme
          </span>
          <ThemeToggle />
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 overflow-y-auto shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 lg:hidden overflow-y-auto"
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
