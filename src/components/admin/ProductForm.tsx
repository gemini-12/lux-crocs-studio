import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiUploadCloud, FiX } from "react-icons/fi";
import { toast } from "sonner";

import type { Product } from "@/data/products";

const ACCEPT = ["image/png", "image/webp", "image/jpeg", "image/jpg"];

export type Draft = Omit<Product, "sizes" | "colors" | "gallery"> & {
  sizes: string[];
  colors: string[];
  gallery: string[];
};

export function emptyProduct(order: number): Draft {
  return {
    id: `p-${Date.now().toString(36)}`,
    name: "",
    description: "",
    price: "",
    category: "",
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    colors: [],
    heroImage: "",
    gallery: [],
    displayOrder: order,
    active: true,
    release: "",
    alt: "",
  };
}

const field =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30";
const label = "text-[0.65rem] uppercase tracking-[0.24em] text-white/45";

type UploadStatus = {
  name: string;
  size: number;
  preview: string;
  state: "uploading" | "done" | "error";
  message?: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Uploads via multipart/form-data to the server route — no base64 bloat. */
function useUploader(report: (s: UploadStatus) => void) {
  return useCallback(
    async (file: File): Promise<string | null> => {
      const preview = URL.createObjectURL(file);
      const base = { name: file.name, size: file.size, preview };

      if (!ACCEPT.includes(file.type.toLowerCase())) {
        const message = `Unsupported format "${file.type || "unknown"}". Use PNG, WEBP or JPEG.`;
        report({ ...base, state: "error", message });
        toast.error(message);
        return null;
      }

      report({ ...base, state: "uploading" });
      try {
        const body = new FormData();
        body.append("file", file, file.name);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !payload.url) {
          const message = payload.error ?? `Upload failed (HTTP ${res.status})`;
          report({ ...base, state: "error", message });
          toast.error(message);
          return null;
        }
        report({ ...base, state: "done", message: "Upload successful" });
        return payload.url;
      } catch (error) {
        const message = `Upload failed: ${error instanceof Error ? error.message : "network error"}`;
        report({ ...base, state: "error", message });
        toast.error(message);
        return null;
      }
    },
    [report],
  );
}

function UploadStatusList({ items }: { items: UploadStatus[] }) {
  if (!items.length) return null;
  return (
    <ul className="grid gap-2">
      {items.map((s) => (
        <li
          key={`${s.name}-${s.size}-${s.state}`}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2"
        >
          <img src={s.preview} alt="" className="size-10 rounded-lg object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-white/80">{s.name}</p>
            <p className="text-[0.65rem] text-white/40">{formatSize(s.size)}</p>
          </div>
          <span
            className={`text-[0.65rem] ${
              s.state === "error"
                ? "text-red-400"
                : s.state === "done"
                  ? "text-emerald-300"
                  : "text-white/50"
            }`}
          >
            {s.state === "uploading" ? "Uploading…" : (s.message ?? "")}
          </span>
        </li>
      ))}
    </ul>
  );
}


function Dropzone({
  onFiles,
  multiple,
  children,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border border-dashed p-5 text-center transition-colors ${
        over ? "border-white/50 bg-white/10" : "border-white/15 bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/webp,image/jpeg"
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {children}
    </div>
  );
}

export function ProductForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  value: Draft;
  onChange: (d: Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [statuses, setStatuses] = useState<UploadStatus[]>([]);
  const report = useCallback((s: UploadStatus) => {
    setStatuses((prev) => {
      const rest = prev.filter((p) => !(p.name === s.name && p.size === s.size));
      return [...rest, s];
    });
  }, []);
  const uploadFile = useUploader(report);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(key: K, v: Draft[K]) => onChange({ ...value, [key]: v });

  const handleHero = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    const url = await uploadFile(file);
    setBusy(false);
    if (url) set("heroImage", url);
  };

  const handleGallery = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    const urls = (await Promise.all(files.map(uploadFile))).filter(Boolean) as string[];
    setBusy(false);
    if (urls.length) set("gallery", [...value.gallery, ...urls]);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.name.trim()) {
          toast.error("Product name is required");
          return;
        }
        onSubmit();
      }}
      className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl md:grid-cols-2"
    >
      <div className="grid gap-2">
        <span className={label}>Product name</span>
        <input
          className={field}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Cars Classic Clog"
        />
      </div>
      <div className="grid gap-2">
        <span className={label}>Price</span>
        <input
          className={field}
          value={value.price}
          onChange={(e) => set("price", e.target.value)}
          placeholder="€240"
        />
      </div>

      <div className="grid gap-2 md:col-span-2">
        <span className={label}>Description</span>
        <textarea
          rows={3}
          className={field}
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <span className={label}>Category</span>
        <input
          className={field}
          value={value.category}
          onChange={(e) => set("category", e.target.value)}
          placeholder="Collection 01"
        />
      </div>
      <div className="grid gap-2">
        <span className={label}>Release line</span>
        <input
          className={field}
          value={value.release ?? ""}
          onChange={(e) => set("release", e.target.value)}
          placeholder="Limited Release — 500 pairs"
        />
      </div>

      <div className="grid gap-2">
        <span className={label}>Available sizes (comma separated)</span>
        <input
          className={field}
          value={value.sizes.join(", ")}
          onChange={(e) =>
            set(
              "sizes",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </div>
      <div className="grid gap-2">
        <span className={label}>Available colors (comma separated)</span>
        <input
          className={field}
          value={value.colors.join(", ")}
          onChange={(e) =>
            set(
              "colors",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </div>

      <div className="grid gap-3">
        <span className={label}>Hero image</span>
        {value.heroImage && (
          <div className="relative grid h-32 place-items-center rounded-2xl border border-white/10 bg-black/30">
            <img
              src={value.heroImage}
              alt="Hero preview"
              loading="lazy"
              className="max-h-24 object-contain"
            />
            <button
              type="button"
              aria-label="Remove hero image"
              onClick={() => set("heroImage", "")}
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white/70 hover:text-white"
            >
              <FiX />
            </button>
          </div>
        )}
        <Dropzone onFiles={handleHero}>
          <FiUploadCloud aria-hidden className="mx-auto mb-2 text-white/60" />
          <p className="text-xs text-white/50">Drag &amp; drop or click — PNG, WEBP, JPEG</p>
        </Dropzone>
      </div>

      <div className="grid gap-3">
        <span className={label}>Gallery images</span>
        {value.gallery.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.gallery.map((g) => (
              <div
                key={g}
                className="relative grid size-20 place-items-center rounded-xl border border-white/10 bg-black/30"
              >
                <img src={g} alt="" loading="lazy" className="max-h-14 object-contain" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => set("gallery", value.gallery.filter((x) => x !== g))}
                  className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-black/80 text-white/70 hover:text-white"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <Dropzone multiple onFiles={handleGallery}>
          <FiUploadCloud aria-hidden className="mx-auto mb-2 text-white/60" />
          <p className="text-xs text-white/50">Drop multiple images</p>
        </Dropzone>
        <UploadStatusList items={statuses} />
      </div>

      <div className="grid gap-2">
        <span className={label}>Display order</span>
        <input
          type="number"
          className={field}
          value={value.displayOrder}
          onChange={(e) => set("displayOrder", Number(e.target.value))}
        />
      </div>
      <div className="grid gap-2">
        <span className={label}>Status</span>
        <button
          type="button"
          onClick={() => set("active", !value.active)}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
            value.active
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-white/50"
          }`}
        >
          {value.active ? "Active — visible on site" : "Hidden"}
          <span
            className={`h-5 w-9 rounded-full p-0.5 transition-colors ${value.active ? "bg-emerald-400/60" : "bg-white/20"}`}
          >
            <span
              className={`block size-4 rounded-full bg-white transition-transform ${value.active ? "translate-x-4" : ""}`}
            />
          </span>
        </button>
      </div>

      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {busy ? "Uploading…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition-colors hover:text-white"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}
