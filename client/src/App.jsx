import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";

// Pages
import Storefront from "./pages/Storefront";
import ProductDetail from "./pages/ProductDetail";
import LandingPage from "./pages/LandingPage";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import MyOrders from "./pages/MyOrders";
import Login from "./pages/Login";
import AdminPortal from "./pages/admin/AdminPortal";

// Protected Route Guard for Staff Portal
const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role === "Customer")
    return <Navigate to="/login" replace />;
  return children;
};

// Protected Route Guard for Customer Order History
const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
            <Navbar />
            <CartDrawer />
            <main className="flex-1">
              <Routes>
                {/* Storefront & Products */}
                <Route path="/" element={<Storefront />} />
                <Route path="/product/:slug" element={<ProductDetail />} />

                {/* Campaign Landing Page (Module 1) */}
                <Route path="/lp/:slug" element={<LandingPage />} />

                {/* Checkout & Post-Order (Module 2 & 3) */}
                <Route path="/checkout" element={<Checkout />} />
                <Route
                  path="/order-confirmation/:orderId"
                  element={<OrderConfirmation />}
                />

                {/* Public Tracking & Post-Purchase (Module 5) */}
                <Route path="/track" element={<OrderTracking />} />

                {/* Customer Account & Order History (Module 2) */}
                <Route
                  path="/my-orders"
                  element={
                    <CustomerRoute>
                      <MyOrders />
                    </CustomerRoute>
                  }
                />

                {/* Auth Login */}
                <Route path="/login" element={<Login />} />

                {/* Staff / Operations / Admin Management Portal (Module 4 & 6) */}
                <Route
                  path="/admin"
                  element={
                    <StaffRoute>
                      <AdminPortal />
                    </StaffRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
