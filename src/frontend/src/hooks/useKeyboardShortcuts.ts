import { useEffect } from "react";

interface KeyboardShortcutsConfig {
  onAddHabit: () => void;
  onCompleteAll: () => void;
  onToggleHabitByIndex: (index: number) => void;
  onFocusQuickAdd: () => void;
  onCloseModal: () => void;
  onToggleShortcutsPanel: () => void;
  isModalOpen: boolean;
}

export function useKeyboardShortcuts({
  onAddHabit,
  onCompleteAll,
  onToggleHabitByIndex,
  onFocusQuickAdd,
  onCloseModal,
  onToggleShortcutsPanel,
  isModalOpen,
}: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Always allow Escape to close modals
      if (e.key === "Escape") {
        if (isModalOpen) {
          onCloseModal();
        }
        return;
      }

      // Always allow ? to toggle help panel
      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        onToggleShortcutsPanel();
        return;
      }

      // Prevent other shortcuts when typing
      if (isTyping) return;

      // Prevent shortcuts when modifier keys are held
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "n":
        case "N":
        case "a":
        case "A":
          e.preventDefault();
          onAddHabit();
          break;
        case "c":
        case "C":
          e.preventDefault();
          onCompleteAll();
          break;
        case "/":
          e.preventDefault();
          onFocusQuickAdd();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          onToggleHabitByIndex(Number.parseInt(e.key) - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onAddHabit,
    onCompleteAll,
    onToggleHabitByIndex,
    onFocusQuickAdd,
    onCloseModal,
    onToggleShortcutsPanel,
    isModalOpen,
  ]);
}
