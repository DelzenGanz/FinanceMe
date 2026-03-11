import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/',              icon: <LayoutDashboard size={20} />,  label: 'Dashboard' },
  { to: '/transactions',  icon: <ArrowLeftRight size={20} />,   label: 'Transactions' },
  { to: '/budget',        icon: <Wallet size={20} />,           label: 'Budget' },
  { to: '/savings',       icon: <PiggyBank size={20} />,        label: 'Savings' },
  { to: '/investment',    icon: <TrendingUp size={20} />,       label: 'Investment' },
  { to: '/reports',       icon: <BarChart3 size={20} />,        label: 'Reports' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
  }`;

const Sidebar = () => {
  return (
    <aside className="w-60 h-screen bg-slate-900 border-r border-slate-700 flex flex-col fixed left-0 top-0 select-none">
      {/* Drag region for macOS traffic lights */}
      <div className="h-8 app-drag-region" />

      {/* Logo */}
      <div className="px-6 py-6">
        <h1 className="text-2xl tracking-tighter font-extrabold flex items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
            Finance
          </span>
          <span className="text-slate-100 ml-0.5">Me</span>
        </h1>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-700" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* AI Advisor — special item */}
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <NavLink to="/ai-advisor" className={navLinkClass}>
            <Sparkles size={20} />
            AI Advisor
          </NavLink>
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-700" />

      {/* Settings link at bottom */}
      <div className="px-3 py-4">
        <NavLink to="/settings" className={navLinkClass}>
          <Settings size={20} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
