import type { ContentKey } from "@/lib/data/content";

/**
 * The editable lists inside site_content, described once so one generic
 * server action (content/list-actions.ts) and one editor component
 * (components/admin/ListEditor.tsx) can add, edit, reorder and delete rows.
 */

export type FieldType = "text" | "textarea" | "date" | "url" | "select" | "checkbox" | "image";

export interface ListField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Grid columns (of 2) the field takes. */
  wide?: boolean;
}

export interface ListConfig {
  /** site_content row. */
  key: ContentKey;
  /** Property inside that row holding the array; "" when the row IS the array. */
  path: string;
  /** Singular noun for buttons and empty states. */
  noun: string;
  fields: ListField[];
  /** Items are plain strings (the single field's value). */
  scalar?: boolean;
  /** Give new items an id. */
  withId?: boolean;
  /** Extra properties for new items. */
  defaults?: Record<string, unknown>;
  /** Storage path prefix for image fields. */
  imagePrefix?: string;
  /** Public paths to revalidate after a change. */
  revalidate: string[];
}

const concertFields: ListField[] = [
  { name: "title", label: "Title", required: true, placeholder: "Solo recital", wide: true },
  { name: "venue", label: "Venue", placeholder: "Concert hall" },
  { name: "location", label: "City", placeholder: "Toronto" },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "ticketUrl", label: "Ticket link", type: "url", placeholder: "https://" },
  {
    name: "status",
    label: "Shown as",
    type: "select",
    options: [
      { value: "", label: "Automatic (from the date)" },
      { value: "upcoming", label: "Upcoming" },
      { value: "past", label: "Past" },
    ],
  },
];

export const LISTS = {
  "home.performances": {
    key: "home",
    path: "performances",
    noun: "concert",
    fields: concertFields,
    revalidate: ["/"],
  },
  "bio.timeline": {
    key: "bio",
    path: "timeline",
    noun: "timeline entry",
    fields: [
      { name: "year", label: "Year", placeholder: "2019" },
      { name: "title", label: "Title", required: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
    ],
    revalidate: ["/biography"],
  },
  "bio.education": {
    key: "bio",
    path: "education",
    noun: "study entry",
    fields: [
      { name: "year", label: "Year", placeholder: "2012 – 2016" },
      { name: "title", label: "Title", required: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
    ],
    revalidate: ["/biography"],
  },
  "bio.performances": {
    key: "bio",
    path: "performances",
    noun: "performance",
    fields: [
      { name: "title", label: "Title", required: true, wide: true },
      { name: "venue", label: "Venue" },
      { name: "location", label: "City" },
      { name: "date", label: "Date", type: "date", required: true },
    ],
    revalidate: ["/biography"],
  },
  "bio.pullQuotes": {
    key: "bio",
    path: "pullQuotes",
    noun: "quote",
    scalar: true,
    fields: [{ name: "text", label: "Quote", type: "textarea", required: true, wide: true }],
    revalidate: ["/biography", "/"],
  },
  media: {
    key: "media",
    path: "",
    noun: "video",
    withId: true,
    defaults: { type: "youtube", audioUrl: null, instagramUrl: null, poster: null },
    imagePrefix: "media/poster",
    fields: [
      { name: "title", label: "Title", required: true, wide: true },
      { name: "youtubeUrl", label: "YouTube URL", type: "url", required: true, placeholder: "https://www.youtube.com/watch?v=…", wide: true },
      { name: "category", label: "Category", placeholder: "Performance", required: true },
      { name: "featured", label: "Featured on home page", type: "checkbox" },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "poster", label: "Poster image (optional; the YouTube thumbnail is used otherwise)", type: "image", wide: true },
    ],
    revalidate: ["/", "/media"],
  },
} satisfies Record<string, ListConfig>;

export type ListId = keyof typeof LISTS;

export function getListConfig(id: string): ListConfig | null {
  return Object.prototype.hasOwnProperty.call(LISTS, id) ? LISTS[id as ListId] : null;
}
