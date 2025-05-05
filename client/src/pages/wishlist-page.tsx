import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Loader2, AlertTriangle, Heart, Trash, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

// Interface for wishlist items that include the full product details
interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  user:string;
}

export default function WishlistPage() {
  const { toast } = useToast();
  const [productToRemove, setProductToRemove] = useState<Product | null>(null);
  
  // Fetch user's wishlist
  const { data: wishlist = [], isLoading, error } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Product removed",
        description: "The product has been removed from your wishlist.",
      });
      setProductToRemove(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle removing an item from wishlist
  const handleRemoveFromWishlist = (productId: number) => {
    removeFromWishlistMutation.mutate(productId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Wishlist</h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] })}>
          Try Again
        </Button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Your Wishlist</h1>
            </div>
            <p className="text-gray-500">Products you're interested in and tracking for price drops</p>
          </div>

          {wishlist.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="flex justify-center mb-4">
                <Heart className="h-12 w-12 text-gray-300" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-4">Add products to your wishlist to track them and get notified of price drops.</p>
              <Button asChild>
                <a href="/">Browse Products</a>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wishlist.map((item) => (
                
                <Card key={item.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="object-cover w-full h-full transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {item.product.stock === 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                    {item.product.stock > 0 && item.product.stock <= 5 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">Low Stock</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{item.product.name}</CardTitle>
                    <CardDescription className="flex justify-between items-center">
                      <span className="text-gray-500">{item.product.category}</span>
                      <span className="font-semibold text-lg">${item.product.price.toFixed(2)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {item.product.description || "No description available"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button asChild variant="outline">
                    <Link
                     to={`/product-detail/${item.id}`} // Redirect to product details page
                     key={item.id}
                     >View Details</Link>
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash className="h-5 w-5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove from Wishlist</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{item.product.name}" from your wishlist?
                                  You won't receive price drop notifications for this product anymore.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemoveFromWishlist(item.product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {removeFromWishlistMutation.isPending && 
                                    removeFromWishlistMutation.variables === item.product.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove from wishlist</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}