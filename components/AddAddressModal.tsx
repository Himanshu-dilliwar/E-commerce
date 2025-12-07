"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AddAddressModal({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || "Failed to add address");
        setLoading(false);
        return;
      }
      toast.success("Address added");
      setOpen(false);
      setForm({ name: "", email: "", address: "", city: "", state: "", pincode: "", isDefault: false });
      onAdded?.();
    } catch (err) {
      console.error("Add address error:", err);
      toast.error("Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="w-full mt-4" onClick={() => setOpen(true)}>
        Add New Address
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white p-6 rounded-md shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Add Address</h3>

            <div className="grid gap-2">
              <Input
                placeholder="Name (Home, Work)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Email (optional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="Street address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <Input
                  placeholder="State (select or text)"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
                <Input
                  placeholder="Pincode (6 digits)"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                <span>Set as default address</span>
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
