"use client";

import { useActionState } from "react";
import { saveHero, saveTitles, type ContentState } from "@/app/admin/(dashboard)/content/actions";
import { Save, Status, Card } from "./ContentForms";
import { HOME_TITLE_KEYS, HOME_TITLE_LABELS } from "@/lib/data/home-titles";
import type { HeroContent, HomeTitles } from "@/lib/types";

const initial: ContentState = { status: "idle" };
const input =
  "w-full rounded-sm border border-white/15 bg-ink-deep px-3 py-2.5 font-sans text-sm text-ivory placeholder:text-silver-400/50 focus:border-ivory focus:outline-none";
const label = "mb-1.5 block font-sans text-xs uppercase tracking-widest text-silver-400";

/** Hero: the name, the tagline and the portrait on the home page. */
export function HeroForm({ hero }: { hero: HeroContent }) {
  const [state, action] = useActionState(saveHero, initial);
  const hasPortrait = Boolean(hero.image) && !hero.image.startsWith("/placeholders/");
  return (
    <Card title="Hero">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Name</span>
            <input name="headline" required defaultValue={hero.headline} className={input} />
          </label>
          <label className="block">
            <span className={label}>Tagline</span>
            <input name="supporting" defaultValue={hero.supporting} className={input} />
          </label>
        </div>
        <label className="block">
          <span className={label}>Portrait image</span>
          <div className="flex flex-wrap items-center gap-4">
            {hasPortrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.image} alt="" className="h-16 w-14 rounded-sm object-cover ring-1 ring-white/10" />
            ) : null}
            <input name="portrait" type="file" accept="image/*" className={`${input} flex-1`} />
          </div>
          <span className="mt-1.5 block font-sans text-xs text-silver-400">
            {hasPortrait
              ? "Upload a new file to replace the current portrait."
              : "No uploaded portrait yet: the site uses the portrait bundled with the build."}
          </span>
        </label>
        <div className="flex items-center gap-4">
          <Save />
          <Status state={state} />
        </div>
      </form>
    </Card>
  );
}

/** The seven section titles on the home page. */
export function TitlesForm({ titles }: { titles: HomeTitles }) {
  const [state, action] = useActionState(saveTitles, initial);
  return (
    <Card title="Home page section titles">
      <form action={action} className="flex flex-col gap-5">
        <p className="font-sans text-xs leading-relaxed text-silver-400">
          The italic ending is optional and renders in italics after the title,
          as in “A life at <em>the piano.</em>”. Use a line break in a title to
          split it over two lines.
        </p>
        {HOME_TITLE_KEYS.map((key) => (
          <div key={key} className="grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className={label}>{HOME_TITLE_LABELS[key]}</span>
              <textarea
                name={`${key}_text`}
                rows={key === "contact" ? 2 : 1}
                defaultValue={titles[key].text}
                className={input}
              />
            </label>
            <label className="block">
              <span className={label}>Italic ending</span>
              <input name={`${key}_accent`} defaultValue={titles[key].accent ?? ""} className={input} />
            </label>
          </div>
        ))}
        <div className="flex items-center gap-4">
          <Save />
          <Status state={state} />
        </div>
      </form>
    </Card>
  );
}
