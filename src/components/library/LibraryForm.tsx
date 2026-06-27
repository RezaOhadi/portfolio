"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { requestLibraryAccess, type LibraryState } from "@/app/(site)/library/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center justify-center gap-2.5 border border-ivory bg-ivory px-7 py-3.5 font-sans text-[0.72rem] uppercase tracking-widest text-ink transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-60"
    >
      <Mail className="h-4 w-4" /> {pending ? "Sending…" : "Email my links"}
    </button>
  );
}

const initial: LibraryState = { status: "idle" };

export function LibraryForm() {
  const [state, formAction] = useActionState(requestLibraryAccess, initial);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-4 rounded-sm border border-white/15 bg-white/[0.03] p-8">
        <CheckCircle2 className="h-8 w-8 text-ivory" />
        <h3 className="font-serif text-2xl text-ivory">Check your inbox</h3>
        <p className="max-w-prose font-sans text-sm leading-relaxed text-silver-300">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="block">
        <span className="kicker mb-2 block normal-case tracking-wider text-silver-400">
          Email used at checkout
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          className="w-full max-w-md border-0 border-b border-white/20 bg-transparent py-3 font-sans text-ivory placeholder:text-silver-400/60 transition-colors focus:border-ivory focus:outline-none"
        />
      </label>
      {state.status === "error" && state.message ? (
        <p className="flex items-center gap-2 font-sans text-sm text-ivory">
          <AlertCircle className="h-4 w-4" /> {state.message}
        </p>
      ) : null}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
