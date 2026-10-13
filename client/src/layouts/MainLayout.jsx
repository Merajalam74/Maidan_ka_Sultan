import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuction } from '../context/AuctionSocketContext';
import { formatINR } from '../utils/formatters';
import { Trophy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainLayout({ children }) {
  const { soldCelebration, bidError, clearBidError } = useAuction();

  return (
    <div className="min-h-screen bg-stadium-lights flex flex-col relative text-slate-100">
      <Navbar />

      {/* Persistent Celebratory Banner for SOLD or UNSOLD Events */}
      <AnimatePresence>
        {soldCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
          >
            <div
              className={`p-4 rounded-2xl shadow-stadium border backdrop-blur-xl ${
                soldCelebration.isUnsold
                  ? 'bg-red-950/90 border-red-500/50 text-white'
                  : 'bg-emerald-950/90 border-emerald-500/50 text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-lg ${
                    soldCelebration.isUnsold ? 'bg-red-600 text-white' : 'bg-emerald-500 text-black'
                  }`}
                >
                  {soldCelebration.isUnsold ? 'UNSOLD' : 'SOLD!'}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-extrabold text-lg text-white">
                    {soldCelebration.player?.name}
                  </h3>
                  {soldCelebration.isUnsold ? (
                    <p className="text-xs text-red-200">
                      No team placed a bid meeting the base price. Player remains in the available pool for future re-nomination.
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-200">
                      Purchased by <strong className="text-white font-bold">{soldCelebration.team?.name}</strong> for{' '}
                      <span className="text-cpl-gold font-extrabold text-sm">
                        {formatINR(soldCelebration.price)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bid Rejection Error Toast */}
      <AnimatePresence>
        {bidError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 max-w-md w-full"
          >
            <div className="bg-red-900/90 border border-red-500 text-red-100 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">Bid Rejected</h4>
                <p className="text-xs mt-0.5 leading-relaxed">{bidError}</p>
              </div>
              <button
                onClick={clearBidError}
                className="text-red-300 hover:text-white font-bold text-sm ml-2"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
