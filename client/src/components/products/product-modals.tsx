import { useState } from "react";
import { Product, InsertProduct } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "./product-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "form" | "json"; 
  onTabChange: (tab: "form" | "json") => void;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const addProductMutation = useMutation({
    mutationFn: async (newProduct: InsertProduct) => {
      const res = await apiRequest("POST", "/api/products", newProduct);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertProduct) => {
    addProductMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new product
          </DialogDescription>
        </DialogHeader>
        
        <ProductForm
          onSubmit={handleSubmit}
          isSubmitting={addProductMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch price history
  const { data: priceHistory = [] } = useQuery({
    queryKey: [`/api/products/${product.id}/price-history`],
    enabled: isOpen,
  });
  
  const updateProductMutation = useMutation({
    mutationFn: async (updatedProduct: Partial<InsertProduct>) => {
      const res = await apiRequest("PUT", `/api/products/${product.id}`, updatedProduct);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}/price-history`] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertProduct) => {
    updateProductMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the details for {product.name}
          </DialogDescription>
        </DialogHeader>
        
        <ProductForm
          defaultValues={{
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl || "",
            category: product.category,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateProductMutation.isPending}
        />
        
        {priceHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Price History</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((entry, index) => {
                    const prevEntry = priceHistory[index + 1];
                    const change = prevEntry ? entry.price - prevEntry.price : 0;
                    
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>${entry.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {index === priceHistory.length - 1 ? (
                            <span className="text-gray-500">-</span>
                          ) : change > 0 ? (
                            <span className="text-red-500">+${change.toFixed(2)}</span>
                          ) : (
                            <span className="text-green-500">${change.toFixed(2)}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DeleteProductModal({ isOpen, onClose, product }: DeleteProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/products/${product.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteProductMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{product.name}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
