import { Outlet } from 'react-router-dom';
import AlunoSidebar from './AlunoSidebar';

export default function AlunoLayout() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080B18] transition-colors">
      <AlunoSidebar />
      {/* pb-16 reserves space for the mobile bottom nav (h-16) */}
      <main className="md:ml-[220px] pb-16 md:pb-0 min-h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
