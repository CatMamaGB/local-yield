/**
 * Admin: user moderation.
 * TODO: Protect with requireAdmin; list users and roles.
 */

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Admin: Users</h1>
        <p className="mt-2 text-brand/80">User list and moderation. (TODO: protect + data)</p>
      </div>
    </div>
  );
}
