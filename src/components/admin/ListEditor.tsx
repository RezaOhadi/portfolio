import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { listAction } from "@/app/admin/(dashboard)/content/list-actions";
import { LISTS, type ListConfig, type ListField, type ListId } from "@/lib/admin/lists";
import { ConfirmButton } from "./ConfirmButton";

const input =
  "w-full rounded-sm border border-white/15 bg-ink-deep px-3 py-2.5 font-sans text-sm text-ivory placeholder:text-silver-400/50 focus:border-ivory focus:outline-none";
const label = "mb-1.5 block font-sans text-xs uppercase tracking-widest text-silver-400";
const primary =
  "inline-flex items-center gap-2 border border-ivory bg-ivory px-4 py-2 font-sans text-[0.68rem] uppercase tracking-widest text-ink transition-colors hover:bg-white";
const quiet =
  "inline-flex items-center gap-1.5 px-2 py-2 font-sans text-[0.68rem] uppercase tracking-widest text-silver-400 transition-colors hover:text-ivory disabled:opacity-30 disabled:hover:text-silver-400";

type Item = Record<string, unknown>;

/** Rows are uncontrolled forms: keying by content remounts a row whenever its
    data changes (after a reorder or save), so the inputs never go stale. */
function rowKey(index: number, item: unknown): string {
  const s = JSON.stringify(item) ?? "";
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return index + ":" + (h >>> 0).toString(36);
}

function Field({ field, value, idPrefix }: { field: ListField; value: unknown; idPrefix: string }) {
  const id = `${idPrefix}-${field.name}`;
  const str = typeof value === "string" ? value : value == null ? "" : String(value);
  const wrap = field.wide ? "sm:col-span-2" : "";
  if (field.type === "checkbox") {
    return (
      <label htmlFor={id} className={`flex items-center gap-3 self-end py-2.5 ${wrap}`}>
        <input id={id} name={field.name} type="checkbox" defaultChecked={Boolean(value)} className="h-4 w-4 accent-ivory" />
        <span className="font-sans text-sm text-silver-200">{field.label}</span>
      </label>
    );
  }
  if (field.type === "image") {
    return (
      <div className={wrap}>
        <label htmlFor={id} className={label}>
          {field.label}
        </label>
        <div className="flex flex-wrap items-center gap-4">
          {str ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={str} alt="" className="h-14 w-20 rounded-sm object-cover ring-1 ring-white/10" />
          ) : null}
          <input id={id} name={field.name} type="file" accept="image/*" className={`${input} flex-1`} />
          <input type="hidden" name={`${field.name}_current`} value={str} />
          {str ? (
            <label className="flex items-center gap-2 font-sans text-xs text-silver-400">
              <input type="checkbox" name={`${field.name}_remove`} className="h-3.5 w-3.5 accent-ivory" /> Remove
            </label>
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <div className={wrap}>
      <label htmlFor={id} className={label}>
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea id={id} name={field.name} rows={3} defaultValue={str} required={field.required} placeholder={field.placeholder} className={input} />
      ) : field.type === "select" ? (
        <select id={id} name={field.name} defaultValue={str} className={input}>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value} className="bg-ink">
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type={field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
          defaultValue={str}
          required={field.required}
          placeholder={field.placeholder}
          className={input}
        />
      )}
    </div>
  );
}

/**
 * Add / edit / reorder / delete rows of one editable list. Every row is its
 * own form posting to the shared list action, so no client state is needed.
 */
export function ListEditor({
  list,
  items,
  title,
  description,
}: {
  list: ListId;
  items: unknown[];
  title: string;
  description?: string;
}) {
  const cfg: ListConfig = LISTS[list];
  const read = (item: unknown, field: ListField) =>
    cfg.scalar ? item : item && typeof item === "object" ? (item as Item)[field.name] : "";

  return (
    <section className="rounded-sm border border-white/10 bg-white/[0.02] p-6">
      <h2 className="font-serif text-xl text-ivory">{title}</h2>
      {description ? <p className="mt-1 font-sans text-xs text-silver-400">{description}</p> : null}

      <div className="mt-5 flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="rounded-sm border border-white/10 bg-ink-deep/40 p-4 font-sans text-sm text-silver-400">
            No {cfg.noun} yet. The section stays hidden on the site until you add one.
          </p>
        ) : null}
        {items.map((item, i) => (
          <form
            key={rowKey(i, item)}
            action={listAction}
            className="rounded-sm border border-white/10 bg-ink-deep/40 p-4"
          >
            <input type="hidden" name="list" value={list} />
            <input type="hidden" name="index" value={i} />
            <div className="grid gap-4 sm:grid-cols-2">
              {cfg.fields.map((f) => (
                <Field key={f.name} field={f} value={read(item, f)} idPrefix={`${list}-${i}`} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
              <button type="submit" name="op" value="save" className={primary}>
                Save
              </button>
              <span className="ml-auto flex items-center gap-1">
                <button type="submit" name="op" value="up" disabled={i === 0} aria-label="Move up" className={quiet}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="submit" name="op" value="down" disabled={i === items.length - 1} aria-label="Move down" className={quiet}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <ConfirmButton name="op" value="delete" message={`Delete this ${cfg.noun}?`} aria-label="Delete" className={quiet}>
                  <Trash2 className="h-4 w-4" /> Delete
                </ConfirmButton>
              </span>
            </div>
          </form>
        ))}
      </div>

      <form action={listAction} className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6">
        <input type="hidden" name="list" value={list} />
        <h3 className="font-sans text-xs uppercase tracking-widest text-silver-400">Add {cfg.noun}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {cfg.fields.map((f) => (
            <Field key={f.name} field={f} value="" idPrefix={`${list}-new`} />
          ))}
        </div>
        <div>
          <button type="submit" name="op" value="add" className={primary}>
            <Plus className="h-4 w-4" /> Add {cfg.noun}
          </button>
        </div>
      </form>
    </section>
  );
}
