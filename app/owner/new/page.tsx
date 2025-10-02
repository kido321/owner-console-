"use client";
import { useState } from "react";

export default function NewOrg() {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setLoading(true);
    const res = await fetch("/api/orgs", { method: "POST", body: JSON.stringify(payload) });
    setLoading(false);
    if (res.ok) location.href = "/owner";
    else alert("Error creating org");
  }
  return (
    <form onSubmit={onSubmit} className="p-6 space-y-3 max-w-xl">
      <h1 className="text-xl font-semibold">Create organization</h1>
      <input name="id" placeholder="org id (text)" className="border p-2 w-full" required />
      <input name="name" placeholder="Name" className="border p-2 w-full" required />
      <input name="primary_email" type="email" placeholder="Email" className="border p-2 w-full" required />
      <input name="primary_phone" placeholder="Phone" className="border p-2 w-full" required />
      <input name="address_line1" placeholder="Address 1" className="border p-2 w-full" required />
      <input name="city" placeholder="City" className="border p-2 w-full" required />
      <input name="state" placeholder="State" className="border p-2 w-full" required />
      <input name="zip_code" placeholder="ZIP" className="border p-2 w-full" required />
      <button disabled={loading} className="px-4 py-2 rounded bg-black text-white">
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
