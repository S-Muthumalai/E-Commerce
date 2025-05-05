import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import ProductSearch from "@/components/products/product-search";
import { useState,useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product as BaseProduct } from "@shared/schema";

interface Product extends BaseProduct {
  isInWishlist?: boolean;
}
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useCart } from "@/hooks/cartContext";
// import { toDate } from "date-fns";
// import { is } from "drizzle-orm";
export default function CustomerPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const {refreshCart} = useCart();
  const [username, setUsername] = useState("");
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          window.location.href = "/auth";
          toast({
            title: "Authentication required",
            description: "Please log in to access this page.",
            variant: "destructive",
          });
          throw new Error("Failed to fetch username");
        }
        const data = await response.json();
        setUsername(data.username);
      } catch (error) {
        console.error("Error fetching username:", error);
        setUsername("Guest");
      }
    };

    fetchUsername();
  }, []);
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("POST", "/api/wishlist", { productId });
      return productId;
    },
    onSuccess: (productId: number) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      products.forEach((product) => {
        if (product.id === productId) {
          product.isInWishlist = !product.isInWishlist;
        }
      });
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

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter && categoryFilter !== "all" ? product.category === categoryFilter : true;

    return matchesSearch && matchesCategory;
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Failed to load products. Please try again later.</div>
      </div>
    );
  }
  

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden"> {/* Prevent outer scrolling */}
      <Navbar />
      <div className="flex flex-1 overflow-hidden"> {/* Prevent scrolling on the main layout */}
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-hidden" >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900" aria-label="Customer Dashboard">
              Welcome {username}!
            </h1>
          </div>
          <ProductSearch
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            stockFilter="all"
            onSearchChange={setSearchQuery}
            onCategoryChange={setCategoryFilter}
            onStockChange={(newStockFilter) => console.log("Stock filter changed:", newStockFilter)}
            onResetFilters={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              console.log("Filters reset");
            }}
          />
          {/* Scrollable product section */}
          <div
            className="overflow-y-auto mt-6"
            style={{
              maxHeight: "calc(100vh - 270px)", // Adjust height dynamically
              paddingBottom: "20px", // Add padding to prevent cutoff
            }}
          >
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <Link
                      className="block h-80"
                      to={`/product-detail/${product.id}`} // Redirect to product details page
                      key={product.id}
                    >
                      <img
                        src={product.imageUrl || "https://via.placeholder.com/150"}
                        alt={product.name}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                      />
                      <div className="p-4">
                        <h2 className="text-lg font-bold text-gray-800">{product.name}</h2>
                        <p className="text-sm text-gray-600 mt-1">{product.description || "No description available."}</p>
                      </div>
                    </Link>
                    <div className="mt-4 p-4 flex justify-between items-center pb-2">
                      <span className="text-primary font-bold">${product.price.toFixed(2)}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleAddToWishlist(product.id)}
                        className={
                          addToWishlistMutation.isPending && addToWishlistMutation.variables === product.id
                            ? "opacity-50"
                            : ""
                        }
                        disabled={addToWishlistMutation.isPending && addToWishlistMutation.variables === product.id}
                      >
                        {addToWishlistMutation.isPending && addToWishlistMutation.variables === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart
                            className={`h-4 w-4 ${
                              products.find((p) => p.id === product.id)?.isInWishlist
                                ? "text-red-500 fill-current"
                                : "text-red-500 "
                            }`}
                            onClick={() => {
                              const updatedProducts = products.map((p) =>
                                p.id === product.id ? { ...p, isInWishlist: !p.isInWishlist } : p
                              );
                              queryClient.setQueryData(["/api/products"], updatedProducts);
                            }}
                          />
                        )}
                      </Button>
                      <button
                        className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary/90"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/cart", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                productId: product.id,
                                quantity: 1,
                              }),
                            });
                            if (!response.ok) {
                              throw new Error("Failed to add product to cart");
                            }
                            refreshCart();
                            console.log(`Product added to cart: ${product.name}`);
                          } catch (error) {
                            console.error("Error adding product to cart:", error);
                          }
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-6">
                No products found. Try adjusting your search or filters.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}