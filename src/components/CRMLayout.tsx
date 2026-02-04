import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: '/crm', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/crm/contacts', label: 'Contacts', icon: Users },
  { path: '/crm/deals', label: 'Deals', icon: Briefcase },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* CRM Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/crm' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#9b87f5] text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Page Content */}
      {children}
    </div>
  );
}
