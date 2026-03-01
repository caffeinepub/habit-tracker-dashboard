import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Target, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { WeeklyChallenge } from "../../backend.d";
import {
  useGetChallengeMembersCount,
  useJoinWeeklyChallenge,
} from "../../hooks/useQueries";

interface ChallengeBannerProps {
  challenge: WeeklyChallenge;
}

export function ChallengeBanner({ challenge }: ChallengeBannerProps) {
  const { data: memberCount = 0n } = useGetChallengeMembersCount();
  const joinMutation = useJoinWeeklyChallenge();
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    joinMutation.mutate(undefined, {
      onSuccess: () => {
        setJoined(true);
        toast.success(`🎯 Joined "${challenge.title}"! Good luck!`);
      },
      onError: () => toast.error("Failed to join challenge."),
    });
  };

  const isExpired = challenge.deadline
    ? new Date(challenge.deadline) < new Date()
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-primary/30"
      style={{
        background:
          "linear-gradient(135deg, oklch(var(--primary) / 0.08), oklch(var(--chart-5) / 0.06))",
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 50%, oklch(var(--primary) / 0.3) 0%, transparent 60%)",
        }}
      />

      <div className="relative px-5 py-4 flex items-center gap-4 flex-wrap">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <Target size={20} className="text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
              <Zap size={9} className="inline mr-1" />
              Weekly Challenge
            </span>
            {isExpired && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                Ended
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-foreground truncate">
            {challenge.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {challenge.description}
          </p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users size={10} />
              {Number(memberCount)} joined
            </span>
            <span className="text-[11px] font-semibold text-primary">
              Goal: {Number(challenge.targetCompletionsPerDay)} habit
              {Number(challenge.targetCompletionsPerDay) !== 1 ? "s" : ""}/day
            </span>
            {challenge.deadline && (
              <span className="text-[11px] text-muted-foreground">
                Until {format(new Date(challenge.deadline), "MMM d")}
              </span>
            )}
          </div>
        </div>

        {/* Join button */}
        {!isExpired && (
          <Button
            size="sm"
            variant={joined ? "outline" : "default"}
            onClick={handleJoin}
            disabled={joinMutation.isPending || joined}
            className="shrink-0 text-xs"
          >
            {joinMutation.isPending ? (
              <Loader2 size={12} className="animate-spin mr-1.5" />
            ) : joined ? (
              "✓ Joined!"
            ) : (
              "Join Challenge"
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
