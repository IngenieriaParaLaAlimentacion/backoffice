export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center h-screen bg-[#f8f9fb] relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#e0e7ff_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#ede9fe_0%,_transparent_50%)] pointer-events-none" />
      <div className="relative bg-white border border-gray-100 shadow-[0_4px_40px_rgba(0,0,0,0.08)] rounded-2xl px-6 py-10 sm:px-8 sm:py-16 flex flex-col gap-4 w-full max-w-[400px]">
        {children}
      </div>
    </div>
  );
}
