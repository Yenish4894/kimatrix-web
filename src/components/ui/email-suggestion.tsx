"use client";

import { useCallback, useRef, useState } from "react";
import { suggestEmail, suggestionFromMessage } from "@/lib/emailSuggest";

/**
 * Wiring for one email field's "Did you mean …?" hint.
 *
 * `check` runs on blur (not per keystroke, so nobody is corrected mid-word); `reset`
 * runs on change so a stale hint never outlives the text it was about. `apply` writes
 * the fix through the caller's setter and puts focus back on the input, because the
 * button that had focus disappears as soon as it is used.
 */
export function useEmailSuggestion(onApply: (value: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const check = useCallback((value: string) => setSuggestion(suggestEmail(value)), []);
  const reset = useCallback(() => setSuggestion(null), []);
  const apply = useCallback(
    (value: string) => {
      onApply(value);
      setSuggestion(null);
      inputRef.current?.focus();
    },
    [onApply]
  );

  return { inputRef, suggestion, check, reset, apply };
}

interface EmailSuggestionProps {
  /** Client-side suggestion from `useEmailSuggestion`. */
  suggestion: string | null;
  /** The field's current error, which may carry the server's own "Did you mean x?". */
  error?: string;
  onApply: (value: string) => void;
}

/**
 * Advisory only — the server decides. Renders under the field's error/helper text and
 * never replaces them. If the error already says "Did you mean x?", only a button to
 * apply it is added, so the sentence is not shown twice.
 *
 * The live region is always mounted so screen readers announce content added later.
 */
export function EmailSuggestion({ suggestion, error, onApply }: Readonly<EmailSuggestionProps>) {
  const fromServer = suggestionFromMessage(error);
  const buttonClass =
    "font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 " +
    "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 break-all";

  let content: React.ReactNode = null;
  if (fromServer) {
    content = (
      <button type="button" className={buttonClass} onClick={() => onApply(fromServer)}>
        Use {fromServer}
      </button>
    );
  } else if (suggestion) {
    content = (
      <>
        Did you mean{" "}
        <button
          type="button"
          className={buttonClass}
          onClick={() => onApply(suggestion)}
          aria-label={`Use ${suggestion}`}
        >
          {suggestion}
        </button>
        ?
      </>
    );
  }

  return (
    <p aria-live="polite" className={content ? "mt-1 text-[13px] text-slate-600" : "sr-only"}>
      {content}
    </p>
  );
}
