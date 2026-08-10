import { promises as fs } from "node:fs";
import path from "node:path";
import { createFileRoute } from "@tanstack/react-router";

import { imagesDir } from "@/lib/cms.server";

const MIME: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/**
 * Fallback for images uploaded after the dev server booted — the static public
 * middleware may not know about them yet, so serve them straight from disk.
 */
export const Route = createFileRoute("/images/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const name = path.basename(String(params._splat ?? ""));
        const ext = name.split(".").pop()?.toLowerCase() ?? "";
        if (!name || !MIME[ext]) return new Response("Not found", { status: 404 });
        try {
          const file = await fs.readFile(path.join(await imagesDir(), name));
          return new Response(new Uint8Array(file), {
            headers: { "content-type": MIME[ext], "cache-control": "no-cache" },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
