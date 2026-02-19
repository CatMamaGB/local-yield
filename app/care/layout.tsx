/**
 * Care root layout. __last_active_mode cookie is set in proxy.ts (Next.js 16 only allows cookie mutation there).
 */

export default function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
