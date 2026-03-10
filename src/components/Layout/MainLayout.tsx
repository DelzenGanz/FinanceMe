import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-60 overflow-y-auto">
        {/* Drag region for macOS traffic lights area */}
        <div className="h-8 app-drag-region" />

        {/* Page Content via React Router Outlet */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
