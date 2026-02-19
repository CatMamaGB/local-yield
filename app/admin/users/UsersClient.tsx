"use client";

/**
 * Admin users list client component.
 */

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isProducer: boolean;
  isBuyer: boolean;
  isCaregiver: boolean;
  isHomesteadOwner: boolean;
  createdAt: string;
}

export function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, capabilityFilter]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (roleFilter) params.append("role", roleFilter);
      if (capabilityFilter) params.append("capability", capabilityFilter);
      params.append("limit", "100");

      const data = await apiGet<{ users: User[] }>(`/api/admin/users?${params.toString()}`);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }

  function getRoles(user: User): string[] {
    const roles: string[] = [];
    if (user.isProducer) roles.push("Producer");
    if (user.isBuyer) roles.push("Buyer");
    if (user.isCaregiver) roles.push("Caregiver");
    if (user.isHomesteadOwner) roles.push("Care Seeker");
    if (user.role === "ADMIN") roles.push("Admin");
    return roles.length > 0 ? roles : [user.role];
  }

  if (loading) {
    return <LoadingSkeleton rows={10} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="flex-1 min-w-[200px] rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          <option value="">All roles</option>
          <option value="BUYER">Buyer</option>
          <option value="PRODUCER">Producer</option>
          <option value="CAREGIVER">Caregiver</option>
          <option value="CARE_SEEKER">Care Seeker</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={capabilityFilter}
          onChange={(e) => setCapabilityFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          <option value="">All capabilities</option>
          <option value="canSell">Can Sell</option>
          <option value="canBuy">Can Buy</option>
          <option value="canCare">Can Care</option>
          <option value="canPostCareJob">Can Post Care Job</option>
        </select>
      </div>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {users.length === 0 ? (
        <p className="text-brand/80">No users found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand/10 bg-brand-light/40">
                <th className="py-3 pl-4 text-left font-display font-semibold text-brand">Email</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Name</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Roles</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-brand/10">
                  <td className="py-3 pl-4">
                    <div className="text-sm font-medium text-brand">{user.email}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand">{user.name || "—"}</div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {getRoles(user).map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-brand-light text-brand"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand/80">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
