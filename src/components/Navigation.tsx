"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  CreditCard,
  Ticket,
  ArrowsLeftRight,
  Sparkle,
} from "@phosphor-icons/react";

const links = [
  { href: "/", label: "Dashboard", Icon: House },
  { href: "/cards", label: "Cards", Icon: CreditCard },
  { href: "/vouchers", label: "Vouchers", Icon: Ticket },
  { href: "/transfers", label: "Transfers", Icon: ArrowsLeftRight },
  { href: "/recommender", label: "Recommender", Icon: Sparkle },
];

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 h-screen w-56 bg-white border-r border-warm-border flex flex-col py-6 px-4 z-10">
      <div className="mb-8 px-2">
        <p className="text-[10px] font-semibold text-ink-3 uppercase tracking-widest">
          Portfolio
        </p>
        <p className="text-sm font-semibold text-ink mt-1">Rewards Manager</p>
      </div>
      <ul className="space-y-0.5 flex-1">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-light text-brand"
                    : "text-ink-2 hover:bg-cream hover:text-ink"
                }`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto px-2 pt-4 border-t border-warm-border">
        <p className="text-xs text-ink-3">v1 · cloud-synced</p>
      </div>
    </nav>
  );
}
