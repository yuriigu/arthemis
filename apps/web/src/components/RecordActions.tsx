"use client";

import { Button } from "@/components/ui/button";
import type { FormAction } from "@/lib/types";

export interface RecordActionsProps {
  updateFormId: string;
  deleteId: string | number;
  updateAction?: FormAction;
  deleteAction?: FormAction;
  saveLabel?: string;
  deleteLabel?: string;
}

export default function RecordActions({
  updateFormId,
  deleteId,
  updateAction,
  deleteAction,
  saveLabel = "Salvar",
  deleteLabel = "Excluir",
}: RecordActionsProps) {
  return (
    <div className="flex w-max min-w-36 items-center gap-2 whitespace-nowrap">
      <Button type="submit" form={updateFormId} size="sm" className="min-w-16" disabled={!updateAction}>
        {saveLabel}
      </Button>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={deleteId} />
        <Button type="submit" variant="destructive" size="sm" className="min-w-16" disabled={!deleteAction}>
          {deleteLabel}
        </Button>
      </form>
    </div>
  );
}
