import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Users, ShoppingCart, TrendingUp } from "lucide-react";

const links = [
  { to: "/",         icon: LayoutDashboard, label: "Dashboard"  },
  { to: "/products", icon: Package,          label: "Products"   },
  { to: "/customers",icon: Users,            label: "Customers"  },
  { to: "/orders",   icon: ShoppingCart,     label: "Orders"     },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-brand-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-brand-700 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-brand-100" />
        <span className="font-bold text-lg tracking-tight">InventoryPro</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-brand-100 hover:bg-brand-700 hover:text-white"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-brand-700 text-xs text-brand-300">
        v1.0.0 · Inventory & Orders
      </div>
    </aside>
  );
}
