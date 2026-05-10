
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Droplets, Sun
} from "lucide-react";

// Mock Data
const MOCK_ROUTINE = {
  skinType: "Oily · Acne-prone · Pigmentation",
  city: "Mumbai",
  routine: [
    {
      id: "r1",
      stepNumber: 1,
      stepName: "Double Cleanse",
      timing: "Morning & Night",
      why: "Essential to remove Mumbai pollution and excess sebum without stripping the barrier.",
      product: {
        brand: "COSRX",
        name: "Salicylic Acid Daily Gentle Cleanser",
        price: 850,
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80",
        ingredients: ["Salicylic Acid 0.5%", "Tea Tree Oil"],
        whyForYou: "Unclogs pores for oily skin",
      }
    },
    {
      id: "r2",
      stepNumber: 2,
      stepName: "Toner / Essence",
      timing: "Morning & Night",
      why: "Preps the skin and restores pH balance after cleansing.",
      product: {
        brand: "Beauty of Joseon",
        name: "AHA BHA Vitamin C Daily Toner",
        price: 1200,
        image: "https://images.unsplash.com/photo-1608248593842-8021b1990c0a?auto=format&fit=crop&w=200&q=80",
        ingredients: ["AHA", "BHA", "Vitamin C"],
        whyForYou: "Gently exfoliates & brightens",
      }
    },
    {
      id: "r3",
      stepNumber: 3,
      stepName: "Treatment Serum",
      timing: "Night time",
      why: "Targets acne and pigmentation directly.",
      product: {
        brand: "Axis-Y",
        name: "Dark Spot Correcting Glow Serum",
        price: 1550,
        image: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=200&q=80",
        ingredients: ["Niacinamide 5%", "Squalane"],
        whyForYou: "Fades dark spots effectively",
      }
    },
    {
      id: "r4",
      stepNumber: 4,
      stepName: "Moisturizer",
      timing: "Morning & Night",
      why: "Lightweight hydration specifically chosen for humid climates.",
      product: {
        brand: "Isntree",
        name: "Hyaluronic Acid Aqua Gel Cream",
        price: 1350,
        image: "https://images.unsplash.com/photo-1615397323145-2070e633d7b8?auto=format&fit=crop&w=200&q=80",
        ingredients: ["5 Types HA", "Centella"],
        whyForYou: "Gel texture won't clog pores",
      }
    },
    {
      id: "r5",
      stepNumber: 5,
      stepName: "Sun Protection",
      timing: "Morning routines only",
      why: "Crucial defense against UV rays which worsen pigmentation.",
      product: {
        brand: "Round Lab",
        name: "Birch Juice Moisturizing Sun Cream",
        price: 1600,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=200&q=80",
        ingredients: ["SPF50+ PA++++", "Birch Sap"],
        whyForYou: "No white cast, soothing",
      }
    }
  ],
  addons: [
    {
      id: "a1",
      name: "Mugwork Sheet Mask Pack (5x)",
      brand: "I'm From",
      price: 850,
      image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=200&q=80",
      type: "Soothing"
    },
    {
      id: "a2",
      name: "Pimple Master Patch",
      brand: "COSRX",
      price: 350,
      image: "https://images.unsplash.com/photo-1611078519183-fbd9a7e6b815?auto=format&fit=crop&w=200&q=80",
      type: "Spot Treatment"
    },
    {
      id: "a3",
      name: "Matte Sun Stick",
      brand: "Beauty of Joseon",
      price: 1450,
      image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=200&q=80",
      type: "Reapplication"
    }
  ]
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function RoutinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [routineData, setRoutineData] = useState(MOCK_ROUTINE);

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setLoading(false);
      // Select all routine items by default
      setSelectedItems(MOCK_ROUTINE.routine.map(r => r.id));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    let total = 0;
    // Add routine items
    routineData.routine.forEach(r => {
      if (selectedItems.includes(r.id)) total += r.product.price;
    });
    // Add addon items
    routineData.addons.forEach(a => {
      if (selectedItems.includes(a.id)) total += a.price;
    });
    return total;
  };

  const totalItems = selectedItems.length;
  const totalPrice = calculateTotal();
  // Mock savings logic
  const discount = totalItems >= 4 ? 400 : 0;
  const finalPrice = totalPrice - discount;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white p-6 pb-32">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-800 rounded w-3/4 mx-auto mt-12"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
          <div className="h-6 bg-gray-800 rounded-full w-2/3 mx-auto"></div>
          
          <div className="space-y-6 mt-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-800 rounded-2xl w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-32">
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="max-w-md mx-auto pt-10"
      >
        {/* HEADER */}
        <motion.div variants={itemVariants} className="px-6 text-center mb-8">
          <h1 
            className="text-4xl text-[#D4AF37] italic mb-3 leading-tight"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Your K-Beauty Routine
          </h1>
          <p className="text-gray-300 text-sm mb-4">
            {routineData.routine.length} steps. Matched to your skin + {routineData.city} climate.
          </p>
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-4 py-2 rounded-full text-xs font-semibold tracking-wide">
            {routineData.skinType}
          </div>
        </motion.div>

        {/* ROUTINE STEPS */}
        <div className="px-5 space-y-6 mb-12">
          {routineData.routine.map((step) => {
            const isSelected = selectedItems.includes(step.id);
            
            return (
              <motion.div 
                variants={itemVariants} 
                key={step.id} 
                className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden relative shadow-lg"
              >
                {/* Step Header */}
                <div className="bg-[#1F2937]/50 p-4 border-b border-gray-800 flex justify-between items-start">
                  <div>
                    <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider block mb-1">
                      Step {step.stepNumber} &middot; {step.timing}
                    </span>
                    <h2 className="text-lg font-bold">{step.stepName}</h2>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                      {step.why}
                    </p>
                  </div>
                </div>

                {/* Product Area */}
                <div className="p-4 flex gap-4">
                  <div className="w-24 h-24 shrink-0 rounded-2xl bg-gray-800 overflow-hidden relative border border-gray-700">
                    <img 
                      src={step.product.image} 
                      alt={step.product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-0.5">{step.product.brand}</p>
                      <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">{step.product.name}</h3>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {step.product.ingredients.map(ing => (
                          <span key={ing} className="bg-gray-800 text-[10px] px-2 py-0.5 rounded text-gray-300">
                            {ing}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-[11px] text-[#D4AF37] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> {step.product.whyForYou}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                      <span className="font-bold">?{step.product.price}</span>
                      <button 
                        onClick={() => toggleItem(step.id)}
                        className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                          isSelected 
                            ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30" 
                            : "bg-white text-black"
                        }`}
                      >
                        {isSelected ? "Added" : "Add to Kit"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* UPSELL SECTION */}
        <motion.div variants={itemVariants} className="mb-10 w-full overflow-hidden">
          <div className="px-6 mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold">Add-ons for your concerns</h2>
          </div>
          
          <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x hide-scrollbar">
            {routineData.addons.map(addon => {
              const isSelected = selectedItems.includes(addon.id);
              
              return (
                <div 
                  key={addon.id}
                  className="snap-start shrink-0 w-40 bg-[#111827] border border-gray-800 rounded-2xl p-3 flex flex-col relative"
                >
                   <div className="h-32 w-full rounded-xl bg-gray-800 mb-3 overflow-hidden relative">
                     <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                     <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[9px] px-2 py-0.5 rounded-full text-white font-medium uppercase tracking-wide">
                        {addon.type}
                     </div>
                   </div>
                   <p className="text-[10px] text-gray-400 font-semibold truncate">{addon.brand}</p>
                   <h3 className="font-medium text-xs mb-2 line-clamp-2 leading-tight flex-1">{addon.name}</h3>
                   <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-sm">?{addon.price}</span>
                      <button 
                        onClick={() => toggleItem(addon.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          isSelected ? "bg-[#D4AF37] text-black" : "bg-gray-800 text-white"
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-lg leading-none mb-1">+</span>}
                      </button>
                   </div>
                </div>
              );
            })}
          </div>
        </motion.div>
        
        {/* TRUST BADGES */}
        <motion.div variants={itemVariants} className="px-6 mb-8 flex justify-center gap-6 text-xs text-gray-400 font-medium">
           <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Authentic</div>
           <div className="flex items-center gap-1.5"><Sun className="w-4 h-4 text-[#D4AF37]" /> Dermatologist vetted</div>
        </motion.div>

      </motion.div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0F172A]/90 backdrop-blur-xl border-t border-gray-800 z-50 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-gray-400 text-sm mb-0.5">Your Kit: {totalItems} items</p>
              <p className="text-2xl font-bold">?{finalPrice}</p>
            </div>
            {discount > 0 && (
              <div className="text-right">
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold block mb-1">
                  Save ?{discount}
                </span>
                <span className="line-through text-gray-500 text-sm">?{totalPrice}</span>
              </div>
            )}
          </div>
          
          <button 
            disabled={totalItems === 0}
            onClick={() => router.push("/checkout")}
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(244,63,94,0.3)]"
          >
            Proceed to Checkout <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style dangerouslySetContent={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
      `}} />
    </div>
  );
}

