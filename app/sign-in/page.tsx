/**
 * Alias: redirect only to canonical auth route. No auth logic here.
 */
import { redirect } from "next/navigation";

export default function SignInPage() {
  redirect("/auth/login");
}
