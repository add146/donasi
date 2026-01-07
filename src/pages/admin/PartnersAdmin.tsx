// src/pages/admin/PartnersAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Modal } from "./_ui/Modal";

type LeadStatus = "new" | "contacted" | "proposal" | "won" | "lost";

type Lead = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  interested_tier: string | null;
  monthly_budget: string | number | null; // kadang teks
  message: string | null;
  agree_terms: boolean | null;
  status: LeadStatus | null;
  created_at: string;
  updated_at: string;
};

/* ---------- helpers ---------- */
function parseBudget(v: Lead["monthly_budget"]): number {
  const digits = String(v ?? "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : NaN;
}
function fmtIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function isValidLead(r: Lead): boolean {
  const companyOk = !!r.company_name && r.company_name.trim().length >= 3;
  const emailOk = !!r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim());
  const phoneDigits = (r.phone ?? "").replace(/\D/g, "");
  const phoneOk = phoneDigits.length >= 8;
  const tierOk = !!r.interested_tier && r.interested_tier.trim().length > 0;
  const budgetNum = parseBudget(r.monthly_budget);
  const budgetOk = Number.isFinite(budgetNum) && budgetNum > 0;
  const agreeOk = !!r.agree_terms;
  return companyOk && emailOk && phoneOk && tierOk && budgetOk && agreeOk;
}

function StatusPill({ status }: { status: LeadStatus | null }) {
  const s: LeadStatus = (status ?? "new").toLowerCase() as LeadStatus;
  const cls =
    s === "won"
      ? "bg-emerald-100 text-emerald-700"
      : s === "lost"
      ? "bg-rose-100 text-rose-700"
      : s === "proposal"
      ? "bg-indigo-100 text-indigo-700"
      : s === "contacted"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700"; // new
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{s}</span>;
}

const STATUS_PIPELINE: LeadStatus[] = ["new", "contacted", "proposal", "won", "lost"];

export default function PartnersAdmin() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidCount, setInvalidCount] = useState(0);

  // toolbar
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | LeadStatus>("all");

  // detail modal
  const [openDetail, setOpenDetail] = useState(false);
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [detailStatus, setDetailStatus] = useState<LeadStatus>("new");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("partnership_leads")
      .select(
        "id, company_name, contact_name, email, phone, interested_tier, monthly_budget, message, agree_terms, status, created_at, updated_at"
      )
      .not("company_name", "is", null)
      .neq("company_name", "")
      .not("email", "is", null)
      .neq("email", "")
      .not("phone", "is", null)
      .neq("phone", "")
      .not("interested_tier", "is", null)
      .eq("agree_terms", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[partners.load]", error);
      setRows([]);
      setInvalidCount(0);
    } else {
      const all = (data ?? []) as Lead[];
      const valid = all.filter(isValidLead);
      setRows(valid);
      setInvalidCount(all.length - valid.length);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function openDetailOf(r: Lead) {
    setViewing(r);
    setDetailStatus((r.status as LeadStatus) || "new");
    setOpenDetail(true);
  }

  // set status langsung ke nilai pipeline (dipakai dropdown & tombol Simpan)
  async function setStatus(target: Lead, resolved: LeadStatus) {
    let { error } = await supabase.from("partnership_leads").update({ status: resolved }).eq("id", target.id);
    if (error && /42703|does not exist/i.test(error.message || "")) {
      ({ error } = await supabase.from("partnership_leads").update({ status: resolved }).eq("uuid", target.id));
    }
    if (error) throw error;
  }

  // mapping tombol cepat approve/reject
  async function updateStatus(target: Lead, next: "approved" | "rejected") {
    setActing(next === "approved" ? "approve" : "reject");
    try {
      await setStatus(target, next === "approved" ? "won" : "lost");
      setOpenDetail(false);
      setViewing(null);
      await load();
    } catch (error: any) {
      if (/23514|check constraint/i.test(error?.message || "")) {
        alert("Gagal: status tidak diizinkan oleh constraint. (Pipeline: new/contacted/proposal/won/lost)");
      } else {
        alert(error?.message || "Gagal memperbarui status");
      }
    } finally {
      setActing(null);
    }
  }

  // toolbar: hitung counter status & baris terfilter
  const counts = useMemo(() => {
    const base = { all: rows.length } as Record<string, number>;
    for (const s of STATUS_PIPELINE) base[s] = rows.filter((r) => (r.status ?? "new") === s).length;
    return base;
  }, [rows]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      const tabOk = tab === "all" ? true : (r.status ?? "new") === tab;
      if (!tabOk) return false;
      if (!ql) return true;
      const h = [
        r.company_name,
        r.contact_name ?? "",
        r.email,
        r.phone ?? "",
        r.interested_tier ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return h.includes(ql);
    });
  }, [rows, q, tab]);

  function exportCsv() {
    const header = ["PIC", "Perusahaan", "Email", "Telepon", "Tier", "Budget/bln", "Status", "Masuk"];
    const lines = filtered.map((r) => {
      const n = parseBudget(r.monthly_budget);
      return [
        (r.contact_name ?? "").replace(/"/g, '""'),
        r.company_name.replace(/"/g, '""'),
        r.email,
        r.phone ?? "",
        r.interested_tier ?? "",
        Number.isFinite(n) ? fmtIDR(n) : "",
        (r.status ?? "new"),
        new Date(r.created_at).toLocaleString("id-ID"),
      ]
        .map((v) => `"${v}"`)
        .join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `partnership_leads_${tab}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading) return <div className="text-slate-500">Memuat data…</div>;

  const isFinal = viewing?.status === "won" || viewing?.status === "lost";

  return (
    <div className="space-y-4">
      {/* Header + toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium">Lead Kemitraan</div>
          <div className="text-slate-500 text-sm">
            {counts.all} pengajuan valid
            {invalidCount > 0 && (
              <>
                {" "}&bull; <span className="text-amber-600">{invalidCount}</span> diabaikan (tidak lengkap/format salah)
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari PIC/perusahaan/email…"
              className="w-72 rounded-xl border px-3 py-2"
            />
          </div>
          <button onClick={load} className="rounded-xl border px-3 py-2 hover:bg-slate-50">Refresh</button>
          <button onClick={exportCsv} className="rounded-xl bg-slate-900 px-3 py-2 text-white">Export CSV</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUS_PIPELINE] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (tab === key ? "bg-slate-900 text-white border-slate-900" : "hover:bg-slate-50")
            }
          >
            {key} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-[1060px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">PIC</th>
              <th className="text-left p-3">Perusahaan</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Telepon</th>
              <th className="text-left p-3">Tier</th>
              <th className="text-right p-3">Budget/bln</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Masuk</th>
              <th className="text-left p-3 w-[1%]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const budgetNum = parseBudget(r.monthly_budget);
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.contact_name || "-"}</td>
                  <td className="p-3 font-medium">{r.company_name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.phone || "-"}</td>
                  <td className="p-3">{r.interested_tier || "-"}</td>
                  <td className="p-3 text-right">{Number.isFinite(budgetNum) ? fmtIDR(budgetNum) : "-"}</td>
                  <td className="p-3"><StatusPill status={r.status} /></td>
                  <td className="p-3">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                  <td className="p-3">
                    <button
                      onClick={() => openDetailOf(r)}
                      className="rounded-lg border px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td className="p-6 text-center text-slate-400" colSpan={9}>
                  Tidak ada data untuk filter saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail */}
      <Modal
        open={openDetail}
        onClose={() => {
          setOpenDetail(false);
          setViewing(null);
        }}
        title="Detail Kemitraan"
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Masuk: <span className="font-medium">{new Date(viewing.created_at).toLocaleString("id-ID")}</span>
              </div>
              <StatusPill status={viewing.status} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Perusahaan"><div className="rounded-xl border px-3 py-2 bg-slate-50">{viewing.company_name}</div></Field>
              <Field label="PIC"><div className="rounded-xl border px-3 py-2 bg-slate-50">{viewing.contact_name || "-"}</div></Field>
              <Field label="Email"><div className="rounded-xl border px-3 py-2 bg-slate-50">{viewing.email}</div></Field>
              <Field label="Telepon"><div className="rounded-xl border px-3 py-2 bg-slate-50">{viewing.phone || "-"}</div></Field>
              <Field label="Tier"><div className="rounded-xl border px-3 py-2 bg-slate-50">{viewing.interested_tier || "-"}</div></Field>
              <Field label="Budget / bulan">
                <div className="rounded-xl border px-3 py-2 bg-slate-50">
                  {Number.isFinite(parseBudget(viewing.monthly_budget)) ? fmtIDR(parseBudget(viewing.monthly_budget)) : "-"}
                </div>
              </Field>
            </div>

            <Field label="Catatan">
              <div className="rounded-xl border px-3 py-2 bg-slate-50 whitespace-pre-wrap min-h-[72px]">
                {viewing.message || "-"}
              </div>
            </Field>

            {/* ganti status via dropdown */}
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Ubah Status (pipeline)">
                <select
                  value={detailStatus}
                  onChange={(e) => setDetailStatus(e.target.value as LeadStatus)}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  {STATUS_PIPELINE.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(viewing, "rejected")}
                  disabled={acting !== null || isFinal}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  {acting === "reject" ? "Menolak…" : "Tolak"}
                </button>
                <button
                  onClick={() => updateStatus(viewing, "approved")}
                  disabled={acting !== null || isFinal}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {acting === "approve" ? "Menyetujui…" : "Setujui"}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!viewing) return;
                    try {
                      await setStatus(viewing, detailStatus);
                      setOpenDetail(false);
                      setViewing(null);
                      await load();
                    } catch (error: any) {
                      if (/23514|check constraint/i.test(error?.message || "")) {
                        alert("Status tidak diizinkan oleh constraint.");
                      } else {
                        alert(error?.message || "Gagal menyimpan status");
                      }
                    }
                  }}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-50"
                >
                  Simpan Status
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------- kecil ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-600">{label}</div>
      {children}
    </label>
  );
}
