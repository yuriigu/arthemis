import { Suspense } from "react";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getAuthToken } from "@/lib/api/server";

async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  if (!(await getAuthToken())) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader className="min-h-16 shrink-0 px-4 sm:px-6 lg:px-8" />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
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
