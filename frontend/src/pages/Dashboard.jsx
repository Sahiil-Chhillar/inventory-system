import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/client";
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle, Clock } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your inventory and orders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.total_products}
          color="bg-brand-600"
          sub={`${stats.low_stock_products} low on stock`}
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={stats.total_customers}
          color="bg-violet-500"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats.total_orders}
          color="bg-emerald-500"
          sub={`${stats.pending_orders} pending`}
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${stats.total_revenue.toLocaleString()}`}
          color="bg-amber-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          value={stats.low_stock_products}
          color="bg-red-500"
          sub="Products with ≤5 units"
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={stats.pending_orders}
          color="bg-orange-400"
          sub="Awaiting processing"
        />
      </div>
    </div>
  );
}
