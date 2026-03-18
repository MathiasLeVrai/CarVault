import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import OnboardingTour from '../components/OnboardingTour';
import QuickActionSheet from '../components/QuickActionSheet';
import PushPrompt from '../components/PushPrompt';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `carvault_tour_done_${user.id}`;
    if (!localStorage.getItem(key)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowTour(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen min-h-dvh bg-bg relative selection:bg-accent/30 selection:text-white">
      {showTour && <OnboardingTour onDone={() => setShowTour(false)} />}

      <Header />
      <div className="flex relative z-10">
        <Sidebar onFabPress={() => setShowQuickAction(true)} />
        <main className="main-content-top flex-1 md:ml-[300px] p-5 md:p-8 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {showQuickAction && <QuickActionSheet onClose={() => setShowQuickAction(false)} />}
      <PushPrompt />
    </div>
  );
}
