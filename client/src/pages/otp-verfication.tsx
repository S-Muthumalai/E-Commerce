import { toast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";

const OtpVerifyPage: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useLocation();
  const [phone, setPhone] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Retrieve order details and phone number from sessionStorage
    console.log("Retrieving data from sessionStorage...");
    const storedPhone = sessionStorage.getItem("phone");
    const storedOrderDetails = sessionStorage.getItem("orderDetails");
    console.log("Stored Phone:", storedPhone);
    console.log("Stored Order Details:", storedOrderDetails);

    if (storedPhone && storedOrderDetails) {
      setPhone(storedPhone);
      setOrderDetails(JSON.parse(storedOrderDetails));
    } else {
      setLocation("/checkout"); // Redirect to checkout if data is missing
    }
  }, [setLocation]);

  if (!phone || !orderDetails) {
    return null; // Prevent rendering if data is missing
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
          otp,
          orderDetails,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Order placed successfully!");
        toast({
          title: "Order Placed Successfully",
          description: "Your order has been placed successfully.",
          variant: "default",
        });
        setTimeout(() => setLocation("/myorder"), 2000); // Redirect to success page
      } else {
        setMessage(data.message || "Failed to verify OTP.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">OTP Verification</h1>
        <p className="text-gray-600 mb-6">
          Enter the OTP sent to your phone number to confirm your order.
        </p>
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-md text-white ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        {message && (
          <p
            className={`text-center mt-4 ${
              message.includes("successfully") ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default OtpVerifyPage;