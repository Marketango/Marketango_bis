"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAuthCookies } from "@/lib/auth";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/admin/clients", label: "Clientes", icon: "👥" },
  { href: "/admin/settings", label: "Configuración", icon: "⚙" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearAuthCookies();
    router.push("/admin/login");
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-200">
        <span className="font-bold text-gray-900 text-sm">BI Platform</span>
        <p className="text-xs text-gray-400 mt-0.5">Panel de Agencia</p>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-gray-400 hover:text-red-600 transition-colors px-2 py-1.5"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
