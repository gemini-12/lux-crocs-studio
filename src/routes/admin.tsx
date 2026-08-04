import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBox,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiEyeOff,
  FiImage,
  FiLoader,
  FiLock,
  FiLogOut,
  FiPlus,
  FiSliders,
  FiStar,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  adminDeleteImage,
  adminDeleteProduct,
  adminListProducts,
  adminLogin,
  adminLogout,
  adminReorderProducts,
  adminSaveProduct,
  adminStatus,
  adminUploadImage,
} from "@/lib/admin.functions";
import { prepareImage, thumbUrl } from "@/lib/image-optimize";
import type { Product } from "@/data/product-types";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Studio Access" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Private studio access." },
    ],
  }),
  component: AdminPage,
});

const EASE = [0.16, 1, 0.3, 1] as const;
const card =
  "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)]";
const field =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/35";

const emptyProduct = (order: number): Product => ({
  id: "",
  slug: "",
  name: "",
  description: "",
  price: "",
  category: "Classic Clog",
  color_name: "",
  eyebrow: `Collection ${String(order).padStart(2, "0")}`,
  release_label: "",
  alt_text: "",
  sizes: ["38", "39", "40", "41", "42", "43", "44"],
  colors: [],
  hero_image: "",
  gallery_images: [],
  accent: "oklch(0.75 0.03 250)",
  glow: "oklch(0.85 0.02 240 / 0.22)",
  bg_from: "oklch(0.19 0.01 250)",
  bg_to: "oklch(0.08 0.005 250)",
  ink: "oklch(0.97 0.002 250)",
  display_order: order,
  is_active: true,
});

function AdminPage() {
  const status = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => adminStatus(),
    staleTime: 0,
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_120%_at_20%_0%,#181a22_0%,#08090c_60%)] text-white">
      <Toaster />
      {status.isLoading ? (
        <div className="grid min-h-screen place-items-center">
          <FiLoader className="size-5 animate-spin opacity-50" />
        </div>
      ) : status.data?.authed ? (
        <Dashboard />
      ) : (
        <LoginScreen onSuccess={() => status.refetch()} />
      )}
    </div>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await login({ data: { password } });
      if (res.ok) onSuccess();
      else setError("Access Denied");
    } catch {
      setError("Access Denied");
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className={`${card} w-full max-w-sm p-8`}
      >
        <div className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
          <FiLock aria-hidden />
        </div>
        <h1 className="mt-6 text-xl font-semibold tracking-tight">Studio access</h1>
        <p className="mt-2 text-sm text-white/45">Enter the password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="Password"
          aria-label="Password"
          className={`${field} mt-6`}
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:-translate-y-0.5 disabled:opacity-40"
        >
          {busy ? <FiLoader className="animate-spin" aria-hidden /> : null}
          Enter
        </button>
      </motion.form>
    </div>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const logout = useServerFn(adminLogout);
  const [view, setView] = useState<"catalog" | "order">("catalog");
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => adminListProducts(),
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["public-products"] });
  }, [qc]);

  const save = useServerFn(adminSaveProduct);
  const remove = useServerFn(adminDeleteProduct);
  const reorder = useServerFn(adminReorderProducts);

  const saveMutation = useMutation({
    mutationFn: (p: Product) => {
      const { id, ...rest } = p;
      return save({ data: { ...(id ? { id } : {}), ...rest } });
    },
    onSuccess: () => {
      toast.success("Saved. The website is updated.");
      setEditing(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not save the product."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Product deleted.");
      setPendingDelete(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete the product."),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorder({ data: { ids } }),
    onSuccess: () => {
      toast.success("Order updated.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not reorder products."),
  });

  const list = products.data ?? [];

  const move = (index: number, dir: -1 | 1) => {
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    reorderMutation.mutate(next.map((p) => p.id));
  };

  const makeFirst = (index: number) => {
    const next = [...list];
    const [item] = next.splice(index, 1);
    reorderMutation.mutate([item!.id, ...next.map((p) => p.id)]);
  };

  const toggleActive = (p: Product) => saveMutation.mutate({ ...p, is_active: !p.is_active });

  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
      <aside className={`${card} h-fit shrink-0 p-5 lg:sticky lg:top-8 lg:w-64`}>
        <p className="px-2 text-[0.6rem] uppercase tracking-[0.4em] text-white/40">Croc.Atelier</p>
        <p className="mt-1 px-2 text-sm font-medium">Studio</p>
        <nav className="mt-6 flex gap-2 lg:flex-col">
          {[
            { id: "catalog" as const, label: "Catalog", icon: FiBox },
            { id: "order" as const, label: "Slider order", icon: FiSliders },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                view === item.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              <item.icon aria-hidden /> {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={async () => {
            await logout({});
            qc.clear();
            window.location.reload();
          }}
          className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:text-white"
        >
          <FiLogOut aria-hidden /> Sign out
        </button>
      </aside>

      <main className="flex-1">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {view === "catalog" ? "Crocs catalog" : "Slider order"}
            </h1>
            <p className="mt-1 text-sm text-white/45">
              {view === "catalog"
                ? "Every change goes live on the website instantly."
                : "The first product opens the homepage slider."}
            </p>
          </div>
          {view === "catalog" && (
            <button
              onClick={() => setEditing(emptyProduct(list.length + 1))}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:-translate-y-0.5"
            >
              <FiPlus aria-hidden /> New Crocs
            </button>
          )}
        </header>

        {products.isLoading ? (
          <div className="mt-16 grid place-items-center">
            <FiLoader className="size-5 animate-spin opacity-50" />
          </div>
        ) : view === "catalog" ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p, i) => (
              <motion.article
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
                className={`${card} overflow-hidden p-5`}
              >
                <div className="grid h-40 place-items-center rounded-2xl bg-black/30">
                  {p.hero_image ? (
                    <img
                      src={thumbUrl(p.hero_image)}
                      alt={p.alt_text || p.name}
                      loading="lazy"
                      className="max-h-32 object-contain"
                    />
                  ) : (
                    <FiImage className="opacity-30" aria-hidden />
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium leading-tight">{p.name}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {p.price} · {p.category}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.2em] ${
                      p.is_active ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/40"
                    }`}
                  >
                    {p.is_active ? "Live" : "Hidden"}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditing(p)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs transition hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs transition hover:bg-white/10"
                  >
                    {p.is_active ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
                    {p.is_active ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => setPendingDelete(p)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                  >
                    <FiTrash2 aria-hidden /> Delete
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {list.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                className={`${card} flex items-center gap-4 p-4`}
              >
                <span className="w-6 text-center text-xs text-white/35">{i + 1}</span>
                {p.hero_image ? (
                  <img
                    src={thumbUrl(p.hero_image)}
                    alt=""
                    loading="lazy"
                    className="size-12 object-contain"
                  />
                ) : (
                  <div className="grid size-12 place-items-center rounded-xl bg-black/30">
                    <FiImage className="opacity-30" aria-hidden />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.name}</p>
                  <p className="text-xs text-white/40">{p.is_active ? "Live" : "Hidden"}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Move up"
                    onClick={() => move(i, -1)}
                    className="rounded-lg border border-white/10 p-2 transition hover:bg-white/10"
                  >
                    <FiChevronUp aria-hidden />
                  </button>
                  <button
                    aria-label="Move down"
                    onClick={() => move(i, 1)}
                    className="rounded-lg border border-white/10 p-2 transition hover:bg-white/10"
                  >
                    <FiChevronDown aria-hidden />
                  </button>
                  <button
                    onClick={() => makeFirst(i)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                  >
                    <FiStar aria-hidden /> First
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </main>

      <AnimatePresence>
        {editing && (
          <ProductEditor
            key={editing.id || "new"}
            product={editing}
            saving={saveMutation.isPending}
            onCancel={() => setEditing(null)}
            onSave={(p) => saveMutation.mutate(p)}
          />
        )}
      </AnimatePresence>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed from the website permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function ProductEditor({
  product,
  saving,
  onSave,
  onCancel,
}: {
  product: Product;
  saving: boolean;
  onSave: (p: Product) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const [sizeInput, setSizeInput] = useState("");
  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = () => {
    if (!draft.name.trim()) return toast.error("A product name is required.");
    const slug = draft.slug.trim() || slugify(draft.name);
    onSave({ ...draft, slug, alt_text: draft.alt_text || draft.name });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={`${card} mx-auto my-6 w-full max-w-3xl p-6 md:p-8`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {product.id ? "Edit Crocs" : "New Crocs"}
            </h2>
            <p className="mt-1 text-sm text-white/45">All fields update the live site on save.</p>
          </div>
          <button
            aria-label="Close"
            onClick={onCancel}
            className="rounded-lg border border-white/10 p-2 transition hover:bg-white/10"
          >
            <FiX aria-hidden />
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Labeled label="Product name">
            <input className={field} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Labeled>
          <Labeled label="Price">
            <input className={field} value={draft.price} onChange={(e) => set("price", e.target.value)} />
          </Labeled>
          <Labeled label="Category">
            <input
              className={field}
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </Labeled>
          <Labeled label="Main color name">
            <input
              className={field}
              value={draft.color_name}
              onChange={(e) => set("color_name", e.target.value)}
            />
          </Labeled>
          <Labeled label="Eyebrow">
            <input
              className={field}
              value={draft.eyebrow}
              onChange={(e) => set("eyebrow", e.target.value)}
            />
          </Labeled>
          <Labeled label="Release line">
            <input
              className={field}
              value={draft.release_label}
              onChange={(e) => set("release_label", e.target.value)}
            />
          </Labeled>
          <div className="md:col-span-2">
            <Labeled label="Description">
              <textarea
                rows={3}
                className={field}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Labeled>
          </div>
        </div>

        <Section title="Sizes">
          <div className="flex flex-wrap gap-2">
            {draft.sizes.map((s) => (
              <span
                key={s}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs"
              >
                {s}
                <button
                  aria-label={`Remove size ${s}`}
                  onClick={() => set("sizes", draft.sizes.filter((x) => x !== s))}
                  className="text-white/40 transition hover:text-red-300"
                >
                  <FiX aria-hidden />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className={`${field} max-w-[10rem]`}
              placeholder="Add size"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = sizeInput.trim();
                  if (v && !draft.sizes.includes(v)) set("sizes", [...draft.sizes, v]);
                  setSizeInput("");
                }
              }}
            />
            <button
              onClick={() => {
                const v = sizeInput.trim();
                if (v && !draft.sizes.includes(v)) set("sizes", [...draft.sizes, v]);
                setSizeInput("");
              }}
              className="rounded-xl border border-white/10 px-4 text-sm transition hover:bg-white/10"
            >
              Add
            </button>
          </div>
        </Section>

        <Section title="Colors">
          <div className="space-y-2">
            {draft.colors.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={field}
                  placeholder="Color name"
                  value={c.name}
                  onChange={(e) => {
                    const next = [...draft.colors];
                    next[i] = { ...c, name: e.target.value };
                    set("colors", next);
                  }}
                />
                <input
                  type="color"
                  aria-label="Color value"
                  className="h-[42px] w-14 shrink-0 rounded-xl border border-white/10 bg-black/30"
                  value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#888888"}
                  onChange={(e) => {
                    const next = [...draft.colors];
                    next[i] = { ...c, hex: e.target.value };
                    set("colors", next);
                  }}
                />
                <button
                  aria-label="Remove color"
                  onClick={() => set("colors", draft.colors.filter((_, x) => x !== i))}
                  className="rounded-xl border border-white/10 px-3 text-white/40 transition hover:text-red-300"
                >
                  <FiTrash2 aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => set("colors", [...draft.colors, { name: "", hex: "#888888" }])}
            className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            <FiPlus aria-hidden /> Add color
          </button>
        </Section>

        <Section title="Hero image">
          <Dropzone
            onUploaded={(urls) => set("hero_image", urls[0] ?? draft.hero_image)}
            multiple={false}
          />
          {draft.hero_image && (
            <div className="mt-4 flex items-center gap-4">
              <img
                src={thumbUrl(draft.hero_image)}
                alt=""
                loading="lazy"
                className="size-20 rounded-xl bg-black/30 object-contain p-2"
              />
              <button
                onClick={() => set("hero_image", "")}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs transition hover:bg-white/10"
              >
                <FiTrash2 aria-hidden /> Remove
              </button>
            </div>
          )}
        </Section>

        <Section title="Gallery images">
          <Dropzone
            multiple
            onUploaded={(urls) => set("gallery_images", [...draft.gallery_images, ...urls])}
          />
          {draft.gallery_images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {draft.gallery_images.map((url) => (
                <div key={url} className="group relative">
                  <img
                    src={thumbUrl(url)}
                    alt=""
                    loading="lazy"
                    className="size-20 rounded-xl bg-black/30 object-contain p-2"
                  />
                  <button
                    aria-label="Delete image"
                    onClick={() => {
                      set("gallery_images", draft.gallery_images.filter((u) => u !== url));
                      void adminDeleteImage({ data: { url } });
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <FiX aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Slide atmosphere">
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["accent", "Accent"],
                ["glow", "Glow"],
                ["bg_from", "Background from"],
                ["bg_to", "Background to"],
                ["ink", "Text color"],
              ] as const
            ).map(([key, label]) => (
              <Labeled key={key} label={label}>
                <input
                  className={field}
                  value={draft[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </Labeled>
            ))}
          </div>
        </Section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <button
            onClick={() => set("is_active", !draft.is_active)}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/10"
          >
            {draft.is_active ? <FiEye aria-hidden /> : <FiEyeOff aria-hidden />}
            {draft.is_active ? "Visible on site" : "Hidden"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:-translate-y-0.5 disabled:opacity-40"
            >
              {saving ? <FiLoader className="animate-spin" aria-hidden /> : <FiCheck aria-hidden />}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.6rem] uppercase tracking-[0.3em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-white/10 pt-6">
      <h3 className="mb-4 text-[0.6rem] uppercase tracking-[0.3em] text-white/40">{title}</h3>
      {children}
    </section>
  );
}

function Dropzone({
  multiple,
  onUploaded,
}: {
  multiple: boolean;
  onUploaded: (urls: string[]) => void;
}) {
  const upload = useServerFn(adminUploadImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const picked = multiple ? Array.from(files) : [files[0]!];
      const urls: string[] = [];
      for (const file of picked) {
        const prepared = await prepareImage(file);
        const res = await upload({
          data: {
            filename: prepared.filename,
            contentType: prepared.contentType,
            dataBase64: prepared.dataBase64,
            thumbBase64: prepared.thumbBase64,
          },
        });
        urls.push(res.url);
      }
      onUploaded(urls);
      toast.success(urls.length > 1 ? `${urls.length} images uploaded.` : "Image uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

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
        void handle(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`grid cursor-pointer place-items-center rounded-2xl border border-dashed px-6 py-8 text-center transition ${
        over ? "border-white/40 bg-white/10" : "border-white/15 hover:bg-white/5"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/webp,image/jpeg"
        multiple={multiple}
        className="hidden"
        onChange={(e) => void handle(e.target.files)}
      />
      {busy ? (
        <FiLoader className="size-5 animate-spin opacity-60" aria-hidden />
      ) : (
        <>
          <FiUploadCloud className="size-5 opacity-60" aria-hidden />
          <p className="mt-3 text-sm text-white/60">
            Drag &amp; drop or click to upload{multiple ? " images" : " an image"}
          </p>
          <p className="mt-1 text-xs text-white/35">
            PNG, WEBP or JPEG — optimised automatically
          </p>
        </>
      )}
    </div>
  );
}
