"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  dateStart: string;
  dateEnd: string;
  provider: string;
  fetchedAt: string;
  location: { name: string; latitude: number; longitude: number };
};

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/requests");
    const data = await res.json();
    setRows(data);
  }
  useEffect(() => {
    load();
  }, []);

  async function del(id: string) {
    const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("Deleted");
      load();
    } else setMsg("Delete failed");
  }

  async function extend(id: string) {
    const r = rows.find((x) => x.id === id)!;
    const newEnd = new Date(new Date(r.dateEnd).getTime() + 2 * 86400000).toISOString();
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateEnd: newEnd }),
    });
    if (res.ok) {
      setMsg("Updated");
      load();
    } else setMsg("Update failed");
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function exportFmt(fmt: string) {
    const q = selected.length ? `?format=${fmt}&ids=${selected.join(",")}` : `?format=${fmt}`;
    window.open(`/api/export${q}`, "_blank");
  }

  return (
    <main className="max-w-5xl mx-auto p-6 grid gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        <div className="flex gap-2">
          <button onClick={() => exportFmt("json")} className="border rounded px-3 py-2 text-sm">
            Export JSON
          </button>
          <button onClick={() => exportFmt("csv")} className="border rounded px-3 py-2 text-sm">
            CSV
          </button>
          <button onClick={() => exportFmt("xml")} className="border rounded px-3 py-2 text-sm">
            XML
          </button>
          <button onClick={() => exportFmt("md")} className="border rounded px-3 py-2 text-sm">
            Markdown
          </button>
          <button onClick={() => exportFmt("pdf")} className="border rounded px-3 py-2 text-sm">
            PDF
          </button>
        </div>
      </header>

      {msg && <div className="text-sm text-amber-600">{msg}</div>}

      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
            <tr>
              <th className="p-2 w-8"></th>
              <th className="p-2 text-left font-semibold">Location</th>
              <th className="p-2 text-left font-semibold">Range</th>
              <th className="p-2 text-center font-semibold">Provider</th>
              <th className="p-2 text-center font-semibold">Fetched</th>
              <th className="p-2 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td className="p-2">{r.location.name}</td>
                <td className="p-2">
                  {new Date(r.dateStart).toLocaleDateString()} →{" "}
                  {new Date(r.dateEnd).toLocaleDateString()}
                </td>
                <td className="p-2 text-center">{r.provider}</td>
                <td className="p-2 text-center">{new Date(r.fetchedAt).toLocaleString()}</td>
                <td className="p-2 text-center">
                  <button onClick={() => extend(r.id)} className="text-blue-600 mr-3">
                    Update
                  </button>
                  <button onClick={() => del(r.id)} className="text-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={6}>
                  No saved requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
