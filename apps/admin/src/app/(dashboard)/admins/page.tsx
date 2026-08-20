import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import CreateAdminForm from "@/components/CreateAdminForm";
import SuspendAdminButton from "@/components/SuspendAdminButton";

export const metadata: Metadata = { title: "Administrators" };

export default async function AdminsPage() {
  const { session } = await requireAdmin();
  const admins = await db.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, orderBy: { createdAt: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Administrators</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface)]">
                  <td className="px-4 py-2">
                    <p className="font-medium text-slate-900">{a.fullName}</p>
                    <p className="text-xs text-slate-500">{a.email}</p>
                  </td>
                  <td className="px-4 py-2">{a.role}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    {session.user.role === "SUPER_ADMIN" && a.id !== session.user.id && a.status === "ACTIVE" && <SuspendAdminButton userId={a.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {session.user.role === "SUPER_ADMIN" ? (
          <CreateAdminForm />
        ) : (
          <p className="text-sm text-slate-500">Only a super admin can create new administrator accounts.</p>
        )}
      </div>
    </div>
  );
}
