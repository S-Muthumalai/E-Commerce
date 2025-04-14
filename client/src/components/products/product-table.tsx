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
import { ArrowDownUp, Pencil, Trash, Eye, Loader2 } from "lucide-react";
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
  const renderStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive" className="w-24 justify-center">Out of Stock</Badge>;
    }
    if (stock <= 5) {
      return <Badge variant="warning" className="w-24 justify-center bg-amber-500">Low Stock</Badge>;
    }
    return <Badge variant="success" className="w-24 justify-center bg-green-600">In Stock</Badge>;
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
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-14 w-14 rounded object-cover"
                      />
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

        {!isLoading && products.length > 0 && (
          <div className="flex items-center justify-end p-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-white">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
