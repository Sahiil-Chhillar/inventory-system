import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/client";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";

const EMPTY = { name: "", sku: "", description: "", price: "", stock_quantity: "", category: "" };

function ProductForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity, 10),
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium text-slate-700">Product Name *</label>
          <input className="input mt-1" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">SKU *</label>
          <input className="input mt-1" value={form.sku} onChange={set("sku")} required placeholder="e.g. PROD-001" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Category</label>
          <input className="input mt-1" value={form.category} onChange={set("category")} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Price ($) *</label>
          <input className="input mt-1" type="number" step="0.01" min="0" value={form.price} onChange={set("price")} required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Stock Quantity *</label>
          <input className="input mt-1" type="number" min="0" value={form.stock_quantity} onChange={set("stock_quantity")} required />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea className="input mt-1 resize-none" rows={3} value={form.description} onChange={set("description")} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save Product"}
        </button>
      </div>
    </form>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | product_obj
  const [deleting, setDeleting] = useState(null);

  const load = () => getProducts().then(setProducts).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data) => {
    await createProduct(data);
    toast.success("Product created");
    load();
  };
  const handleUpdate = (p) => async (data) => {
    await updateProduct(p.id, data);
    toast.success("Product updated");
    load();
  };
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500 text-sm mt-1">{products.length} products in inventory</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal("create")}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, SKU, or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Name", "SKU", "Category", "Price", "Stock", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-800">{p.name}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500 bg-slate-50 rounded">{p.sku}</td>
                    <td className="py-3 px-3 text-slate-600">{p.category || "—"}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">${p.price.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${p.stock_quantity <= 5 ? "text-red-500" : "text-emerald-600"}`}>
                        {p.stock_quantity}
                      </span>
                      {p.stock_quantity <= 5 && <span className="ml-1 text-xs text-red-400">Low</span>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal(p)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
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
        <Modal title="Add Product" onClose={() => setModal(null)}>
          <ProductForm onSave={handleCreate} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal && modal !== "create" && (
        <Modal title="Edit Product" onClose={() => setModal(null)}>
          <ProductForm initial={modal} onSave={handleUpdate(modal)} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Product"
          message={`Are you sure you want to delete "${deleting.name}"? This action cannot be undone.`}
          onConfirm={() => handleDelete(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
