"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Music, Receipt, FileEdit, ExternalLink } from "lucide-react";
import { SignOutButton } from "./SignOutButton";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Music },
  { href: "/admin/purchases", label: "Purchases", icon: Receipt },
  { href: "/admin/content", label: "Content", icon: FileEdit },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ink-deep md:inset-y-0 md:right-auto md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:flex-col md:items-start md:gap-8 md:py-8">
        <div className="flex w-full items-center justify-between">
          <Link href="/admin" className="font-serif text-xl text-ivory">
            Admin
          </Link>
          <Link
            href="/"
            className="hidden items-center gap-1 text-[0.65rem] uppercase tracking-widest text-silver-400 hover:text-ivory md:flex"
          >
            View site <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <nav className="flex gap-1 md:w-full md:flex-col">
          {links.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 font-sans text-sm transition-colors",
                  active ? "bg-white/10 text-ivory" : "text-silver-300 hover:bg-white/5 hover:text-ivory",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:mt-auto md:block md:w-full md:border-t md:border-white/10 md:pt-6">
          <p className="mb-3 truncate font-sans text-xs text-silver-400">{email}</p>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
