import BottomNav from '@/components/BottomNav';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-[600px] md:max-w-none bg-black relative overflow-x-hidden w-full">
      {/* Radial gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial opacity-50" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tr from-pink-500/10 to-transparent opacity-30" />
      </div>
      
      <div className="relative z-10 page-enter">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

