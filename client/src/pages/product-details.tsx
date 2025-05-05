import React, { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import axios from "axios";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock: number;
  isInWishlist?: boolean;
}

const ProductDetails: React.FC = () => {
  const [match, params] = useRoute("/product-detail/:productId");
  const productId = params?.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const numericProductId = Number(productId);

    if (!match || isNaN(numericProductId) || numericProductId <= 0) {
      setFetchError("Invalid product ID");
      setLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        const response = await axios.get(`/api/products/${numericProductId}`);
        if (!response.data) {
          throw new Error("Product not found");
        }
        setProduct(response.data);

        const similarResponse = await axios.get(
          `/api/products?category=${response.data.category}&exclude=${numericProductId}`
        );
        setSimilarProducts(similarResponse.data);
      } catch (err: any) {
        console.error("Error fetching product details:", err);
        setFetchError(err.response?.data?.message || "Failed to fetch product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, match]);

  const handleBuyNow = () => {
    if (product) {
      // Save product details to local storage
      localStorage.setItem("checkoutProduct", JSON.stringify(product));
      // Redirect to the checkout page
      window.location.href = "/checkout";
    }
  };

  // Calculate the delivery date (one week from today)
  const calculateDeliveryDate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7); // Add 7 days
    return deliveryDate.toLocaleDateString(); // Format the date
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{fetchError}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="product-details">
            <div className="product-info mb-6 flex items-center justify-center">
              <div className="w-120 h-96 flex flex-col justify-around items-center bg-gradient-to-r from-gray-200 to-gray-300 rounded-md overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl mb-4">
                <img
                  src={product.imageUrl || "https://via.placeholder.com/300"}
                  alt={product.name}
                  className="w-full h-3/4 object-cover rounded-t-md"
                />
                <div className="p-4 text-center justify-around">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <Badge
                    variant={product.stock > 0 ? "outline" : "destructive"}
                    className={`w-24 justify-center ${
                      product.stock > 0 ? "bg-green-600 text-white" : "bg-red-500"
                    }`}
                  >
                    {product.stock > 0 ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
              </div>
              <div className="w-3/5 h-96 rounded-lg flex flex-col justify-center p-20 relative">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-700 text-sm mb-4">{product.description}</p>
                <p className="text-lg font-semibold text-primary">Price: ${product.price.toFixed(2)}</p>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Estimated Delivery Date:</span> {calculateDeliveryDate()}
                </p>
                <div className="flex space-x-4 mt-6">
                  <button
                    className="px-6 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleBuyNow}
                    disabled={product.stock === 0}
                  >
                    Buy Now
                  </button>
                  <button
                    className="px-6 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                        toast({
                          title: "Added to Cart",
                          description: `${product.name} has been added to your cart.`,
                        });
                      } catch (error) {
                        console.error("Error adding product to cart:", error);
                        toast({
                          title: "Error",
                          description: "Failed to add product to cart.",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={product.stock === 0}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
            <div className="similar-products">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                {similarProducts.map((product1) => (
                  <div
                    key={product1.id}
                    className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={product1.imageUrl || "https://via.placeholder.com/150"}
                      alt={product1.name}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                    />
                    <div className="p-4">
                      <Link to={`/product-detail/${product1.id}`}>
                        <h2 className="text-lg font-bold text-gray-800">{product1.name}</h2>
                        <p className="text-sm text-gray-600 mt-1">{product1.description || "No description available."}</p>
                      </Link>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-primary font-bold">${product1.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductDetails;