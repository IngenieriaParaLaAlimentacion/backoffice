"use client";

import { useEffect, useRef, useState } from "react";
import { geoLocationProvider, PlaceDetails } from "@/lib/geo";

type AddressAutocompleteProps = {
  label?: string;
  required?: boolean;
  error?: string;
  onSelect: (place: PlaceDetails) => void;
  onInvalidate: () => void;
};

export default function AddressAutocomplete({
  label,
  required,
  error,
  onSelect,
  onInvalidate,
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [providerError, setProviderError] = useState<string | null>(null);

  const onSelectRef = useRef(onSelect);
  const onInvalidateRef = useRef(onInvalidate);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onInvalidateRef.current = onInvalidate;
  }, [onSelect, onInvalidate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = geoLocationProvider.mount(container, {
      onSelect: (place) => {
        setProviderError(null);
        onSelectRef.current(place);
      },
      onInputChange: () => {
        setProviderError(null);
        onInvalidateRef.current();
      },
      onError: (err) => {
        setProviderError(err.message);
      },
    });

    return cleanup;
  }, []);

  useEffect(() => {
    const input = containerRef.current?.querySelector("input");
    input?.setAttribute(
      "aria-invalid",
      String(Boolean(error || providerError)),
    );
  }, [error, providerError]);

  const displayedError = providerError ?? error;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <div ref={containerRef} />
      {displayedError && (
        <p className="text-xs text-destructive">{displayedError}</p>
      )}
    </div>
  );
}
