import { z } from "zod";

export const INQUIRY_TYPES = [
  "General",
  "Booking",
  "Sheet music licensing",
  "Private lessons",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address."),
  inquiryType: z.enum(INQUIRY_TYPES),
  message: z
    .string()
    .trim()
    .min(10, "Please write a little more (10+ characters).")
    .max(4000, "Message is too long."),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const checkoutSchema = z.object({
  slug: z.string().min(1),
  email: z.string().trim().email().optional(),
});

export const libraryLookupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});
