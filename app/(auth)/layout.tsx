import BrandLockup from "@/components/BrandLockup";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center-safe gap-6 overflow-y-auto bg-background px-4 py-10">
      {/* A warm wash in the palette's own greens rather than a tinted grey:
          two very low-opacity radials, so the paper stays paper. */}
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(ellipse_at_top_left,_var(--accent)_0%,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_var(--warning-container)_0%,_transparent_45%)]" />
      <BrandLockup size="lg" className="relative" />
      {/* Narrow by default; a long form opts into a wider card on desktop by
          marking its root with `data-auth-wide`. */}
      <div className="relative flex w-full max-w-[400px] flex-col gap-4 rounded-2xl border border-border bg-card px-6 py-10 shadow-[0_4px_40px_rgb(38_37_31_/_0.06)] sm:px-8 sm:py-16 md:has-[[data-auth-wide]]:max-w-3xl md:has-[[data-auth-wide]]:py-12">
        {children}
      </div>
    </div>
  );
}
