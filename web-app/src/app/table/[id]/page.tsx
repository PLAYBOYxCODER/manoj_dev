"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { CheckCircle } from "lucide-react";

export default function TableSetupPage() {
    const router = useRouter();
    const params = useParams();
    const { setTableNumber } = useAppContext();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (params.id) {
            setTableNumber(params.id as string);

            // Simulate validation / redirect delay
            setTimeout(() => {
                setRedirecting(true);
                setTimeout(() => {
                    router.push("/menu");
                }, 1500);
            }, 1000);
        }
    }, [params.id, router, setTableNumber]);

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6 text-center">
            <div className="glass-panel p-10 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl flex flex-col items-center">
                {!redirecting ? (
                    <>
                        <div className="w-16 h-16 border-4 border-[#8B0000] border-t-transparent animate-spin rounded-full mb-6"></div>
                        <h1 className="text-2xl font-bold text-white mb-2">Assigning Table {params.id}...</h1>
                        <p className="text-white/50 text-sm">Please wait while we set up your ordering session.</p>
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-16 h-16 text-[#D4AF37] mb-6" />
                        <h1 className="text-2xl font-bold text-white mb-2">Table {params.id} Confirmed!</h1>
                        <p className="text-white/50 text-sm">Redirecting to menu...</p>
                    </>
                )}
            </div>
        </div>
    );
}
