import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import FeedbackQuest from "@/components/FeedbackQuest";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight, CreditCard, Truck } from "lucide-react";

const OrderConfirmation = () => {
  const location = useLocation();
  const { orderId, status } = location.state || {};

  const isCOD = status === "cod_pending";
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFeedback(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <section className="py-16 bg-gradient-to-br from-background via-primary/5 to-secondary/5 min-h-[60vh] flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold mb-4">
              {isCOD ? "Order Received!" : "Order Placed Successfully!"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isCOD
                ? "Thank you for your order. We've received your COD request and will contact you for verification."
                : "Thank you for your payment. We've received your order and will begin processing it soon."}
              {orderId && <><br /><span className="text-sm font-mono mt-2 block">Order ID: {orderId}</span></>}
            </p>

            <div className="glass p-6 rounded-2xl mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-primary" />
                <h3 className="font-semibold">What's Next?</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>{isCOD ? "COD verification call or email" : "Order confirmation email sent"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>We'll prepare your items for shipping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>{isCOD ? "Pay at the time of delivery" : "Tracking information once shipped"}</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="gradient-primary gap-2">
                <Link to="/services/it-hardware-sales">
                  Continue Shopping
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FeedbackQuest open={showFeedback} onOpenChange={setShowFeedback} />
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
