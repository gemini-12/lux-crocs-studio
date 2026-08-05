import { Link } from "@tanstack/react-router";

/** Invisible 16px access point in the bottom-right corner of the storefront. */
export function HiddenAdminAccess() {
  return (
    <Link
      to="/admin"
      aria-hidden
      tabIndex={-1}
      title=""
      className="fixed bottom-0 right-0 z-[60] size-4 opacity-0"
    />
  );
}
