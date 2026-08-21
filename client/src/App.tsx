import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { scrollToPageTop } from "./lib/navigation";
import { NOTIFICATION_SETTINGS } from "./lib/notificationSettings";
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Producto from "./pages/Producto";
import Checkout from "./pages/Checkout";
import WompiPaymentInstructions from "./pages/WompiPaymentInstructions";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";

import OrderDetail from "./pages/OrderDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminHero from "./pages/admin/AdminHero";
import CartDrawer from "./components/CartDrawer";
import WelcomePopup from "./components/WelcomePopup";
import AdminPopup from "./pages/admin/AdminPopup";
import AdminPromoCarousel from "./pages/admin/AdminPromoCarousel";
import AdminDeliveryPhotos from "./pages/admin/AdminDeliveryPhotos";

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/productos" component={AdminProducts} />
        <Route path="/admin/categorias" component={AdminCategories} />
        <Route path="/admin/pedidos/:id" component={AdminOrderDetail} />
        <Route path="/admin/pedidos" component={AdminOrders} />
        <Route path="/admin/hero" component={AdminHero} />
        <Route path="/admin/promociones" component={AdminPromoCarousel} />
        <Route path="/admin/popup" component={AdminPopup} />
        <Route path="/admin/entregas" component={AdminDeliveryPhotos} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalogo" component={Catalogo} />
      <Route path="/catalogo/:categoria" component={Catalogo} />
      <Route path="/producto/:slug" component={Producto} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/pago/wompi/:orderId" component={WompiPaymentInstructions} />
      <Route path="/pedido-confirmado/:orderId" component={OrderConfirmation} />
      <Route path="/rastrear-pedido" component={TrackOrder} />

      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/pedidos/:id" component={AdminRoutes} />
      <Route path="/admin/:rest*" component={AdminRoutes} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    scrollToPageTop();
  }, [location]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <CartProvider>
            <Toaster
              {...NOTIFICATION_SETTINGS}
              toastOptions={{
                classNames: {
                  toast: "!border-[#C9A84C]/60 !bg-white !text-gray-900 !shadow-xl",
                  title: "!font-bold !text-gray-950",
                  description: "!text-gray-600",
                  success: "!border-[#0D3B2E]/30",
                  closeButton: "!border-gray-200 !bg-white !text-gray-600 hover:!bg-gray-100",
                },
              }}
            />
            <CartDrawer />
            <WelcomePopup />
            <ScrollToTop />
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
