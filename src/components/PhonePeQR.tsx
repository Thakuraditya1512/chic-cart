import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, CheckCircle2, XCircle, Clock, ShieldCheck, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PhonePeQRProps {
  amount: number;
  transactionId: string;
  userId: string;
  mobileNumber?: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

export default function PhonePeQR({ amount, transactionId, userId, mobileNumber, onSuccess, onCancel, isDarkMode = true }: PhonePeQRProps) {
  const [qrString, setQrString] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"PENDING" | "COMPLETED" | "FAILED" | "EXPIRED">("PENDING");
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  useEffect(() => {
    generateQR();
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === "PENDING" && qrString) {
      const poll = setInterval(checkStatus, 5000);
      return () => clearInterval(poll);
    }
  }, [status, qrString]);

  const generateQR = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/phonepe/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, transactionId, userId, mobileNumber }),
      });

      const data = await resp.json();
      if (data.success && data.qrString) {
        setQrString(data.qrString);
      } else {
        throw new Error(data.error || "Failed to generate QR");
      }
    } catch (err: any) {
      toast.error(err.message);
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const resp = await fetch(`/api/phonepe/status/${transactionId}`);
      const data = await resp.json();

      if (data.status === "COMPLETED") {
        setStatus("COMPLETED");
        toast.success("Payment successful!");
        setTimeout(() => onSuccess(data), 2000);
      } else if (data.status === "FAILED") {
        setStatus("FAILED");
        toast.error("Payment failed");
      }
    } catch (err) {
      console.error("Status check failed", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`p-6 sm:p-8 rounded-3xl border ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"} shadow-2xl max-w-md w-full mx-auto`}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 p-3 bg-purple-500/10 rounded-2xl">
          <ShieldCheck className="w-8 h-8 text-purple-500" />
        </div>
        
        <h3 className={`text-xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-black"}`}>Dynamic QR Payment</h3>
        <p className={`text-2xl font-black mb-1 ${isDarkMode ? "text-white" : "text-black"}`}>₹{amount.toLocaleString('en-IN')}</p>
        <p className={`text-sm mb-6 ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>Scan the QR code below using any UPI app</p>

        <div className={`relative p-4 rounded-2xl ${isDarkMode ? "bg-white" : "bg-gray-50"} mb-6`}>
          {loading ? (
            <div className="w-[200px] h-[200px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : qrString ? (
            <div className="relative group">
              <QRCodeSVG value={qrString} size={200} level="H" includeMargin={false} />
              <div className="absolute inset-0 border-4 border-purple-500/20 rounded-lg pointer-events-none" />
              
              <AnimatePresence>
                {status === "COMPLETED" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-2" />
                    <p className="text-emerald-600 font-bold">Success!</p>
                  </motion.div>
                )}
                {status === "FAILED" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                    <XCircle className="w-16 h-16 text-red-500 mb-2" />
                    <p className="text-red-600 font-bold">Failed</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-red-500">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="w-full space-y-4">
          <div className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? "bg-zinc-800/50" : "bg-gray-100"}`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className={`text-xs font-medium ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>Expires in</span>
            </div>
            <span className="text-sm font-bold font-mono text-orange-500">{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
             <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 grayscale opacity-50" />
             <div className="w-px h-3 bg-zinc-700" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Powered by PhonePe</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${isDarkMode ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-gray-100 text-black hover:bg-gray-200"}`}
            >
              Cancel
            </button>
            <button
              disabled
              className={`py-3 rounded-xl text-sm font-bold bg-purple-500 text-white opacity-50 flex items-center justify-center gap-2`}
            >
              <Smartphone className="w-4 h-4" />
              Waiting...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
