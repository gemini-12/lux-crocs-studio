import { createFileRoute } from "@tanstack/react-router";

import { MIME_BY_EXT, downloadImage } from "@/lib/cms.server";

/**
 * Serves product images from Supabase Storage (private bucket) so the public
 * storefront can render them without exposing any credentials.
 */
export const Route = createFileRoute("/images/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = String(params._splat ?? "");
        const ext = key.split(".").pop()?.toLowerCase() ?? "";
        if (!key || key.includes("..") || !MIME_BY_EXT[ext]) {
          return new Response("Not found", { status: 404 });
        }
        const bytes = await downloadImage(decodeURIComponent(key));
        if (!bytes) return new Response("Not found", { status: 404 });
        return new Response(bytes, {
          headers: {
            "content-type": MIME_BY_EXT[ext],
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
