import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopBar } from '@/components/dashboard/topbar';
import { DashboardClientWrapper } from '@/components/dashboard/dashboard-client-wrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  return (
    <DashboardClientWrapper>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        {/* Main content area - min-w-0 is critical for flex children to shrink properly */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 p-4 md:p-6">
            {/* Inner container to handle content overflow */}
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </DashboardClientWrapper>
  );
}
