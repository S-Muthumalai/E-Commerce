import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/navbar';
import Sidebar from '@/components/layout/sidebar';

interface Order {
  id: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate: string;
  trackingNumber: string;
}
const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders'); // Replace with your API endpoint
        const data = await response.json();
        console.log('API response:', data); // Debugging line
        if (data && Array.isArray(data)) {
          setOrders(data);
        } else {
          console.error('Unexpected API response format:', data);
          setOrders([]); // Fallback to an empty array
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
        // Debugging line
      }
    }; // Closing brace for fetchOrders function
    fetchOrders();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">No orders found.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-700">
                      Order ID: {order.id}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        order.status === 'Delivered'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  {/* Debugging line: console.log('Order details:', order) */}
                  <div className="text-sm text-gray-600 mb-2">
                    <p>
                      <span className="font-medium">Tracking Number:</span>{' '}
                      {order.trackingNumber}
                    </p>
                    <p>
                      <span className="font-medium">Order Date:</span>{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </p>
                    <p>
                      <span className="font-medium">Last Updated:</span>{' '}
                      {new Date(order.updatedAt).toLocaleDateString('en-GB')}
                    </p>
                    <p>
                      <span className="font-medium">Delivery Date:</span>{' '}
                      {new Date(order.deliveryDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Items:
                    </h3>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm text-gray-600"
                        >
                          <span>
                            {item.product.name} (x{item.quantity})
                          </span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-lg font-bold text-gray-800">
                      Total: ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default MyOrders;