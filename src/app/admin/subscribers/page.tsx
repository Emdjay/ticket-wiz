"use client";

import { useMemo, useState } from "react";

type Subscriber = {
  email: string;
  created_at: string;
};

export default function SubscribersAdminPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subscribers;
    return subscribers.filter((s) => s.email.toLowerCase().includes(term));
  }, [search, subscribers]);

  async function loadSubscribers() {
    if (!token.trim()) {
      setStatus("error");
      setMessage("Enter your admin token.");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/subscribers", {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (!response.ok) {
        setStatus("error");
        setMessage("Unauthorized or failed to load.");
        return;
      }
      const data = await response.json();
      setSubscribers(data.subscribers ?? []);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Failed to load subscribers.");
    }
  }

  async function deleteEmail(email: string) {
    if (!token.trim()) return;
    const confirmed = window.confirm(`Remove ${email}?`);
    if (!confirmed) return;
    try {
      const response = await fetch("/api/admin/subscribers", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setStatus("error");
        setMessage("Failed to delete.");
        return;
      }
      setSubscribers((prev) => prev.filter((s) => s.email !== email));
    } catch {
      setStatus("error");
      setMessage("Failed to delete.");
    }
  }

  function exportCsv() {
    if (!token.trim()) {
      setStatus("error");
      setMessage("Enter your admin token.");
      return;
    }
    const url = `/api/admin/subscribers/export`;
    const link = document.createElement("a");
    link.href = url;
    link.download = "subscribers.csv";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener(
      "click",
      () => {
        setTimeout(() => link.remove(), 0);
      },
      { once: true }
    );
    document.body.appendChild(link);
    fetch(url, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    }).then(async (res) => {
      if (!res.ok) {
        setStatus("error");
        setMessage("Export failed.");
        link.remove();
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.click();
      URL.revokeObjectURL(blobUrl);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10 text-[#000034]">
      <h1 className="text-xl font-semibold">Subscriber List</h1>
      <p className="text-sm text-[#363535]">
        Enter your admin token to load, delete, or export subscribers.
      </p>

      <div className="grid gap-2 rounded-2xl border border-[#D9E2EA] bg-white p-4 shadow-sm">
        <label className="text-xs font-semibold text-[#0F386E]">Admin token</label>
        <input
          type="password"
          value={token}
          onChange={(event) => {
            setToken(event.target.value);
            if (status !== "idle") {
              setStatus("idle");
              setMessage(null);
            }
          }}
          className="h-10 rounded-xl border border-[#C2D1DF] bg-white px-3 text-sm text-[#363535] outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadSubscribers}
            className="h-9 rounded-xl bg-[#0F386E] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#1D4F91]"
          >
            {status === "loading" ? "Loading..." : "Load subscribers"}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="h-9 rounded-xl border border-[#C9D8EA] bg-white px-4 text-xs font-semibold text-[#0F386E] shadow-sm hover:border-[#1D4F91]"
          >
            Export CSV
          </button>
        </div>
        {message ? (
          <div
            className={`text-xs ${status === "error" ? "text-[#B42318]" : "text-[#006A52]"}`}
            role="status"
          >
            {message}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-[#363535]">
          {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search email"
          className="h-9 w-full max-w-xs rounded-xl border border-[#C2D1DF] bg-white px-3 text-xs text-[#363535] outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
        />
      </div>

      <div className="grid gap-2 rounded-2xl border border-[#D9E2EA] bg-white p-4 shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-sm text-[#69707a]">No subscribers yet.</div>
        ) : (
          <ul className="grid gap-2 text-sm">
            {filtered.map((subscriber) => (
              <li
                key={subscriber.email}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E4ECF3] bg-[#F7FAFE] px-3 py-2"
              >
                <div>
                  <div className="font-semibold text-[#000034]">{subscriber.email}</div>
                  <div className="text-[11px] text-[#69707a]">
                    {new Date(subscriber.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteEmail(subscriber.email)}
                  className="h-8 rounded-xl border border-[#F5CFB3] bg-white px-3 text-[11px] font-semibold text-[#D57800] hover:border-[#D57800]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
