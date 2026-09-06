"use client";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitContact, type ContactState } from "@/app/(site)/contact/actions";
import { INQUIRY_TYPES } from "@/lib/validation";
const initial: ContactState = { status: "idle" };
const fieldClass =
  "w-full border border-white/25 bg-ink-deep px-4 py-3 text-base text-ivory placeholder:text-silver-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ivory";
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="action-primary disabled:opacity-60"
      aria-busy={pending}
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}
export function ContactForm() {
  const [state, action] = useActionState(submitContact, initial);
  const [startedAt, setStartedAt] = useState(0);
  const [values, setValues] = useState({
    name: "",
    email: "",
    inquiryType: "General",
    message: "",
  });
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => setStartedAt(Date.now()), []);
  useEffect(() => {
    if (state.status === "error")
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [state]);
  if (state.status === "success")
    return (
      <div role="status" className="border border-white/20 bg-white/[.03] p-8">
        <h3 className="font-serif text-3xl">Message sent</h3>
        <p className="section-lead mt-4">{state.message}</p>
      </div>
    );
  const attributes = (key: keyof typeof values) => ({
    id: id + "-" + key,
    name: key,
    value: values[key],
    "aria-invalid": !!state.errors?.[key],
    "aria-describedby": state.errors?.[key]
      ? id + "-" + key + "-error"
      : undefined,
    className: fieldClass,
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setValues((previous) => ({ ...previous, [key]: event.target.value })),
  });
  const error = (key: string) =>
    state.errors?.[key] ? (
      <span
        id={id + "-" + key + "-error"}
        className="mt-2 block text-sm text-ivory"
      >
        {state.errors[key]}
      </span>
    ) : null;
  return (
    <form ref={form} action={action} className="flex flex-col gap-6">
      <div hidden aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm" htmlFor={id + "-name"}>
            Name (required)
          </label>
          <input
            {...attributes("name")}
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="Your name"
          />
          {error("name")}
        </div>
        <div>
          <label className="mb-2 block text-sm" htmlFor={id + "-email"}>
            Email (required)
          </label>
          <input
            {...attributes("email")}
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
          />
          {error("email")}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm" htmlFor={id + "-inquiryType"}>
          Inquiry type
        </label>
        <select {...attributes("inquiryType")}>
          {INQUIRY_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        {error("inquiryType")}
      </div>
      <div>
        <label className="mb-2 block text-sm" htmlFor={id + "-message"}>
          Message (required)
        </label>
        <textarea
          {...attributes("message")}
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder="Tell me about your performance, project, or inquiry…"
        />
        {error("message")}
      </div>
      {state.status === "error" ? (
        <p role="alert" className="text-sm leading-relaxed">
          {state.message}
        </p>
      ) : null}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
