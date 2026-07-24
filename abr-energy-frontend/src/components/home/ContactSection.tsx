'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';

export function ContactSection() {
  return (
    <section data-section="contact" className="relative py-28 md:py-36 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-emerald-950/10 to-black" />
      
      <div className="container-page text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="max-w-2xl mx-auto p-12 md:p-16 rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl">
            <Phone className="h-16 w-16 mx-auto mb-8 text-emerald-400/60" />
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Ready to Start Your Solar Project?</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Contact our team today for a free consultation and a personalized solar solution tailored to your needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600 transition-all duration-500 shadow-2xl shadow-emerald-500/20 group">
                Contact Us <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-2xl border border-white/15 text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/30 transition-all duration-300 backdrop-blur-sm">
                Request a Quote
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
