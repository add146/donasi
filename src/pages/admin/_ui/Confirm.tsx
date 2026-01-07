export function Confirm({
  open,
  title = "Konfirmasi",
  message,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  title?: string;
  message: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b p-4 font-medium">{title}</div>
        <div className="p-4 text-slate-600">{message}</div>
        <div className="flex justify-end gap-2 border-t p-3">
          <button onClick={onCancel} className="rounded-xl px-4 py-2 hover:bg-slate-100">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
