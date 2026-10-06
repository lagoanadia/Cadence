"use client";

import { ArrowUp, Check, Mic, Square, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "@/components/ui/check-toggle";
import { applyAssistantAction, type ProposedAction, planAssistantAction } from "./actions";
import type { ActionResult } from "./execute";

// ── Voice input with the browser's built-in speech recognition ──
// TypeScript doesn't ship types for it (it's still prefixed in some browsers),
// so we describe just the parts we use.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Phase =
  | { name: "input" }
  | { name: "review"; reply: string; proposals: (ProposedAction & { selected: boolean })[] }
  | { name: "done"; results: ActionResult[] };

type Props = {
  enabled: boolean;
};

export function AssistantCard({ enabled }: Props) {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "input" });
  const [pending, startTransition] = useTransition();
  const recognition = useRef<Recognition | null>(null);

  // Feature detection must run in the browser (the server has no `window`),
  // so it happens after the first render
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser capability check
    setVoiceSupported(getRecognition() !== null);
    return () => recognition.current?.stop();
  }, []);

  function toggleVoice() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Recognition = getRecognition();
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = navigator.language || "es-ES";
    rec.continuous = true;
    rec.interimResults = true; // show words while you speak
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText) setText((current) => `${current} ${finalText}`.trim());
      setInterim(interimText);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.onerror = () => setError("I couldn't hear you. Check the microphone permission.");
    recognition.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  }

  function submit() {
    recognition.current?.stop();
    setError(null);
    startTransition(async () => {
      const result = await planAssistantAction(text);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setPhase({
        name: "review",
        reply: result.reply,
        proposals: result.proposals.map((proposal) => ({ ...proposal, selected: true })),
      });
    });
  }

  function apply(proposals: (ProposedAction & { selected: boolean })[]) {
    const chosen = proposals.filter((p) => p.selected).map((p) => p.action);
    startTransition(async () => {
      const results = await applyAssistantAction(chosen);
      setPhase({ name: "done", results });
      setText("");
    });
  }

  function reset() {
    setPhase({ name: "input" });
    setError(null);
  }

  return (
    <section className="ios-list flex flex-col gap-4 p-5">
      <header>
        <p className="text-[13px] font-semibold tracking-wide text-accent uppercase">Assistant</p>
        <h2 className="display-serif text-[30px] leading-tight italic">How can I help today?</h2>
      </header>

      {!enabled && (
        <p className="text-[15px] text-muted">
          Add an <code className="text-[13px]">ANTHROPIC_API_KEY</code> to the project to switch the assistant on.
        </p>
      )}

      {enabled && phase.name === "input" && (
        <>
          <div className="relative">
            <textarea
              value={interim ? `${text} ${interim}`.trim() : text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              maxLength={2000}
              aria-label="Tell the assistant what you need"
              placeholder="e.g. Poner lavadora cada sábado, mi presupuesto es 240 € y hoy gasté 40 € en el súper"
              className="w-full resize-none rounded-[22px] border border-border bg-surface px-4 py-3 pr-14 text-[17px] text-text backdrop-blur-xl outline-none placeholder:text-muted/70 focus:border-accent-fill/60 focus:ring-2 focus:ring-accent-fill/35"
            />
            <button
              type="button"
              onClick={submit}
              disabled={pending || !text.trim()}
              aria-label="Send"
              className="absolute right-2.5 bottom-3.5 flex size-10 items-center justify-center rounded-full bg-accent-fill text-accent-text shadow-[0_4px_14px_rgba(255,214,10,0.4)] transition active:scale-90 disabled:opacity-40"
            >
              <ArrowUp className="size-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            {voiceSupported ? (
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={listening}
                className={`relative flex size-14 items-center justify-center rounded-full border transition active:scale-95 ${
                  listening
                    ? "border-transparent bg-accent-fill text-accent-text shadow-[0_0_0_10px_rgba(255,214,10,0.18),0_0_0_20px_rgba(255,214,10,0.08)]"
                    : "glass text-text"
                }`}
              >
                {listening ? <Square className="size-5" fill="currentColor" /> : <Mic className="size-6" />}
                <span className="sr-only">{listening ? "Stop dictation" : "Dictate"}</span>
              </button>
            ) : (
              <span />
            )}
            <p className="flex-1 text-right text-[13px] text-muted">
              {pending ? "Thinking…" : listening ? "Listening… tap to stop" : "Speak or type. You'll review before anything is saved."}
            </p>
          </div>
        </>
      )}

      {phase.name === "review" && (
        <div className="flex flex-col gap-4">
          <p className="display-serif text-[22px] leading-snug">{phase.reply}</p>
          {phase.proposals.length === 0 ? (
            <p className="text-[15px] text-muted">I didn’t find anything to add. Try describing a task or an expense.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {phase.proposals.map((proposal, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle
                    done={proposal.selected}
                    label={`Include: ${proposal.label}`}
                    onToggle={() =>
                      setPhase({
                        ...phase,
                        proposals: phase.proposals.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)),
                      })
                    }
                  />
                  <span className={`text-[16px] ${proposal.selected ? "" : "text-muted line-through"}`}>{proposal.label}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={reset} disabled={pending}>
              Back
            </Button>
            {phase.proposals.some((p) => p.selected) && (
              <Button type="button" className="flex-1" onClick={() => apply(phase.proposals)} disabled={pending}>
                {pending ? "Saving…" : `Add ${phase.proposals.filter((p) => p.selected).length}`}
              </Button>
            )}
          </div>
        </div>
      )}

      {phase.name === "done" && (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {phase.results.map((result, index) => (
              <li key={index} className="flex items-start gap-2 text-[15px]">
                {result.ok ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={3} />
                ) : (
                  <X className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={3} />
                )}
                <span>
                  {result.label}
                  {result.error && <span className="text-danger"> — {result.error}</span>}
                </span>
              </li>
            ))}
          </ul>
          <Button type="button" variant="secondary" onClick={reset}>
            Done
          </Button>
        </div>
      )}

      {error && <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-[15px] text-danger">{error}</p>}
    </section>
  );
}
