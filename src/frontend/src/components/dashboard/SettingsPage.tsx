import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Save, Settings, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface SettingsPageProps {
  currentName?: string;
  currentMobile?: string;
  onSave: (name: string, mobile: string) => void;
  isSaving: boolean;
}

export function SettingsPage({
  currentName,
  currentMobile,
  onSave,
  isSaving,
}: SettingsPageProps) {
  const [name, setName] = useState(currentName ?? "");
  const [mobile, setMobile] = useState(currentMobile ?? "");
  const [nameError, setNameError] = useState("");
  const [mobileError, setMobileError] = useState("");

  // Sync fields when props update (e.g. after a fresh profile fetch)
  useEffect(() => {
    if (currentName !== undefined) setName(currentName);
  }, [currentName]);

  useEffect(() => {
    if (currentMobile !== undefined) setMobile(currentMobile);
  }, [currentMobile]);

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
    onSave(name.trim(), mobile.trim());
  };

  const isDirty =
    name !== (currentName ?? "") || mobile !== (currentMobile ?? "");

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
              Your name and mobile number
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
