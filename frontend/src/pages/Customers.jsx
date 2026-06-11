import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../api/client";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";

const EMPTY = { name: "", email: "", phone: "", address: "" };

function CustomerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Full Name *</label>
        <input className="input mt-1" value={form.name} onChange={set("name")} required />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Email *</label>
        <input className="input mt-1" type="email" value={form.email} onChange={set("email")} required />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Phone</label>
        <input className="input mt-1" type="tel" value={form.phone} onChange={set("phone")} />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Address</label>
        <textarea className="input mt-1 resize-none" rows={2} value={form.address} onChange={set("address")} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save Customer"}
        </button>
      </div>
    </form>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => getCustomers().then(setCustomers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data) => {
    await createCustomer(data);
    toast.success("Customer added");
    load();
  };
  const handleUpdate = (c) => async (data) => {
    await updateCustomer(c.id, data);
    toast.success("Customer updated");
    load();
  };
  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      toast.success("Customer deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Customer has existing orders and cannot be deleted");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 text-sm mt-1">{customers.length} registered customers</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal("create")}>
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Name", "Email", "Phone", "Address", "Joined", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-800">{c.name}</td>
                    <td className="py-3 px-3 text-brand-600">{c.email}</td>
                    <td className="py-3 px-3 text-slate-600">{c.phone || "—"}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{c.address || "—"}</td>
                    <td className="py-3 px-3 text-slate-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(c)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleting(c)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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
        <Modal title="Add Customer" onClose={() => setModal(null)}>
          <CustomerForm onSave={handleCreate} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal && modal !== "create" && (
        <Modal title="Edit Customer" onClose={() => setModal(null)}>
          <CustomerForm initial={modal} onSave={handleUpdate(modal)} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Customer"
          message={`Delete "${deleting.name}"? All associated orders will be affected.`}
          onConfirm={() => handleDelete(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
