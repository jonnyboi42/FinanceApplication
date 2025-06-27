'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: "Upload Center", path: "/upload-center" },
  { name: "Rent + Utilities", path: "/rent-utilities" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-black/60 backdrop-blur-md border-r border-yellow-400 shadow-[0_0_20px_#facc15] p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-8 text-yellow-400 tracking-wide text-left">
        Dashboard
      </h2>
      <nav className="flex flex-col gap-5">
        {navItems.map(({ name, path }) => (
          <Link key={path} href={path}>
            <span
              className={`block w-full text-left transition-colors duration-200 cursor-pointer px-2 py-1 rounded 
                ${
                  pathname === path
                    ? "text-yellow-300 font-semibold bg-white/10"
                    : "text-white hover:text-yellow-300 hover:bg-white/5"
                }`}
            >
              {name}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
