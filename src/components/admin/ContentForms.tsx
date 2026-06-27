"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  saveSocial,
  saveHome,
  saveBio,
  type ContentState,
} from "@/app/admin/(dashboard)/content/actions";
import type { BioContent, HomeContent, SocialLinks } from "@/lib/types";

const initial: ContentState = { status: "idle" };
const input =
  "w-full rounded-sm border border-white/15 bg-ink-deep px-3 py-2.5 font-sans text-sm text-ivory placeholder:text-silver-400/50 focus:border-ivory focus:outline-none";
const label = "mb-1.5 block font-sans text-xs uppercase tracking-widest text-silver-400";

function Save({ children = "Save" }: { children?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 border border-ivory bg-ivory px-5 py-2.5 font-sans text-[0.7rem] uppercase tracking-widest text-ink transition-colors hover:bg-white disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving…" : children}
    </button>
  );
}

function Status({ state }: { state: ContentState }) {
  if (state.status === "success")
    return (
      <p className="flex items-center gap-2 font-sans text-sm text-ivory">
        <CheckCircle2 className="h-4 w-4" /> {state.message}
      </p>
    );
  if (state.status === "error")
    return (
      <p className="flex items-center gap-2 font-sans text-sm text-ivory">
        <AlertCircle className="h-4 w-4" /> {state.message}
      </p>
    );
  return null;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-white/10 bg-white/[0.02] p-6">
      <h2 className="mb-5 font-serif text-xl text-ivory">{title}</h2>
      {children}
    </section>
  );
}

export function SocialForm({ social }: { social: SocialLinks }) {
  const [state, action] = useActionState(saveSocial, initial);
  return (
    <Card title="Social & contact">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Contact email</span>
            <input name="email" type="email" defaultValue={social.email} className={input} />
          </label>
          <label className="block">
            <span className={label}>Instagram URL</span>
            <input name="instagram" defaultValue={social.instagram} className={input} />
          </label>
          <label className="block">
            <span className={label}>YouTube URL</span>
            <input name="youtube" defaultValue={social.youtube} className={input} />
          </label>
          <label className="block">
            <span className={label}>SoundCloud URL</span>
            <input name="soundcloud" defaultValue={social.soundcloud} className={input} />
          </label>
        </div>
        <div className="flex items-center gap-4">
          <Save />
          <Status state={state} />
        </div>
      </form>
    </Card>
  );
}

export function HomeForm({
  home,
  products,
}: {
  home: HomeContent;
  products: { slug: string; title: string }[];
}) {
  const [state, action] = useActionState(saveHome, initial);
  return (
    <Card title="Home page">
      <form action={action} className="flex flex-col gap-4">
        <label className="block">
          <span className={label}>Artist statement</span>
          <textarea name="artistStatement" rows={4} defaultValue={home.artistStatement} className={input} />
        </label>
        <label className="block">
          <span className={label}>Featured composition</span>
          <select name="featuredProductSlug" defaultValue={home.featuredProductSlug ?? ""} className={input}>
            <option value="" className="bg-ink">— None —</option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug} className="bg-ink">
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-4">
          <Save />
          <Status state={state} />
        </div>
      </form>
    </Card>
  );
}

export function BioForm({ bio }: { bio: BioContent }) {
  const [state, action] = useActionState(saveBio, initial);
  return (
    <Card title="Biography">
      <form action={action} className="flex flex-col gap-4">
        <label className="block">
          <span className={label}>Introduction</span>
          <textarea name="intro" rows={3} defaultValue={bio.intro} className={input} />
        </label>
        <label className="block">
          <span className={label}>Composer statement</span>
          <textarea name="statement" rows={3} defaultValue={bio.statement} className={input} />
        </label>
        <label className="block">
          <span className={label}>Personal philosophy</span>
          <textarea name="philosophy" rows={3} defaultValue={bio.philosophy} className={input} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={label}>Portrait image</span>
            <input name="portrait" type="file" accept="image/*" className={input} />
          </label>
          <label className="block">
            <span className={label}>Wide image</span>
            <input name="wide" type="file" accept="image/*" className={input} />
          </label>
          <label className="block">
            <span className={label}>Signature image</span>
            <input name="signature" type="file" accept="image/*" className={input} />
          </label>
        </div>
        <p className="-mt-1 font-sans text-xs text-silver-400">
          Leave a file blank to keep the current image. Timeline, education and quotes can be
          edited directly in the <code className="text-ivory">site_content</code> table (key “bio”).
        </p>
        <div className="flex items-center gap-4">
          <Save />
          <Status state={state} />
        </div>
      </form>
    </Card>
  );
}
