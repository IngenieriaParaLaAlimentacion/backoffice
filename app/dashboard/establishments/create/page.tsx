"use client";

import RequirePermission from "@/components/RequirePermission";
import EstablishmentForm from "../EstablishmentForm";

export default function CreateEstablishmentPage() {
  return (
    <RequirePermission permission="establishments.create">
      <EstablishmentForm mode="create" />
    </RequirePermission>
  );
}
