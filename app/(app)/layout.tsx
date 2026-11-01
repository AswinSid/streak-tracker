import { Suspense } from "react";
import { BottomNav, NavBar } from "@/components/bottom-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="md:pl-60">
      <main className="mx-auto min-h-dvh max-w-md pb-[calc(7rem+env(safe-area-inset-bottom))] md:max-w-2xl md:pb-16 lg:max-w-3xl">
        {children}
      </main>
      <Suspense fallback={<NavBar pathname={null} />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
