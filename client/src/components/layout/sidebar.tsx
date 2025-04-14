import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Tag,
  Bell,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          active ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:text-primary hover:bg-primary/5"
        )}
      >
        {icon}
        {label}
      </a>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  
  const items = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      href: "/"
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: "Products",
      href: "/products"
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: "Orders",
      href: "/orders"
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Customers",
      href: "/customers"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Analytics",
      href: "/analytics"
    },
    {
      icon: <Tag className="h-5 w-5" />,
      label: "Discounts",
      href: "/discounts"
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: "Notifications",
      href: "/notifications"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/settings"
    }
  ];
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r p-4 space-y-2">
      <div className="space-y-2">
        {items.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={location === item.href}
          />
        ))}
      </div>
    </aside>
  );
}
