"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { History, LogOut, RefreshCw, UserRound } from "lucide-react";

import { useAppContext } from "@/components/app/app-context";
import { useSupabaseClient } from "@/components/supabase-provider";

type ReportSummary = {
  id: string;
  created_at: string;
  overall_glow_score: number | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { userId } = useAppContext();
  const supabase = useSupabaseClient();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [skinType, setSkinType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!userId) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("name, city, skin_type")
          .eq("id", userId)
          .maybeSingle();

        const { data: reportRows } = await supabase
          .from("skin_reports")
          .select("id, created_at, overall_glow_score")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!isMounted) return;

        setName(profile?.name || "");
        setCity(profile?.city || "");
        setSkinType(profile?.skin_type || "");
        setReports((reportRows || []) as ReportSummary[]);
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Unable to load profile.";
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  const saveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        name,
        city,
        skin_type: skinType,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setErrorMessage(error.message);
    }

    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const formattedReports = useMemo(() => {
    return reports.map((report) => ({
      ...report,
      date: new Date(report.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [reports]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans px-6 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#111827] border border-gray-800 flex items-center justify-center">
            <UserRound className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-gray-400">Update your details and review your scans.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {errorMessage}
          </div>
        )}

        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 mb-8">
          <div className="grid gap-4">
            <label className="text-sm text-gray-300">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full bg-[#0F172A] border border-gray-800 rounded-xl px-4 py-3 text-sm"
                placeholder="Your name"
              />
            </label>

            <label className="text-sm text-gray-300">
              City
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-2 w-full bg-[#0F172A] border border-gray-800 rounded-xl px-4 py-3 text-sm"
                placeholder="Your city"
              />
            </label>

            <label className="text-sm text-gray-300">
              Skin type
              <input
                value={skinType}
                onChange={(event) => setSkinType(event.target.value)}
                className="mt-2 w-full bg-[#0F172A] border border-gray-800 rounded-xl px-4 py-3 text-sm"
                placeholder="Combination, oily, etc."
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="w-full bg-[#D4AF37] text-[#0F172A] py-3 rounded-xl font-bold disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={() => router.push("/scan")}
              className="w-full border border-[#D4AF37]/40 text-[#D4AF37] py-3 rounded-xl font-semibold"
            >
              Retake skin scan
            </button>
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-lg font-semibold">Scan history</h2>
          </div>
          {isLoading && <p className="text-sm text-gray-500">Loading scans...</p>}
          {!isLoading && formattedReports.length === 0 && (
            <p className="text-sm text-gray-500">No scans yet.</p>
          )}
          <div className="space-y-3">
            {formattedReports.map((report) => (
              <button
                key={report.id}
                onClick={() => router.push(`/report?id=${report.id}`)}
                className="w-full text-left bg-[#0F172A] border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">Scan on {report.date}</p>
                  <p className="text-xs text-gray-500">Glow score: {report.overall_glow_score ?? "--"}</p>
                </div>
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-300 border border-gray-700 rounded-xl py-3"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
