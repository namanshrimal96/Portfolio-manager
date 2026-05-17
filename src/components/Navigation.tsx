"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "◈" },
  { href: "/cards", label: "Cards", icon: "▤" },
  { href: "/vouchers", label: "Vouchers", icon: "◻" },
  { href: "/transfers", label: "Transfers", icon: "⇄" },
  { href: "/recommender", label: "Recommender", icon: "★" },
];

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 h-screen w-56 bg-white border-r border-gray-200 flex flex-col py-6 px-4 z-10">
      <div className="mb-8 px-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Portfolio</p>
        <p className="text-sm font-medium text-gray-700 mt-1">Rewards Manager</p>
      </div>
      <ul className="space-y-1 flex-1">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{l.icon}</span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto px-2 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">v1 · local-first data</p>
      </div>
    </nav>
  );
}
