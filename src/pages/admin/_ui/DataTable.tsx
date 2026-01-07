import { ReactNode } from "react";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
};

export default function DataTable<T>({
  loading,
  columns,
  data,
  toolbar,
  empty,
  onRowClick,
  footer,
}: {
  loading?: boolean;
  columns: Column<T>[];
  data: T[];
  toolbar?: ReactNode;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      {/* Toolbar */}
      {toolbar && <div className="border-b p-3">{toolbar}</div>}

      {/* Table */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-slate-600">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className={`px-4 py-3 ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={columns.length}>
                  Memuat…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center" colSpan={columns.length}>
                  {empty ?? <span className="text-slate-500">Belum ada data.</span>}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={(row as any).id ?? idx}
                  onClick={() => onRowClick?.(row)}
                  className="group border-t hover:bg-slate-50"
                >
                  {columns.map((c) => (
                    <td key={String(c.key)} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.render ? c.render(row) : String((row as any)[c.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {footer && <div className="border-t p-3">{footer}</div>}
    </div>
  );
}
