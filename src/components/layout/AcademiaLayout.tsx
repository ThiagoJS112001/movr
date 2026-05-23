import { Outlet } from 'react-router-dom';
import AcademiaSidebar from './AcademiaSidebar';

export default function AcademiaLayout() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080B18] transition-colors">
      <AcademiaSidebar />
      <main className="md:ml-56 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
