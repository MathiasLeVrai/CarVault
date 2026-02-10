import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Top Header */}
      <Header />
      <div className="flex">
        {/* Left Nav */}
        <Sidebar />
        {/* Content */}
        <main className="flex-1 ml-[240px] mt-[64px] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
