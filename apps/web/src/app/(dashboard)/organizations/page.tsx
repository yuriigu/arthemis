import type { Metadata } from "next";

import { OrganizationList } from "./organization-list";

export const metadata: Metadata = {
  title: "Organizações",
  description: "Gestão de organizações do Arthemis",
};

export default function OrganizationsPage() {
  return <OrganizationList />;
}
