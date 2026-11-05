import { Suspense } from "react";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/ui/sidebar";
import { getAuthToken } from "@/lib/api/server";

async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  if (!(await getAuthToken())) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" aria-label="Carregando" />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
