export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-indigo-500 to-[#9698ff]">
      <div className="bg-card border border-border shadow-[0_8px_24px_rgba(15,23,42,0.06)] rounded-xl px-8 py-16 flex flex-col gap-4 w-[400px]">
        {children}
      </div>
    </div>
  );
}
