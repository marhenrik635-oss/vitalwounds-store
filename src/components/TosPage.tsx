import React from 'react';
import { motion } from 'framer-motion';

export default function TosPage() {
  return (
    <div className="min-h-screen bg-vw-bg text-vw-text py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-vw-text-muted">Last Updated: July 10, 2026</p>
          
          <div className="prose prose-invert prose-vw-accent">
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Layanan</h2>
            <p className="text-vw-text-muted">Vitalwounds Store menyediakan layanan akun digital premium. Semua akun yang dijual adalah resmi/shared sesuai deskripsi produk.</p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Garansi</h2>
            <p className="text-vw-text-muted">Garansi berlaku sesuai durasi yang tertera di masing-masing produk (misal: 30 hari). Garansi tidak berlaku jika akun diubah password-nya oleh pembeli.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Pembayaran</h2>
            <p className="text-vw-text-muted">Pembayaran wajib diverifikasi melalui sistem. Tidak ada refund untuk kesalahan pembelian oleh pembeli.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Larangan</h2>
            <p className="text-vw-text-muted">Dilarang menyebarluaskan kredensial akun kepada pihak ketiga.</p>
          </div>

          <button 
            onClick={() => window.history.back()}
            className="mt-8 px-6 py-3 bg-vw-accent hover:bg-vw-accent-hover text-white rounded-xl font-semibold"
          >
            Kembali
          </button>
        </motion.div>
      </div>
    </div>
  );
}