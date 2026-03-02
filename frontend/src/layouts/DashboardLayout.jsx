import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Onboarding from '../components/Onboarding';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg relative selection:bg-accent/30 selection:text-white">
      {/* Subtle ambient glows */}
      <div className="fixed top-[-15%] left-[-15%] w-[45%] h-[45%] bg-accent/3 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-15%] w-[35%] h-[35%] bg-violet/3 rounded-full blur-[140px] pointer-events-none" />

      <Onboarding />
      <Header />
      <div className="flex relative z-10">
        <Sidebar />
        <main className="flex-1 md:ml-[300px] mt-16 md:mt-24 p-5 md:p-8 pb-32 md:pb-12 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
