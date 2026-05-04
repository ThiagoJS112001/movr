import { Outlet } from 'react-router-dom';
import AlunoSidebar from './AlunoSidebar';

export default function AlunoLayout() {
  return (
    <div className="min-h-screen bg-[#0d0f14] transition-colors">
      <AlunoSidebar />
      {/* pb-16 reserves space for the mobile bottom nav (h-16) */}
      <main className="md:ml-[220px] pb-16 md:pb-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
