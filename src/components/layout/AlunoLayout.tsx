import { Outlet } from 'react-router-dom';
import AlunoSidebar from './AlunoSidebar';

export default function AlunoLayout() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
      <AlunoSidebar />
      <main className="md:ml-56 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
