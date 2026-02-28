import { useEffect, useRef } from "react";
import type { Habit } from "../backend.d";

export function useReminderScheduler(habits: Habit[], whatsappNumber?: string) {
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear previous timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    const now = new Date();

    for (const habit of habits) {
      if (!habit.reminderTime) continue;
      const [hours, minutes] = habit.reminderTime.split(":").map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;

      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, skip
      if (reminderDate <= now) continue;

      const msUntilReminder = reminderDate.getTime() - now.getTime();

      const timer = setTimeout(() => {
        const showNotification = () => {
          const text = `Reminder: Complete your habit "${habit.name}" today!`;
          const waNumber = whatsappNumber?.replace(/\D/g, "") ?? "";
          const waUrl = waNumber
            ? `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`;

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const n = new Notification("HabitFlow Reminder", {
              body: text,
              icon: "/favicon.ico",
            });
            n.onclick = () => {
              window.open(waUrl, "_blank", "noopener,noreferrer");
            };
          } else {
            // Fallback: open WhatsApp directly
            window.open(waUrl, "_blank", "noopener,noreferrer");
          }
        };

        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
              showNotification();
            } else {
              window.open(
                `https://wa.me/${whatsappNumber?.replace(/\D/g, "") ?? ""}?text=${encodeURIComponent(
                  `Reminder: Complete your habit "${habit.name}" today!`,
                )}`,
                "_blank",
                "noopener,noreferrer",
              );
            }
          });
        } else {
          showNotification();
        }
      }, msUntilReminder);

      timerRefs.current.push(timer);
    }

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [habits, whatsappNumber]);
}
