import { Product } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownUp, Pencil, Trash, Eye, Loader2, Heart, Package } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  sortConfig: { field: string; direction: "asc" | "desc" } | null;
  onSort: (field: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductTable({
  products,
  isLoading,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Mutation to add product to wishlist
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("POST", "/api/wishlist", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to wishlist",
        description: "The product has been added to your wishlist.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding to wishlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToWishlist = (productId: number) => {
    if (user) {
      addToWishlistMutation.mutate(productId);
    } else {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your wishlist",
        variant: "destructive",
      });
    }
  };

  const renderStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive" className="w-24 justify-center">Out of Stock</Badge>;
    }
    if (stock <= 5) {
      return <Badge variant="secondary" className="w-24 justify-center bg-amber-500">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="w-24 justify-center bg-green-600 text-white">In Stock</Badge>;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => onSort("id")}
                >
                  <div className="flex items-center">
                    ID
                    <ArrowDownUp className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => onSort("name")}
                >
                  <div className="flex items-center">
                    Name
                    <ArrowDownUp className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => onSort("category")}
                >
                  <div className="flex items-center">
                    Category
                    <ArrowDownUp className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => onSort("price")}
                >
                  <div className="flex items-center">
                    Price
                    <ArrowDownUp className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => onSort("stock")}
                >
                  <div className="flex items-center">
                    Stock
                    <ArrowDownUp className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading products...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">#{product.id}</TableCell>
                    <TableCell>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-14 w-14 rounded object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      {renderStockBadge(product.stock)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onDelete(product)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
