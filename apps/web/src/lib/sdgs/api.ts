import { api } from "@/lib/api";

import type { Sdg } from "./types";

export function listSdgs(): Promise<Sdg[]> {
  return api.get<Sdg[]>("/sdgs");
}
