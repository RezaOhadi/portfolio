import { PageReveal } from "@/components/layout/PageReveal";

/** Re-mounts on each navigation, driving the curtain/page-reveal transition. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageReveal>{children}</PageReveal>;
}
