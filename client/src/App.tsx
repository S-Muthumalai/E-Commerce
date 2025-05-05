import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SettingsPage from "@/pages/settings-page";
import WishlistPage from "@/pages/wishlist-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import NotAuthorized from "@/pages/not-authorized";
import CustomerPage from "@/pages/customer-page";
import CartPage from "@/pages/cart-page";
import ProductDetails from "@/pages/product-details";
import MyOrders from "@/pages/my-order";
import "./App.css";
import OtpVerification from "./pages/otp-verfication";
import CheckoutPage from "@/pages/checkoutpage";
import { CartProvider } from "./hooks/cartContext";
import OrderDashboard from "./pages/order";
import AdminUserDashboard from "./pages/customer";
import AnalyticsPage from "./pages/analytics";
import MiddlemanPage from "./pages/middleman";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} requiredRole="admin" />
      <ProtectedRoute path="/orders" component={OrderDashboard} requiredRole="admin" />
      <ProtectedRoute path="/customers" component={AdminUserDashboard} requiredRole="admin" />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} requiredRole="admin" />
      <ProtectedRoute path="/middleman" component={MiddlemanPage} requiredRole="middleman" />
      <Route path="/customer" component={CustomerPage}/>
      <Route path="/settings" component={SettingsPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/product-detail/:productId" component={ProductDetails}/>
      <Route path="/auth" component={AuthPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/not-found" component={NotFound} />
      <Route path= "/cart" component={CartPage}/>
      <Route path="/myorder" component={MyOrders}/>
      <Route path="/otp-verify" component={OtpVerification} />
      <Route path="/not-authorized" component={NotAuthorized} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
        <Router />
        <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
