import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  UserCog,
  Settings,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/cartContext";
import { useEffect, useState } from "react";
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
  const { cartCount } = useCart();
  const { user } = useAuth() as { user: { id: number; username: string; password: string; email: string | null; isAdmin: boolean } };
  const isAdmin = user?.isAdmin === true;
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch("/api/cart");
        if (!response.ok) {
          throw new Error("Failed to fetch cart items");
        }
        const data = await response.json();
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    };
    fetchCartItems();
  }, []);
  const adminItems = [
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
      icon: <UserCog className="h-5 w-5" />,
      label: "Middleman",
      href: "/middleman"
    }
  ];
  const userItems = [
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: `Cart (${cartCount})`, 
      href: "/cart"
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: "My Orders",
      href: "/myorder"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      label: "Wishlist",
      href: "/wishlist"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/settings"
    }
  ];
  const commonItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      href: "/customer"
    }
  ];
  const items = [...commonItems, ...(isAdmin ? adminItems : userItems)];
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