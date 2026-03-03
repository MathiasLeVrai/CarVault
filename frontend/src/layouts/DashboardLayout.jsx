import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Onboarding from '../components/Onboarding';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg relative selection:bg-accent/30 selection:text-white">
      {/* Subtle grid */}
      <div className="fixed inset-0 cv-grid-bg pointer-events-none" />

      {/* Ambient aurora orbs */}
      <div
        className="fixed top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full pointer-events-none aurora-1"
        style={{ background: 'radial-gradient(circle at center, rgba(255,42,63,0.1) 0%, transparent 65%)', filter: 'blur(90px)' }}
      />
      <div
        className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none aurora-2"
        style={{ background: 'radial-gradient(circle at center, rgba(124,92,252,0.08) 0%, transparent 65%)', filter: 'blur(100px)' }}
      />
      <div
        className="fixed top-[30%] right-[-5%] w-[30%] h-[30%] rounded-full pointer-events-none aurora-3"
        style={{ background: 'radial-gradient(circle at center, rgba(56,189,248,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

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
