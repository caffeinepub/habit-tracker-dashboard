import { Quote } from "lucide-react";
import { motion } from "motion/react";

const QUOTES = [
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
  },
  {
    text: "You don't rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
  },
  {
    text: "Motivation gets you going. Habit keeps you growing.",
    author: "John C. Maxwell",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "A habit cannot be tossed out the window; it must be coaxed down the stairs.",
    author: "Mark Twain",
  },
  {
    text: "First forget inspiration. Habit is more dependable.",
    author: "Octavia Butler",
  },
  {
    text: "Chains of habit are too light to be felt until they are too heavy to be broken.",
    author: "Warren Buffett",
  },
  {
    text: "In essence, if we want to direct our lives, we must take control of our consistent actions.",
    author: "Tony Robbins",
  },
  {
    text: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
  },
  {
    text: "The difference between who you are and who you want to be is what you do.",
    author: "Unknown",
  },
  {
    text: "Take care of your body. It's the only place you have to live.",
    author: "Jim Rohn",
  },
  {
    text: "Your future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  {
    text: "The secret of your future is hidden in your daily routine.",
    author: "Mike Murdock",
  },
  {
    text: "You will never change your life until you change something you do daily.",
    author: "John C. Maxwell",
  },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function MotivationalQuote() {
  const dayOfYear = getDayOfYear();
  const quote = QUOTES[dayOfYear % QUOTES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl p-4 border border-primary/20"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.62 0.22 290 / 0.08), oklch(0.68 0.18 330 / 0.06))",
      }}
    >
      {/* Decorative quote mark */}
      <div className="absolute top-3 right-4 opacity-10 pointer-events-none">
        <Quote size={40} className="text-primary" />
      </div>

      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
          <Quote size={13} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-foreground/90 font-medium leading-relaxed italic">
            "{quote.text}"
          </p>
          <p className="text-xs text-primary/70 font-semibold mt-1.5">
            — {quote.author}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
