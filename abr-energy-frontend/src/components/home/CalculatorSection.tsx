'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';

export function CalculatorSection() {
  return (
    <section data-section="calculator" className="relative py-28 md:py-36 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px]">
          <motion.div className="w-full h-full bg-gradient-to-r from-emerald-500/20 via-amber-500/15 to-emerald-500/20" animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
        </div>
        <motion.div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-emerald-400/5 blur-[100px]" animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-amber-400/5 blur-[100px]" animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className="container-page text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <motion.div
            animate={{ rotate: [0, 8, 0, -8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex mb-8"
          >
            <div className="relative">
              <Calculator className="h-24 w-24 text-emerald-400/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/20 to-transparent rounded-full blur-2xl" />
            </div>
          </motion.div>
          
          <h2 className="font-heading text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">Design Your Solar System</h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Estimate system size, battery capacity, inverter power, and return on investment for your project in seconds.
          </p>
          <Link
            href="/calculator"
            className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-semibold rounded-2xl overflow-hidden transition-all duration-500"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 group-hover:from-amber-400 group-hover:to-orange-500 transition-all duration-500" />
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
            <span className="relative z-10 flex items-center gap-2 text-white"><Calculator className="h-5 w-5" /> Start Calculator</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
