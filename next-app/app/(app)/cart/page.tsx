
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowRight, X, Minus, Plus, Tag, ShieldCheck, ChevronLeft, Package
} from "lucide-react";

// Mock Cart State
const INITIAL_CART = [
  {
    id: "c1",
    name: "Salicylic Acid Daily Gentle Cleanser",
    brand: "COSRX",
    price: 850,
    qty: 1,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "c2",
    name: "Dark Spot Correcting Glow Serum",
    brand: "Axis-Y",
    price: 1550,
    qty: 1,
    image: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "c3",
    name: "Birch Juice Moisturizing Sun Cream",
    brand: "Round Lab",
    price: 1600,
    qty: 1,
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=200&q=80"
  }
];

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState(INITIAL_CART);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const updateQty = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const isFreeShipping = subtotal >= 999;
  const shipping = isFreeShipping ? 0 : 50;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "GLOW10") {
      setDiscountAmount(subtotal * 0.1);
      setCouponApplied(true);
    } else {
      alert("Invalid coupon code. Try GLOW10!");
      setDiscountAmount(0);
      setCouponApplied(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
           <Package className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-8 text-center">It seems like you haven&apos;t added any products yet.</p>
        <button 
          onClick={() => router.push("/routine")}
          className="bg-[#D4AF37] text-black font-bold py-4 px-8 rounded-xl"
        >
          Build my Routine
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-32">
      <div className="max-w-md mx-auto pt-6">
        {/* HEADER */}
        <div className="px-6 flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 -ml-2 bg-gray-800/50 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Your Cart ({items.length})</h1>
        </div>

        {/* ITEMS LIST */}
        <div className="px-6 space-y-4 mb-8">
          <AnimatePresence>
            {items.map(item => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-4 p-3 bg-[#111827] border border-gray-800 rounded-2xl relative overflow-hidden"
              >
                <div className="w-20 h-20 bg-gray-800 rounded-xl overflow-hidden shrink-0 relative">
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold">{item.brand}</p>
                      <h3 className="font-medium text-sm leading-tight line-clamp-2 pr-6">{item.name}</h3>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="absolute top-3 right-3 text-gray-500 hover:text-rose-400 pb-2 pl-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-sm">?{item.price}</p>
                    
                    {/* QTY Stepper */}
                    <div className="flex items-center bg-[#1F2937] rounded-lg">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 px-2 text-gray-400 hover:text-white"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-bold w-6 text-center select-none">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 px-2 text-gray-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* COUPON SECTION */}
        <div className="px-6 mb-8">
          <div className="flex gap-2 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
               <Tag className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Apply coupon code (try GLOW10)" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 bg-[#111827] border border-gray-800 rounded-xl py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors uppercase"
            />
            <button 
              onClick={applyCoupon}
              disabled={!couponCode}
              className={`px-4 rounded-xl text-sm font-bold transition-colors ${
                couponCode ? "bg-[#1F2937] text-white hover:bg-gray-700" : "bg-gray-800/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              Apply
            </button>
          </div>
          {couponApplied && (
            <p className="text-green-400 text-xs mt-2 font-semibold">? GLOW10 applied successfully!</p>
          )}
        </div>

        {/* ORDER SUMMARY */}
        <div className="px-6 mb-8">
          <div className="bg-[#111827] rounded-3xl p-5 border border-gray-800">
            <h3 className="font-bold mb-4 border-b border-gray-800 pb-3">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>?{subtotal}</span>
              </div>
              
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span>{isFreeShipping ? <span className="text-green-400 font-medium">Free</span> : `?${shipping}`}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400 font-medium">
                  <span>Discount</span>
                  <span>-?{discountAmount}</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-gray-800 flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span className="text-[#D4AF37]">?{total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHECKOUT STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0F172A]/90 backdrop-blur-xl border-t border-gray-800 z-50 p-4 pb-safe">
        <div className="max-w-md mx-auto flex flex-col gap-2">
           <div className="flex justify-center text-xs text-gray-500 font-medium gap-1 mb-1">
             <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> Secure SSL Checkout
           </div>
          <button 
            onClick={() => router.push("/checkout?total=" + total)}
            className="w-full bg-[#D4AF37] text-black py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:opacity-90 transition-opacity"
          >
            Checkout ({items.length} items) <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}} />
    </div>
  );
}

