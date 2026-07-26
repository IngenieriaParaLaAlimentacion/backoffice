"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentsAction } from "@/services/establishment.service";
import { EstablishmentResponse } from "@/types/admin";
import { ENCUESTAS_FORM } from "@/constants/surveys";

type EstablishmentPickerProps = {
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  readOnly?: boolean;
};

const PAGE_SIZE = 20;

export default function EstablishmentPicker({
  value,
  onChange,
  error,
  readOnly,
}: EstablishmentPickerProps) {
  const { makeAuthorizedRequest } = useAuth();
  const [items, setItems] = useState<EstablishmentResponse[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(
    async (currentSearch: string) => {
      setIsLoading(true);
      try {
        const data = await listEstablishmentsAction(makeAuthorizedRequest, {
          page: 1,
          page_size: PAGE_SIZE,
          search: currentSearch || undefined,
        });
        setItems(data.items);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchItems(search);
  }, [fetchItems, search]);

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={ENCUESTAS_FORM.establishmentsSearch}
        disabled={readOnly}
        className="max-w-sm"
      />

      <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No hay establecimientos
          </div>
        ) : (
          items.map((est) => (
            <label
              key={est.id}
              className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(est.id)}
                onChange={() => toggle(est.id)}
                disabled={readOnly}
                className="h-4 w-4 accent-primary"
              />
              <span className="font-medium">{est.name}</span>
              <span className="text-muted-foreground text-xs">
                {[est.province, est.city].filter(Boolean).join(", ")}
              </span>
            </label>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length} seleccionado(s)
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
