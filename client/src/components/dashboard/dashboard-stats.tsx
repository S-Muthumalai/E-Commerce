import { Card, CardContent } from "@/components/ui/card";
import { Box, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-primary text-white border-none">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium opacity-90">Total Products</h3>
              <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
            </div>
            <Box className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-green-600 text-white border-none">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium opacity-90">In Stock</h3>
              <p className="text-3xl font-bold mt-1">{stats.inStock}</p>
            </div>
            <CheckCircle className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-amber-500 text-white border-none">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium opacity-90">Low Stock</h3>
              <p className="text-3xl font-bold mt-1">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-red-600 text-white border-none">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium opacity-90">Out of Stock</h3>
              <p className="text-3xl font-bold mt-1">{stats.outOfStock}</p>
            </div>
            <XCircle className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
