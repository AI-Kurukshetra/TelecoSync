export type CsvRecord = Record<string, string>;

function escapeCsvValue(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: readonly string[]
) {
  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column])).join(",")
  );

  return [header, ...lines].join("\n");
}

export function parseCsv(input: string) {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [] as CsvRecord[];
  }

  const headers = parseCsvLine(lines[0] ?? "");
  const records: CsvRecord[] = [];

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const record: CsvRecord = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });

    records.push(record);
  }

  return records;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}
