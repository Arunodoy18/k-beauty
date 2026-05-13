"use client";

import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-3 font-heading">Payments Paused</h1>
      <p className="text-gray-300 text-sm max-w-md mb-6">
        Payments are currently paused while we finalize the checkout experience.
        You can still view your routine and use affiliate links to purchase products.
      </p>
      <button
        onClick={() => router.push("/routine")}
        className="bg-[#D4AF37] text-[#0F172A] px-6 py-3 rounded-xl font-bold"
      >
        Go to My Routine
      </button>
    </div>
  );
}
