import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { get } from "http";
import { set } from "date-fns";
import { useLocation } from "wouter";

type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  product: Product;
};

export default function CartPage() {
  const [username, setUsername] = useState("");
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();;
  // Fetch username
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          throw new Error("Failed to fetch username");
        }
        const data = await response.json();
        setUsername(data.username || "Guest");
      } catch (error) {
        console.error("Error fetching username:", error);
        setUsername("Guest");
      }
    };

    fetchUsername();
  }, []);

  // Fetch cart items
  const { data: cartItems = [], isLoading, error } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      const response = await fetch("/api/cart");
      if (!response.ok) {
        throw new Error("Failed to fetch cart items");
      }
      return response.json();
    },
  });
  // Mutation to remove an item from the cart
  const removeItemMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove item from cart");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/cart"]);
    },
  });

  const removeallItemMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/cart`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove item from cart");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/cart"]);
      toast({
        title: "Success",
        description: "All items removed from cart.",
        variant: "default",
        duration: 2000,
      });
    },
  });
  // Mutation to update the quantity of an item in the cart
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        throw new Error("Failed to update item quantity");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/cart"]);
    },
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader">Loading...</div>
      </div>
    );
  }
  // Disable "Proceed to Checkout" button if cart is empty
  const isCheckoutDisabled = cartItems.length === 0;
  console.log("isCheckoutDisabled", cartItems.length);
  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Failed to load cart items. Please try again later.</div>
      </div>
    );
  }

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {;
    localStorage.removeItem("checkoutProduct");
    setLocation("/checkout");
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900" aria-label="Cart Page">
              Welcome, {username}! Here is your cart.
            </h1>
          </div>
          {cartItems.length > 0 && (<div className="mt-6 flex justify-start gap-4">
                <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={handleProceedToCheckout}
                // disabled={isCheckoutDisabled}
                >
                Proceed to Checkout
                </button>
              <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              onClick={() => removeallItemMutation.mutate()}
              // disabled={cartItems.length === 0}
              >
              Clear Cart
              </button>
            </div>)}
          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img
                    src={item.product.imageUrl || "https://via.placeholder.com/150"}
                    alt={item.product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h2 className="text-lg font-bold text-gray-800">{item.product.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{item.product.description || "No description available."}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-primary font-bold">${item.product.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <button
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                        onClick={() => removeItemMutation.mutate(item.id)}
                      >
                        Remove
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 bg-gray-200 text-sm rounded-md hover:bg-gray-300"
                          onClick={() =>
                            updateQuantityMutation.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                          }
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <button
                          className="px-2 py-1 bg-gray-200 text-sm rounded-md hover:bg-gray-300"
                          onClick={() =>
                            updateQuantityMutation.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-6">
              Your cart is empty. Start adding some products!
            </div>
            
          )}
        </main>
      </div>
    </div>
  );
}