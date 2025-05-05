import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Store, User, Settings, LogOut } from "lucide-react";
export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    window.location.href = "/auth";
  };
  
  return (
    <nav className="bg-primary text-white py-2 px-4 flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-2">
        <Store className="h-6 w-6" />
        <span className="text-xl font-bold">E-Shop</span>
      </div>
      
      {/* <div className="hidden md:flex items-center space-x-6">
        <a href="#" className="text-white hover:text-white/80">Dashboard</a>
        <a href="#" className="text-white/70 hover:text-white">Products</a>
        <a href="#" className="text-white/70 hover:text-white">Orders</a>
        <a href="#" className="text-white/70 hover:text-white">Customers</a>
      </div> */}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="hover:bg-primary-foreground/10">
            <User className="h-5 w-5 mr-2" />
            <span>{user?.username || 'User'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="h-4 w-4 mr-2" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
