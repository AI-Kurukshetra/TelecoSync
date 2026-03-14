type DataTableProps = {
  columns: string[];
  rows: React.ReactNode[][];
  emptyMessage?: string;
};

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found."
}: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-sm text-[var(--muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)] text-sm">
          <thead className="bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,239,230,0.72))]">
            <tr>
              {columns.map((column) => (
                <th
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                  key={column}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[rgba(255,255,255,0.74)]">
            {rows.map((row, rowIndex) => (
              <tr className="align-top odd:bg-white/60 even:bg-[rgba(12,28,42,0.02)]" key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-3.5 text-[var(--ink)]" key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
