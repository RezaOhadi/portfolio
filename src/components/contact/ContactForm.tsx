"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { submitContact, type ContactState } from "@/app/(site)/contact/actions";
import { INQUIRY_TYPES } from "@/lib/validation";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full border-0 border-b border-white/20 bg-transparent py-3 font-sans text-ivory placeholder:text-silver-400/60 transition-colors focus:border-ivory focus:outline-none focus:ring-0";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center justify-center gap-2.5 border border-ivory bg-ivory px-8 py-4 font-sans text-[0.72rem] uppercase tracking-widest text-ink transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

const initial: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, formAction] = useActionState(submitContact, initial);
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => setStartedAt(Date.now()), []);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-4 rounded-sm border border-white/15 bg-white/[0.03] p-8">
        <CheckCircle2 className="h-8 w-8 text-ivory" />
        <h3 className="font-serif text-2xl text-ivory">Message sent</h3>
        <p className="max-w-prose font-sans text-sm leading-relaxed text-silver-300">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-7" noValidate>
      {/* Honeypot */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />

      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Name" error={state.errors?.name}>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            className={fieldBase}
          />
        </Field>
        <Field label="Email" error={state.errors?.email}>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            className={fieldBase}
          />
        </Field>
      </div>

      <Field label="Inquiry type" error={state.errors?.inquiryType}>
        <select name="inquiryType" defaultValue="General" className={cn(fieldBase, "appearance-none")}>
          {INQUIRY_TYPES.map((t) => (
            <option key={t} value={t} className="bg-ink text-ivory">
              {t}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Message" error={state.errors?.message}>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell me about your project, performance, or inquiry…"
          className={cn(fieldBase, "resize-none")}
        />
      </Field>

      {state.status === "error" && state.message ? (
        <p className="flex items-center gap-2 font-sans text-sm text-ivory">
          <AlertCircle className="h-4 w-4" /> {state.message}
        </p>
      ) : null}

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="kicker mb-1 block normal-case tracking-wider text-silver-400">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block font-sans text-xs text-ivory/90">{error}</span>
      ) : null}
    </label>
  );
}
