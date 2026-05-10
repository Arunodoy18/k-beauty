
"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { 
  ChevronLeft, CheckCircle2, Lock, Truck, CreditCard, 
  MapPin, ShoppingBag
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Temporary component to handle useSearchParams which requires a Suspense boundary
function CheckoutWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const total = parseInt(searchParams.get("total") || "2996");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [form, setForm] = useState({
    name: "Priya", // Pre-filled mock
    phone: "9876543210",
    address: "B-402, Sea View Apartments",
    city: "Mumbai",
    pincode: "400050",
    state: "Maharashtra",
    saveAddress: true
  });

  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        router.push("/home");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, router]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Create order on our backend
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });
      const orderData = await res.json();

      if (!orderData.orderId) {
        throw new Error("Missing orderId");
      }

      // 2. Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key",
        amount: orderData.amount,
        currency: "INR",
        name: "MY GLOW",
        description: "Your Personalized Skincare Kit",
        image: "https://your-logo-url.com/logo.png",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify Payment
          const verifyRes = await fetch("/api/verify-payment", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
               razorpay_order_id: response.razorpay_order_id,
               razorpay_payment_id: response.razorpay_payment_id,
               razorpay_signature: response.razorpay_signature
             })
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            setOrderId(response.razorpay_order_id);
            setPaymentSuccess(true);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: form.name,
          contact: form.phone,
        },
        theme: {
          color: "#D4AF37",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      alert("Something went wrong initiating the payment.");
    } finally {
      setLoading(false);
    }
  };

  const stepsHeader = [
    { title: "Delivery", icon: MapPin },
    { title: "Summary", icon: ShoppingBag },
    { title: "Payment", icon: CreditCard }
  ];

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-[#D4AF37]" />
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-3 italic" style={{ fontFamily: "Cormorant Garamond, serif" }}>
            Payment Successful!
          </h2>
          <p className="text-gray-300 text-lg mb-1">Your glow kit is on its way! ??</p>
          <p className="text-sm text-gray-500 mb-8 font-mono">Order ID: {orderId}</p>

          <div className="space-y-3 w-full max-w-sm mx-auto">
            <button className="w-full bg-[#111827] border border-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              <Truck className="w-5 h-5" /> Track my order
            </button>
            <p className="text-xs text-gray-500 mt-6">Redirecting to dashboard...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-32">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="max-w-md mx-auto pt-6">
        {/* HEADER */}
        <div className="px-6 flex items-center gap-3 mb-8">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="p-2 -ml-2 bg-gray-800/50 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>

        {/* STEP PROGRESS */}
        <div className="px-8 flex items-center justify-between mb-10 relative">
          <div className="absolute left-8 right-8 top-1/2 h-[2px] bg-gray-800 -z-10 -translate-y-1/2"></div>
          <div 
            className="absolute left-8 top-1/2 h-[2px] bg-[#D4AF37] -z-10 -translate-y-1/2 transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          {stepsHeader.map((s, idx) => {
            const isActive = step >= idx + 1;
            const Icon = s.icon;
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                  isActive ? "bg-[#D4AF37] text-black" : "bg-gray-800 text-gray-500"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? "text-[#D4AF37]" : "text-gray-500"}`}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* FORMS */}
        <div className="px-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                     <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                     <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none" />
                  </div>
                  <div className="col-span-2">
                     <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                     <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none" />
                  </div>
                  <div className="col-span-2">
                     <label className="text-xs text-gray-400 mb-1 block">Street Address</label>
                     <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none" />
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 mb-1 block">City</label>
                     <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none" />
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 mb-1 block">Pincode</label>
                     <input type="text" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-2">
                  <button 
                    onClick={() => setForm({...form, saveAddress: !form.saveAddress})} 
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${form.saveAddress ? "bg-[#D4AF37]" : "bg-gray-800"}`}
                  >
                    {form.saveAddress && <CheckCircle2 className="w-4 h-4 text-black" />}
                  </button>
                  <span className="text-sm">Save this address to my profile</span>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#D4AF37]"/> Ship To</h3>
                  <p className="text-sm text-gray-300">{form.name}</p>
                  <p className="text-sm text-gray-400">{form.address}, {form.city}, {form.pincode}</p>
                  <p className="text-sm text-gray-400">+91 {form.phone}</p>
                </div>

                <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-[#D4AF37]"/> Delivery Estimate</h3>
                  <p className="text-sm font-medium">Standard Delivery: <span className="text-green-400">Free</span></p>
                  <p className="text-xs text-gray-400 mt-1">Expected in 3-5 business days.</p>
                </div>

                <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Payable Total</span>
                    <span className="text-[#D4AF37]">?{total}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER CTA */}
      {!paymentSuccess && (
        <div className="fixed bottom-0 left-0 w-full bg-[#0F172A]/90 backdrop-blur-xl border-t border-gray-800 z-50 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-md mx-auto">
            {step === 1 && (
              <button onClick={() => setStep(2)} className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2" >
                Proceed to Review
              </button>
            )}
            {step === 2 && (
              <button 
                onClick={handlePayment} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              >
                {loading ? (
                  <span className="animate-pulse">Initializing Setup...</span>
                ) : (
                  <><Lock className="w-5 h-5" /> Pay ?{total} securely</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      
      <style dangerouslySetContent={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">Loading...</div>}>
      <CheckoutWizard />
    </Suspense>
  )
}

