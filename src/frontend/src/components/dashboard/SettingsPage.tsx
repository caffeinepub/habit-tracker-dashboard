import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Camera,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Phone,
  Save,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { type Theme, useTheme } from "../../hooks/useTheme";

const ACCENT_PRESETS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#22c55e", label: "Green" },
  { value: "#f97316", label: "Orange" },
  { value: "#ec4899", label: "Pink" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#ef4444", label: "Red" },
  { value: "#6366f1", label: "Indigo" },
];

interface SettingsPageProps {
  currentName?: string;
  currentMobile?: string;
  currentAvatarBase64?: string;
  currentAccentColor?: string;
  onSave: (
    name: string,
    mobile: string,
    avatarBase64?: string,
    accentColor?: string,
  ) => void;
  isSaving: boolean;
}

export function SettingsPage({
  currentName,
  currentMobile,
  currentAvatarBase64,
  currentAccentColor,
  onSave,
  isSaving,
}: SettingsPageProps) {
  const [name, setName] = useState(currentName ?? "");
  const [mobile, setMobile] = useState(currentMobile ?? "");
  const [avatarBase64, setAvatarBase64] = useState(currentAvatarBase64 ?? "");
  const [accentColor, setAccentColor] = useState(
    currentAccentColor ?? "#6366f1",
  );
  const [nameError, setNameError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentName !== undefined) setName(currentName);
  }, [currentName]);

  useEffect(() => {
    if (currentMobile !== undefined) setMobile(currentMobile);
  }, [currentMobile]);

  useEffect(() => {
    if (currentAvatarBase64 !== undefined) setAvatarBase64(currentAvatarBase64);
  }, [currentAvatarBase64]);

  useEffect(() => {
    if (currentAccentColor !== undefined) setAccentColor(currentAccentColor);
  }, [currentAccentColor]);

  // Apply accent color live
  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty(
        "--accent-custom",
        accentColor,
      );
    }
  }, [accentColor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setAvatarBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("Display name is required.");
      valid = false;
    } else {
      setNameError("");
    }
    if (!mobile.trim()) {
      setMobileError("Mobile number is required for WhatsApp reminders.");
      valid = false;
    } else {
      setMobileError("");
    }
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(
      name.trim(),
      mobile.trim(),
      avatarBase64 || undefined,
      accentColor || undefined,
    );
  };

  const isDirty =
    name !== (currentName ?? "") ||
    mobile !== (currentMobile ?? "") ||
    avatarBase64 !== (currentAvatarBase64 ?? "") ||
    accentColor !== (currentAccentColor ?? "#6366f1");

  const initials = name ? name.slice(0, 2).toUpperCase() : "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
            Account
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update your profile details anytime
        </p>
      </div>

      {/* Appearance card */}
      <div className="card-surface rounded-2xl p-6 max-w-lg mb-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-3/20 to-chart-4/20 border border-chart-3/20 flex items-center justify-center shrink-0">
            <Sun size={18} className="text-chart-3" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Appearance
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose your preferred theme
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ] as { value: Theme; label: string; icon: React.ElementType }[]
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200",
                theme === value
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40",
              )}
            >
              <Icon size={18} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>

        {/* Accent Color */}
        <div className="mt-5 pt-5 border-t border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={15} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Accent Color</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setAccentColor(preset.value)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all duration-150 hover:scale-110",
                  accentColor === preset.value
                    ? "ring-2 ring-offset-2 ring-offset-card scale-110"
                    : "ring-1 ring-border/30",
                )}
                style={{
                  backgroundColor: preset.value,
                  ...(accentColor === preset.value
                    ? { boxShadow: `0 0 0 2px ${preset.value}` }
                    : {}),
                }}
                aria-label={`${preset.label} accent`}
                aria-pressed={accentColor === preset.value}
                title={preset.label}
              />
            ))}
            {/* Custom color picker */}
            <label
              className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-border/30 hover:scale-110 transition-transform cursor-pointer shrink-0"
              title="Custom color"
              style={{
                background:
                  "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
              }}
            >
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-full h-full opacity-0 cursor-pointer"
                aria-label="Custom accent color"
              />
            </label>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-4 h-4 rounded-full shrink-0 border border-border/30"
              style={{ backgroundColor: accentColor }}
            />
            <p className="text-xs text-muted-foreground">
              Current:{" "}
              <span className="font-mono font-semibold">{accentColor}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Settings card */}
      <div className="card-surface rounded-2xl p-6 max-w-lg">
        {/* Card header */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-chart-5/20 border border-primary/20 flex items-center justify-center shrink-0">
            <Settings size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Profile Settings
            </h3>
            <p className="text-xs text-muted-foreground">
              Your name, photo, and mobile number
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <button
                type="button"
                className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border-2 border-border/40 hover:border-primary/40 transition-colors"
                style={{
                  background: avatarBase64
                    ? "transparent"
                    : "linear-gradient(135deg, oklch(0.62 0.22 290), oklch(0.68 0.18 330))",
                }}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change avatar"
              >
                {avatarBase64 ? (
                  <img
                    src={avatarBase64}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={18} className="text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Upload profile picture"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Profile Picture
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click to upload a photo
              </p>
              {avatarBase64 && (
                <button
                  type="button"
                  onClick={() => setAvatarBase64("")}
                  className="text-xs text-destructive/70 hover:text-destructive mt-1 transition-colors"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label
              htmlFor="settings-name"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <User size={13} className="text-muted-foreground" />
              Display Name
            </Label>
            <Input
              id="settings-name"
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              autoComplete="given-name"
              className={
                nameError
                  ? "bg-muted/30 border-destructive/60 focus:border-destructive"
                  : "bg-muted/30 border-border/50 focus:border-primary/60"
              }
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <Label
              htmlFor="settings-mobile"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Phone size={13} className="text-muted-foreground" />
              Mobile Number
            </Label>
            <Input
              id="settings-mobile"
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (mobileError) setMobileError("");
              }}
              autoComplete="tel"
              className={
                mobileError
                  ? "bg-muted/30 border-destructive/60 focus:border-destructive"
                  : "bg-muted/30 border-border/50 focus:border-primary/60"
              }
            />
            {mobileError ? (
              <p className="text-xs text-destructive">{mobileError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Used for WhatsApp habit reminders
              </p>
            )}
          </div>

          {/* Save button */}
          <div className="pt-1">
            <Button
              type="submit"
              disabled={
                isSaving || (!isDirty && !!currentName && !!currentMobile)
              }
              className="w-full bg-gradient-to-r from-primary to-chart-5 hover:opacity-90 transition-opacity"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
