import type { Metadata } from "next";

import { ProponentsClient } from "./proponents-client";

export const metadata: Metadata = {
  title: "Proponentes",
  description: "Gestão de proponentes do Arthemis",
};

export default function ProponentsPage() {
  return <ProponentsClient />;
}
