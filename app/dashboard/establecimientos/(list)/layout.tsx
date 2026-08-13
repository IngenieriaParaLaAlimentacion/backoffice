"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Establecimientos", href: "/dashboard/establecimientos" },
  { label: "Solicitudes", href: "/dashboard/establecimientos/requests" },
];

export default function EstablishmentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
