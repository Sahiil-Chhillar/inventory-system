import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getOrders, createOrder, updateOrderStatus, deleteOrder,
  getCustomers, getProducts,
} from "../api/client";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBadge from "../components/StatusBadge";
import { Plus, Trash2, ChevronDown, ShoppingCart, Eye, X } from "lucide-react";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

function CreateOrderModal({ onSave, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCustomers().then(setCustomers);
    getProducts().then(setProducts);
  }, []);

  const addItem = () => setItems(i => [...i, { product_id: "", quantity: 1 }]);
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const setItem = (idx, key, val) =>
    setItems(i => i.map((item, j) => j === idx ? { ...item, [key]: val } : item));

  const selectedProduct = (pid) => products.find(p => p.id === parseInt(pid));

  const total = items.reduce((sum, item) => {
    const p = selectedProduct(item.product_id);
    return sum + (p ? p.price * (parseInt(item.quantity) || 0) : 0);
  }, 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!customerId) return toast.error("Please select a customer");
    if (items.some(i => !i.product_id)) return toast.error("Please select products for all items");
    setSaving(true);
    try {
      await onSave({
        customer_id: parseInt(customerId),
        notes,
        items: items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })),
      });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Customer *</label>
        <select className="input mt-1" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
          <option value="">Select a customer…</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Order Items *</label>
          <button type="button" onClick={addItem} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => {
            const p = selectedProduct(item.product_id);
            return (
              <div key={idx} className="flex gap-2 items-center bg-slate-50 rounded-lg p-2">
                <select
                  className="input flex-1 text-xs"
                  value={item.product_id}
                  onChange={e => setItem(idx, "product_id", e.target.value)}
                  required
                >
                  <option value="">Select product…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                      {p.name} — ${p.price} (stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max={p?.stock_quantity || undefined}
                  className="input w-20 text-xs"
                  value={item.quantity}
                  onChange={e => setItem(idx, "quantity", e.target.value)}
                  required
                />
                {p && (
                  <span className="text-xs text-slate-500 w-20 shrink-0">
                    ${(p.price * (parseInt(item.quantity) || 0)).toFixed(2)}
                  </span>
                )}
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Notes</label>
        <textarea className="input mt-1 resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="bg-brand-50 rounded-lg px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-brand-700">Estimated Total</span>
        <span className="text-lg font-bold text-brand-800">${total.toFixed(2)}</span>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Placing Order…" : "Place Order"}
        </button>
      </div>
    </form>
  );
}

function OrderDetailModal({ order, onClose }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500">Customer</span>
          <p className="font-medium">{order.customer?.name}</p>
          <p className="text-slate-400 text-xs">{order.customer?.email}</p>
        </div>
        <div>
          <span className="text-slate-500">Status</span>
          <div className="mt-1"><StatusBadge status={order.status} /></div>
        </div>
        <div>
          <span className="text-slate-500">Order Date</span>
          <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div>
          <span className="text-slate-500">Total</span>
          <p className="font-bold text-brand-700 text-lg">${order.total_amount.toFixed(2)}</p>
        </div>
      </div>
      {order.notes && (
        <div className="bg-slate-50 rounded-lg p-3 text-sm">
          <span className="text-slate-500 font-medium">Notes: </span>
          {order.notes}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Items ({order.items?.length})</p>
        <div className="border border-slate-100 rounded-lg divide-y divide-slate-50">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{item.product?.name || `Product #${item.product_id}`}</p>
                <p className="text-xs text-slate-400">SKU: {item.product?.sku}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.quantity} × ${item.unit_price.toFixed(2)}</p>
                <p className="text-xs text-slate-400">${(item.quantity * item.unit_price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="btn-secondary w-full" onClick={onClose}>Close</button>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "create" | order_obj
  const [deleting, setDeleting] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);

  const load = () => getOrders().then(setOrders).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    await createOrder(data);
    toast.success("Order placed successfully!");
    load();
  };
  const handleStatusChange = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      toast.success("Status updated");
      load();
    } catch { toast.error("Failed to update status"); }
  };
  const handleDelete = async (id) => {
    try {
      await deleteOrder(id);
      toast.success("Order deleted & stock restored");
      load();
    } catch { toast.error("Failed to delete order"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-slate-500 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal("create")}>
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Order #", "Customer", "Items", "Total", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">#{String(o.id).padStart(4, "0")}</td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-800">{o.customer?.name}</p>
                      <p className="text-xs text-slate-400">{o.customer?.email}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{o.items?.length} item{o.items?.length !== 1 ? "s" : ""}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">${o.total_amount.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <select
                        value={o.status}
                        onChange={e => handleStatusChange(o.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => setViewOrder(o)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleting(o)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === "create" && (
        <Modal title="New Order" onClose={() => setModal(null)}>
          <CreateOrderModal onSave={handleCreate} onClose={() => setModal(null)} />
        </Modal>
      )}
      {viewOrder && (
        <Modal title={`Order #${String(viewOrder.id).padStart(4, "0")}`} onClose={() => setViewOrder(null)}>
          <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Order"
          message={`Delete order #${String(deleting.id).padStart(4, "0")}? Stock will be automatically restored.`}
          onConfirm={() => handleDelete(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
