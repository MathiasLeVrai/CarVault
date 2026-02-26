import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Onboarding from '../components/Onboarding';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <Onboarding />
      <Header />
      <div className="flex">
        <Sidebar />
        {/* Desktop: offset for sidebar, Mobile: full width + bottom padding for tab bar */}
        <main className="flex-1 md:ml-[240px] mt-14 md:mt-16 p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
