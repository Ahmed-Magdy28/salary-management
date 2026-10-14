"use client";

import { BarChart3, ChartColumn, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/pay-spread", label: "Pay spread", icon: ChartColumn },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen flex-wrap items-stretch">
      <aside className="flex flex-[0_0_248px] flex-col gap-7 bg-ink px-4 py-6 text-slate-300 max-md:flex-1 max-md:basis-full">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent text-lg font-bold text-white">A</div>
          <span className="text-lg font-bold text-white">ACME Pay</span>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 text-[15px] font-medium">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-[10px] px-3 transition-colors hover:bg-slate-800",
                  active && "bg-slate-800 text-white",
                )}
              >
                <Icon size={20} aria-hidden="true" className={active ? "text-teal-300" : undefined} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-3 rounded-[10px] bg-slate-800 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">HR</div>
          <span className="text-sm font-semibold text-white">HR Manager</span>
        </div>
      </aside>
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-10 py-8 max-md:px-5">{children}</main>
    </div>
  );
}
