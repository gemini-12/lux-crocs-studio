import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  FiGrid,
  FiBox,
  FiSettings,
  FiLogOut,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMove,
  FiLock,
  FiSave,
} from "react-icons/fi";

import type { Product } from "@/data/products";
import { productsQueryOptions } from "@/data/products";
import {
  adminLogin,
  adminLogout,
  getAdminSession,
  saveProductsFn,
} from "@/lib/cms.functions";
import { ProductForm, emptyProduct, type Draft } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Studio Console — Croc.Atelier" },
      { name: "description", content: "Private catalogue console for the Croc.Atelier storefront." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Studio Console — Croc.Atelier" },
      { property: "og:description", content: "Private catalogue console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab = "dashboard" | "products" | "settings";

function AdminPage() {
  const sessionQuery = useQuery({
    queryKey: ["admin-session"],
    queryFn: () => getAdminSession(),
    staleTime: 0,
  });

  if (sessionQuery.isLoading) {
    return <div className="min-h-screen bg-[#070708]" />;
  }
  return sessionQuery.data?.unlocked ? (
    <Dashboard onLoggedOut={() => sessionQuery.refetch()} />
  ) : (
    <Login onSuccess={() => sessionQuery.refetch()} />
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-[#070708] px-6">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const res = await login({ data: { password } });
          setBusy(false);
          if (res.ok) {
            setDenied(false);
            onSuccess();
          } else {
            setDenied(true);
            setPassword("");
          }
        }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl"
      >
        <div className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
          <FiLock aria-hidden />
        </div>
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-white">Studio Console</h1>
        <p className="mt-2 text-sm text-white/40">Restricted area.</p>

        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-7 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
        />

        {denied && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            Access Denied
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-white py-3 text-sm font-medium text-black transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </motion.form>
    </main>
  );
}

const NAV: { id: Tab; label: string; icon: typeof FiGrid }[] = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid },
  { id: "products", label: "Products", icon: FiBox },
  { id: "settings", label: "Settings", icon: FiSettings },
];

function Dashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const qc = useQueryClient();
  const productsQuery = useQuery(productsQueryOptions);
  const save = useServerFn(saveProductsFn);
  const logout = useServerFn(adminLogout);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [items, setItems] = useState<Product[]>([]);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (productsQuery.data && !dirty) setItems(productsQuery.data);
  }, [productsQuery.data, dirty]);

  const saveMutation = useMutation({
    mutationFn: (next: Product[]) => save({ data: { products: next } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(`Could not save: ${res.error}`);
        return;
      }
      setItems(res.products);
      setDirty(false);
      qc.setQueryData(productsQueryOptions.queryKey, res.products);
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Changes saved — storefront updated");
    },
    onError: (error) =>
      toast.error(`Could not save changes: ${error instanceof Error ? error.message : "unknown"}`),
  });

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((p) => p.active).length,
      hidden: items.filter((p) => !p.active).length,
      images: items.reduce((n, p) => n + (p.heroImage ? 1 : 0) + p.gallery.length, 0),
    }),
    [items],
  );

  const update = (next: Product[]) => {
    setItems(next.map((p, i) => ({ ...p, displayOrder: i })));
    setDirty(true);
  };

  const onDrop = (to: number) => {
    if (dragIndex === null || dragIndex === to) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(to, 0, moved!);
    update(next);
    setDragIndex(null);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed -left-40 -top-40 size-[38rem] rounded-full bg-indigo-500/10 blur-[140px]"
      />
      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-6 p-4 md:flex-row md:p-8">
        {/* sidebar */}
        <aside className="h-max rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl md:sticky md:top-8 md:w-60">
          <p className="px-3 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/40">
            Croc.Atelier
          </p>
          <nav className="mt-3 flex gap-1 md:flex-col">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  tab === n.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                <n.icon aria-hidden /> <span className="hidden sm:inline">{n.label}</span>
              </button>
            ))}
            <button
              onClick={async () => {
                await logout({ data: undefined });
                onLoggedOut();
              }}
              className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition-colors hover:text-red-300"
            >
              <FiLogOut aria-hidden /> <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </aside>

        {/* main */}
        <main className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {NAV.find((n) => n.id === tab)?.label}
              </h1>
              <p className="mt-1 text-sm text-white/40">
                {dirty ? "Unsaved changes" : "Everything is in sync"}
              </p>
            </div>
            <div className="flex gap-3">
              {tab === "products" && (
                <button
                  onClick={() => {
                    setIsNew(true);
                    setEditing(emptyProduct(items.length));
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80 transition-colors hover:text-white"
                >
                  <FiPlus aria-hidden /> Add product
                </button>
              )}
              <button
                onClick={() => saveMutation.mutate(items)}
                disabled={!dirty || saveMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:-translate-y-0.5 disabled:opacity-40"
              >
                <FiSave aria-hidden /> {saveMutation.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.section
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8"
            >
              {tab === "dashboard" && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    ["Products", stats.total],
                    ["Active", stats.active],
                    ["Hidden", stats.hidden],
                    ["Images", stats.images],
                  ].map(([k, v]) => (
                    <div
                      key={String(k)}
                      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl"
                    >
                      <p className="text-[0.65rem] uppercase tracking-[0.24em] text-white/40">{k}</p>
                      <p className="mt-4 text-4xl font-semibold tracking-tight">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === "products" && (
                <div className="grid gap-4">
                  {editing && (
                    <ProductForm
                      value={editing}
                      onChange={setEditing}
                      submitLabel={isNew ? "Add product" : "Update product"}
                      onCancel={() => setEditing(null)}
                      onSubmit={() => {
                        const next = isNew
                          ? [...items, editing as Product]
                          : items.map((p) => (p.id === editing.id ? (editing as Product) : p));
                        update(next);
                        setEditing(null);
                        toast.success(isNew ? "Product added — remember to save" : "Product updated");
                      }}
                    />
                  )}

                  {items.map((p, i) => (
                    <article
                      key={p.id}
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDrop(i)}
                      className={`flex flex-wrap items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl transition-colors ${
                        dragIndex === i ? "border-white/30" : "hover:border-white/20"
                      }`}
                    >
                      <FiMove aria-hidden className="cursor-grab text-white/30" />
                      <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-black/40">
                        {p.heroImage ? (
                          <img
                            src={p.heroImage}
                            alt={p.alt || p.name}
                            loading="lazy"
                            decoding="async"
                            className="max-h-16 object-contain"
                          />
                        ) : (
                          <span className="text-[0.6rem] text-white/30">No image</span>
                        )}
                      </div>
                      <div className="min-w-40 flex-1">
                        <p className="text-[0.6rem] uppercase tracking-[0.3em] text-white/40">
                          {p.category}
                        </p>
                        <h3 className="mt-1 truncate text-base font-medium">{p.name}</h3>
                        <p className="mt-1 text-xs text-white/40">Sizes: {p.sizes.join(" · ")}</p>
                      </div>
                      <p className="text-lg">{p.price}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${
                          p.active
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-white/5 text-white/40"
                        }`}
                      >
                        {p.active ? "Active" : "Hidden"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          aria-label={`Edit ${p.name}`}
                          onClick={() => {
                            setIsNew(false);
                            setEditing({ ...p } as Draft);
                          }}
                          className="grid size-10 place-items-center rounded-full border border-white/10 text-white/60 transition-colors hover:text-white"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          aria-label={`Delete ${p.name}`}
                          onClick={() => setConfirmId(p.id)}
                          className="grid size-10 place-items-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-red-400/40 hover:text-red-300"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </article>
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
                      No products yet.
                    </p>
                  )}
                </div>
              )}

              {tab === "settings" && (
                <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-sm text-white/60 backdrop-blur-2xl">
                  <p>
                    Catalogue source:{" "}
                    <span className="text-white">/data/products.json</span>
                  </p>
                  <p>
                    Uploads folder: <span className="text-white">/public/images/</span>
                  </p>
                  <p>
                    The storefront reads this file on every load — saving here updates the hero
                    slider, product page, collection grid and gallery instantly.
                  </p>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </main>
      </div>

      {/* delete confirmation */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6 backdrop-blur-sm"
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d0d10] p-7"
            >
              <h2 className="text-lg font-semibold">Delete product?</h2>
              <p className="mt-2 text-sm text-white/50">
                This removes it from the catalogue. Unused images are cleaned up on save.
              </p>
              <div className="mt-7 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmId(null)}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    update(items.filter((p) => p.id !== confirmId));
                    setConfirmId(null);
                    toast.success("Product removed — remember to save");
                  }}
                  className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
