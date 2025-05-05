import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { useLocation } from "wouter";
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};
const CheckoutPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useLocation();
  const storedProduct = localStorage.getItem("checkoutProduct");
  useEffect(() => {
    const fetchCartItems = async () => {
      if (storedProduct) {
        const parsedProduct = JSON.parse(storedProduct);
        setCartItems([
          {
            id: parsedProduct.id,
            name: parsedProduct.name,
            price: parsedProduct.price,
            quantity: 1,
          },
        ]);
        console.log("Stored product:", parsedProduct); // Debugging line
      } else {
        try {
          const response = await fetch("/api/cart");
          if (!response.ok) {
            throw new Error("Failed to fetch cart items");
          }
          const data = await response.json();
          console.log("Fetched cart items:", data); // Debugging line
          const transformedCartItems = data.map((item: any) => ({
            id: item.productId,
            name: item.product?.name || "Unknown Product",
            price: item.product?.price || 0,
            quantity: item.quantity,
          }));
          setCartItems(transformedCartItems);
        } catch (error) {
          console.error("Error fetching cart items:", error);
        }
      }
    };

    fetchCartItems();
  }, [storedProduct]);
  // Validate form inputs
  const validateForm = () => {
    const newErrors = { ...errors };

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Valid email is required";
    if (!formData.phone || !/^\+?[1-9]\d{1,14}$/.test(formData.phone))
      newErrors.phone = "Valid phone number is required";
    if (!formData.address) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  // Calculate total price
  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: formData.phone }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      const orderDetails = {
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: parseFloat(calculateTotal()),
        shippingAddress: formData.address,
        trackkingNumber: formData.phone,
      };
      // Store order details in sessionStorage
      sessionStorage.setItem("phone", formData.phone);
      sessionStorage.setItem("orderDetails", JSON.stringify(orderDetails));
      setCartItems([]);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
      // Navigate to OTP verification page
      setLocation("/otp-verify");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
            <div className="bg-gray-100 p-4 rounded-md shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-700 mb-2">
                  <span>
                    {item.name} (x{item.quantity})
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 mt-4">
                <span>Total:</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md text-white ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isSubmitting}
            >
            {isSubmitting ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CheckoutPage;