import { redirect } from "next/navigation";

/**
 * /password — DEPRECATED as of 2026-08-16 PWYW pivot.
 * The private-beta gate is retired; every visitor gets full free access.
 * This route now permanently redirects to the homepage.
 * Kept as a route (not deleted) so bookmarks + backlinks don't 404.
 */
export default function PasswordPage() {
  redirect("/");
}
