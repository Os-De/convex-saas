import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/ui/button";
import { useRef, useState } from "react";

export const Route = createFileRoute("/uploader")({
  component: UploaderPage,
});

type Preview =
  | { kind: "text"; text: string }
  | { kind: "table"; rows: string[][]; note?: string }
  | { kind: "image" }
  | { kind: "pdf" }
  | { kind: "binary" }
  | { kind: "error"; message: string };

interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: number;
  url: string;
  preview: Preview;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function parseCsv(text: string, separator: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === separator) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

async function buildPreview(file: File): Promise<Preview> {
  const ext = file.name.includes(".")
    ? (file.name.split(".").pop() ?? "").toLowerCase()
    : "";
  try {
    if (file.type.startsWith("image/")) {
      return { kind: "image" };
    }
    if (ext === "pdf") {
      return { kind: "pdf" };
    }
    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({
        arrayBuffer: await file.arrayBuffer(),
      });
      return { kind: "text", text: result.value.trim() || "(no text found)" };
    }
    if (ext === "xlsx" || ext === "xls") {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils
        .sheet_to_json<(string | number | boolean | null)[]>(sheet, {
          header: 1,
        })
        .map((r) => r.map((cell) => String(cell ?? "")));
      const extra = workbook.SheetNames.length - 1;
      return {
        kind: "table",
        rows,
        note: `Sheet: ${sheetName}${extra > 0 ? ` (+${extra} more)` : ""}`,
      };
    }
    if (ext === "csv" || ext === "tsv") {
      const text = await file.text();
      return { kind: "table", rows: parseCsv(text, ext === "tsv" ? "\t" : ",") };
    }
    if (ext === "json") {
      const text = await file.text();
      try {
        return { kind: "text", text: JSON.stringify(JSON.parse(text), null, 2) };
      } catch {
        return { kind: "text", text };
      }
    }
    const text = await file.text();
    const sample = text.slice(0, 1000);
    for (let i = 0; i < sample.length; i++) {
      const code = sample.charCodeAt(i);
      if (code === 0 || code === 65533) {
        return { kind: "binary" };
      }
    }
    return { kind: "text", text: text.slice(0, 200000) || "(empty file)" };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function PreviewBlock({ doc }: { doc: UploadedDoc }) {
  const preview = doc.preview;
  if (preview.kind === "image") {
    return (
      <img
        src={doc.url}
        alt={doc.name}
        className="max-h-96 max-w-full rounded-md border border-border"
      />
    );
  }
  if (preview.kind === "pdf") {
    return (
      <embed
        src={doc.url}
        type="application/pdf"
        className="h-96 w-full rounded-md border border-border"
      />
    );
  }
  if (preview.kind === "table") {
    return (
      <div className="w-full">
        {preview.note && (
          <p className="mb-2 text-xs text-primary/60">{preview.note}</p>
        )}
        <div className="max-h-96 w-full overflow-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <tbody>
              {preview.rows.slice(0, 500).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border last:border-b-0">
                  {row.map((cell, cellIndex) =>
                    rowIndex === 0 ? (
                      <th key={cellIndex} className="border-r border-border px-3 py-1.5 font-medium last:border-r-0">
                        {cell}
                      </th>
                    ) : (
                      <td key={cellIndex} className="border-r border-border px-3 py-1.5 last:border-r-0">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.rows.length > 500 && (
          <p className="mt-2 text-xs text-primary/60">
            Showing first 500 rows of {preview.rows.length}.
          </p>
        )}
      </div>
    );
  }
  if (preview.kind === "text") {
    return (
      <pre className="max-h-96 w-full overflow-auto whitespace-pre-wrap rounded-md border border-border bg-secondary p-3 text-sm dark:bg-card">
        {preview.text}
      </pre>
    );
  }
  if (preview.kind === "error") {
    return (
      <p className="text-sm text-destructive">
        Could not read this file: {preview.message}
      </p>
    );
  }
  return (
    <p className="text-sm text-primary/60">
      Binary file — preview not available. Use the download button to get the
      file.
    </p>
  );
}

function extractedText(preview: Preview): string | undefined {
  if (preview.kind === "text") {
    return preview.text;
  }
  if (preview.kind === "table") {
    return preview.rows.map((row) => row.join("\t")).join("\n");
  }
  return undefined;
}

export default function UploaderPage() {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    const added = await Promise.all(
      files.map(async (file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        type: file.type || "unknown type",
        addedAt: Date.now(),
        url: URL.createObjectURL(file),
        preview: await buildPreview(file),
      })),
    );
    setDocs((prev) => [...added, ...prev]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: string) => {
    setDocs((prev) => {
      const target = prev.find((doc) => doc.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((doc) => doc.id !== id);
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-primary">Document uploader</h1>
        <p className="text-sm text-primary/60">
          Upload documents and get their data out. Everything runs in your
          browser — nothing is sent to a server.
        </p>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(Array.from(event.dataTransfer.files));
        }}
        className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/40"
        }`}
      >
        <Upload className="h-6 w-6 text-primary/60" />
        <span className="text-sm font-medium text-primary">
          Drop files here or click to browse
        </span>
        <span className="text-xs text-primary/60">
          PDF, Word (.docx), Excel (.xlsx), CSV, JSON, text and images
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (!event.target.files) {
            return;
          }
          handleFiles(Array.from(event.target.files));
        }}
      />

      {docs.map((doc) => (
        <div
          key={doc.id}
          className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-6"
        >
          <div className="flex w-full items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 stroke-[1.5px] text-primary/60" />
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-sm font-medium text-primary">
                  {doc.name}
                </p>
                <p className="text-xs text-primary/60">
                  {formatBytes(doc.size)} &middot; {doc.type} &middot;{" "}
                  {new Date(doc.addedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {extractedText(doc.preview) !== undefined && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const text = extractedText(doc.preview);
                    if (text !== undefined) {
                      navigator.clipboard.writeText(text);
                    }
                  }}
                >
                  Copy text
                </Button>
              )}
              <a href={doc.url} download={doc.name}>
                <Button type="button" size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <PreviewBlock doc={doc} />
        </div>
      ))}
    </div>
  );
}
