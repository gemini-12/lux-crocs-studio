import { createFileRoute } from "@tanstack/react-router";

import { isUnlocked, saveImageBytes } from "@/lib/cms.server";

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/admin/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!(await isUnlocked())) return json({ error: "Access Denied" }, 401);

          const contentType = request.headers.get("content-type") ?? "";
          if (!contentType.includes("multipart/form-data")) {
            return json({ error: "Expected multipart/form-data upload" }, 415);
          }

          const form = await request.formData();
          const file = form.get("file");
          const folder = String(form.get("folder") ?? "uploads");
          if (!(file instanceof File)) {
            return json({ error: 'Missing "file" field in the upload' }, 400);
          }

          const bytes = new Uint8Array(await file.arrayBuffer());
          const url = await saveImageBytes(bytes, file.type, file.name, folder);
          return json({ url, size: bytes.byteLength, name: file.name }, 200);
        } catch (error) {
          console.error("[cms] image upload failed:", error);
          const message =
            error instanceof Error &&
            /Unsupported|empty|Invalid|Storage rejected/i.test(error.message)
              ? error.message
              : "The image could not be stored. Please try again.";
          return json({ error: message }, 500);
        }
      },
    },
  },
});
