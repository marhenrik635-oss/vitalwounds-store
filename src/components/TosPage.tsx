import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, ChevronLeft, CheckCircle, ArrowUpRight } from 'lucide-react';

const TABS = [
  { id: 'privacy', label: 'Privacy Policy', icon: Shield },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
] as const;

type TabId = (typeof TABS)[number]['id'];

const PRIVACY_SECTIONS = [
  {
    title: '1. Informasi yang Kami Kumpulkan',
    content: [
      'Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar atau menggunakan layanan kami, termasuk:',
      '• Nama lengkap dan alamat email — digunakan untuk identifikasi akun dan komunikasi layanan',
      '• Data transaksi — riwayat deposit, pembelian, dan penggunaan layanan',
      '• Data teknis — alamat IP, tipe browser, sistem operasi, dan data penggunaan situs',
      'Kami tidak mengumpulkan data sensitif seperti informasi kartu kredit penuh. Semua pembayaran diproses melalui penyedia pihak ketiga yang aman (QRIS, Virtual Account, E-Wallet).',
    ],
  },
  {
    title: '2. Penggunaan Informasi',
    content: [
      'Informasi yang kami kumpulkan digunakan untuk:',
      '• Memproses dan mengelola akun Anda, termasuk deposit dan pembelian layanan',
      '• Mengirimkan notifikasi terkait transaksi, pembaruan layanan, dan dukungan teknis',
      '• Meningkatkan kualitas dan keamanan platform kami berdasarkan pola penggunaan',
      '• Mematuhi kewajiban hukum dan peraturan yang berlaku di Indonesia',
      'Kami tidak akan menggunakan data Anda untuk tujuan pemasaran tanpa persetujuan eksplisit Anda.',
    ],
  },
  {
    title: '3. Perlindungan Data',
    content: [
      'Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data pribadi Anda:',
      '• Enkripsi SSL/TLS untuk seluruh transmisi data antara browser dan server',
      '• Penyimpanan password dengan hashing one-way (bcrypt) — password Anda tidak pernah disimpan dalam bentuk plain text',
      '• Akses terbatas ke data pengguna hanya untuk personel yang membutuhkan',
      '• Audit keamanan berkala untuk mengidentifikasi dan memperbaiki kerentanan',
      'Meskipun demikian, tidak ada metode transmasi atau penyimpanan data yang 100% aman. Kami tidak dapat menjamin keamanan absolut.',
    ],
  },
  {
    title: '4. Cookies & Teknologi Pelacakan',
    content: [
      'Kami menggunakan cookies dan teknologi serupa untuk:',
      '• Menjaga sesi login Anda tetap aktif selama menjelajah',
      '• Menyimpan preferensi tema (light/dark mode) dan bahasa',
      '• Menganalisis pola penggunaan situs untuk perbaikan layanan',
      '• Mencegah aktivitas curang dan melindungi keamanan akun',
      'Anda dapat mengatur preferensi cookies melalui pengaturan browser Anda. Menonaktifkan cookies tertentu dapat mempengaruhi fungsionalitas situs.',
    ],
  },
  {
    title: '5. Berbagi Data dengan Pihak Ketiga',
    content: [
      'Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga. Namun, kami dapat membagikan data terbatas dalam situasi berikut:',
      '• Penyedia pembayaran — data transaksi minimum diperlukan untuk memproses pembayaran',
      '• Penyedia layanan teknis — hosting, CDN, dan layanan infrastruktur lainnya',
      '• Kewajiban hukum — jika diwajibkan oleh hukum atau perintah pengadilan yang sah',
      'Seluruh pihak ketiga yang bekerja sama dengan kami terikat oleh perjanjian kerahasiaan dan hanya diizinkan menggunakan data untuk tujuan yang ditentukan.',
    ],
  },
  {
    title: '6. Hak Anda',
    content: [
      'Anda memiliki hak-hak berikut terkait data pribadi Anda:',
      '• Hak Akses — meminta salinan data pribadi yang kami simpan',
      '• Hak Koreksi — memperbarui informasi yang tidak akurat atau tidak lengkap',
      '• Hak Hapus — meminta penghapusan data akun Anda (kecuali data yang wajib disimpan secara hukum)',
      '• Hak Batasan — membatasi pemrosesan data dalam kondisi tertentu',
      '• Hak Portabilitas — meminta data Anda dalam format terstruktur',
      'Untuk menggunakan hak-hak di atas, hubungi kami melalui email atau Discord.',
    ],
  },
  {
    title: '7. Retensi Data',
    content: [
      'Kami menyimpan data pribadi Anda selama akun Anda masih aktif atau selama diperlukan untuk menyediakan layanan. Data akun yang dihapus akan dihapus secara permanen dalam waktu 30 hari setelah permintaan penghapusan.',
      'Data transaksi keuangan disimpan sesuai dengan ketentuan peraturan perpajakan dan akuntansi yang berlaku di Indonesia (minimal 5 tahun).',
    ],
  },
  {
    title: '8. Perubahan Kebijakan',
    content: [
      'Kebijakan privasi ini dapat diperbarui dari waktu ke waktu. Perubahan signifikan akan diberitahukan melalui email atau pemberitahuan di situs. Dengan terus menggunakan layanan setelah perubahan, Anda menyetujui kebijakan yang diperbarui.',
      'Tanggal revisi terakhir selalu dicantumkan di bagian atas halaman ini.',
    ],
  },
  {
    title: '9. Kontak & Pengaduan',
    content: [
      'Jika Anda memiliki pertanyaan, kekhawatiran, atau ingin mengajukan pengaduan terkait privasi data, hubungi kami melalui:',
      '• Email: vitalwoundsstore@gmail.com',
      '• Discord: https://discord.gg/G4qbWnrxxk',
      '• WhatsApp: 088983082523',
      'Kami berkomitmen untuk merespons setiap pertanyaan dalam waktu 1x24 jam kerja.',
    ],
  },
];

const TERMS_SECTIONS = [
  {
    title: '1. Definisi & Ruang Lingkup',
    content: [
      'Dengan mendaftar dan menggunakan layanan Vitalwounds Store ("Platform"), Anda menyetujui seluruh syarat dan ketentuan yang tercantum dalam dokumen ini. Jika Anda tidak setuju dengan sebagian atau seluruh ketentuan, mohon untuk tidak menggunakan layanan kami.',
      '• "Pengguna" — individu yang telah mendaftar dan memiliki akun di Platform',
      '• "Layanan" — produk akun digital premium yang dijual melalui Platform',
      '• "Saldo" — dana dalam akun pengguna yang dapat digunakan untuk pembelian',
      '• "Kami/Vitalwounds" — penyedia layanan Vitalwounds Store',
    ],
  },
  {
    title: '2. Pendaftaran Akun',
    content: [
      'Untuk menggunakan layanan, Anda wajib mendaftar dengan informasi yang benar dan akurat. Setiap pengguna hanya diizinkan memiliki satu akun, kecuali mendapat persetujuan tertulis dari kami.',
      'Anda bertanggung jawab penuh atas keamanan kredensial akun (email dan password). Segala aktivitas yang terjadi dalam akun Anda adalah tanggung jawab Anda. Segera laporkan jika ada akses tidak sah ke akun Anda.',
    ],
  },
  {
    title: '3. Deposit & Saldo',
    content: [
      '• Deposit dapat dilakukan melalui QRIS, Transfer Bank, E-Wallet (GoPay, DANA, OVO), dan Retail (Indomaret, Alfamart)',
      '• Deposit minimum: Rp 10.000',
      '• Saldo akan masuk secara otomatis setelah pembayaran terverifikasi',
      '• Saldo tidak dapat ditarik kembali (non-refundable) kecuali atas kesalahan sistem yang kami konfirmasi',
      '• Saldo tidak memiliki masa kedaluwarsa selama akun aktif',
    ],
  },
  {
    title: '4. Pembelian & Aktivasi',
    content: [
      '• Setelah pembelian, kredensial akun premium akan dikirimkan ke email terdaftar dalam 1-5 menit',
      '• Harga produk sudah termasuk semua biaya, tidak ada biaya tersembunyi',
      '• Produk yang dibeli adalah untuk penggunaan pribadi dan tidak boleh didistribusikan',
      '• Kami berhak menolak atau membatalkan transaksi jika terindikasi pelanggaran ketentuan',
    ],
  },
  {
    title: '5. Garansi & Pengembalian Dana',
    content: [
      'Garansi berlaku sesuai durasi yang tertera pada masing-masing produk (umumnya 30 hari untuk layanan shared account). Ketentuan garansi:',
      '• Garansi mencakup: akun tidak dapat diakses karena kesalahan dari pihak kami atau provider',
      '• Garansi tidak berlaku jika: password akun diubah oleh pengguna, melanggar ketentuan penggunaan provider, atau kerusakan akibat kelalaian pengguna',
      '• Refund hanya diberikan jika dalam 2x24 jam layanan tidak dapat diaktifkan dan bukan karena kesalahan pengguna',
      '• Keputusan refund bersifat final dan mengikat setelah ditinjau oleh tim support',
    ],
  },
  {
    title: '6. Larangan & Sanksi',
    content: [
      'Dilarang keras melakukan hal-hal berikut. Pelanggaran dapat mengakibatkan suspend permanen tanpa pengembalian saldo:',
      '• Menyebarluaskan kredensial akun premium yang dibeli kepada pihak ketiga',
      '• Melakukan chargeback atau pembalikan pembayaran setelah layanan diterima',
      '• Menggunakan sistem otomatis/bot untuk menyalahgunakan layanan',
      '• Melakukan penipuan, pemalsuan data, atau aktivitas ilegal lainnya',
      '• Melecehkan, mengancam, atau menyebarkan konten negatif tentang tim support',
    ],
  },
  {
    title: '7. Batasan Tanggung Jawab',
    content: [
      'Vitalwounds Store menyediakan layanan "sebagaimana adanya" (as-is) dan "tersedia sebagaimana mestinya" (as-available). Kami tidak bertanggung jawab atas:',
      '• Kerugian tidak langsung, insidental, atau konsekuensial akibat penggunaan layanan',
      '• Gangguan layanan dari pihak ketiga (provider aplikasi, payment gateway, hosting)',
      '• Kehilangan data atau kerusakan perangkat akibat penggunaan layanan',
      '• Keterlambatan aktivasi di luar kendali kami (force majeure)',
    ],
  },
  {
    title: '8. Kekayaan Intelektual',
    content: [
      'Seluruh konten, logo, desain, dan materi di Platform dilindungi hak cipta dan merek dagang. Anda tidak diizinkan menyalin, memodifikasi, mendistribusikan, atau menggunakan materi tersebut tanpa izin tertulis dari kami.',
      'Nama merek aplikasi (Netflix, Spotify, YouTube, Canva, ChatGPT, CapCut) adalah merek dagang dari masing-masing pemiliknya dan tidak berafiliasi dengan Vitalwounds Store.',
    ],
  },
  {
    title: '9. Penghentian Layanan',
    content: [
      'Kami berhak menangguhkan atau menghentikan akses akun Anda jika:',
      '• Melanggar ketentuan yang tercantum dalam dokumen ini',
      '• Terlibat dalam aktivitas penipuan atau ilegal',
      '• Atas permintaan Anda sendiri untuk penghapusan akun',
      'Penghentian layanan tidak membebaskan kewajiban pembayaran yang telah jatuh tempo. Jika akun di-suspend karena pelanggaran, saldo yang tersisa tidak dapat dikembalikan.',
    ],
  },
  {
    title: '10. Hukum yang Berlaku',
    content: [
      'Syarat dan ketentuan ini diatur oleh hukum Negara Kesatuan Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui musyawarah terlebih dahulu. Jika tidak tercapai kesepakatan, penyelesaian sengketa akan dilakukan di pengadilan negeri yang berwenang di wilayah hukum Indonesia.',
    ],
  },
  {
    title: '11. Perubahan Ketentuan',
    content: [
      'Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu. Pengguna akan diberitahu melalui email atau pemberitahuan di Platform untuk perubahan signifikan. Dengan terus menggunakan layanan setelah perubahan efektif, Anda dianggap menyetujui ketentuan yang diperbarui.',
    ],
  },
  {
    title: '12. Kontak',
    content: [
      'Untuk pertanyaan, saran, atau pengaduan, hubungi kami melalui:',
      '• Email: vitalwoundsstore@gmail.com',
      '• Discord: https://discord.gg/G4qbWnrxxk',
      '• WhatsApp: 088983082523',
      'Kami siap membantu Anda 7 hari seminggu, respons dalam 1x24 jam kerja.',
    ],
  },
];

export default function TosPage() {
  const [activeTab, setActiveTab] = useState<TabId>('privacy');
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const sections = activeTab === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return (
    <div className="min-h-[100dvh] bg-vw-bg text-vw-text antialiased selection:bg-vw-accent/30">
      {/* Back button */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-vw-bg/85 backdrop-blur-md border-b border-vw-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-medium text-vw-text-muted hover:text-vw-text transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Vitalwounds" className="w-5 h-5 rounded object-contain bg-white" />
            <span className="text-xs font-semibold text-vw-text-muted">Vitalwounds Store</span>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            <div className="w-12 h-12 rounded-2xl bg-vw-accent/10 flex items-center justify-center mx-auto mb-5">
              {activeTab === 'privacy'
                ? <Shield size={22} className="text-vw-accent" />
                : <FileText size={22} className="text-vw-accent" />
              }
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] leading-[1.1] text-balance mb-3">
              {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
            </h1>
            <p className="text-sm text-vw-text-muted/70">
              Terakhir diperbarui: 11 Juli 2026
            </p>
          </motion.div>

          {/* Tab switcher */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex bg-vw-surface rounded-2xl p-1.5 border border-vw-border mb-10"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-vw-accent text-white shadow-sm'
                      : 'text-vw-text-muted hover:text-vw-text hover:bg-vw-bg/50'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </motion.div>

          {/* Sections */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="space-y-3">
                {sections.map((section, i) => {
                  const isOpen = expandedSection === i;
                  return (
                    <div
                      key={section.title}
                      className="bg-vw-surface rounded-2xl border border-vw-border overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => setExpandedSection(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-vw-bg/30 transition-colors gap-4"
                      >
                        <h2 className="text-sm sm:text-base font-semibold text-vw-text leading-snug pr-4">
                          {section.title}
                        </h2>
                        <div className={`w-6 h-6 rounded-lg bg-vw-bg border border-vw-border flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isOpen ? 'rotate-180 bg-vw-accent/10 border-vw-accent/30' : ''
                        }`}>
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-colors duration-300 ${isOpen ? 'text-vw-accent' : 'text-vw-text-muted'}`}>
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>
                      <div className={`transition-all duration-300 ease-out overflow-hidden ${
                        isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 space-y-2.5">
                          {section.content.map((line, j) => (
                            <p
                              key={j}
                              className={`text-sm leading-relaxed ${
                                line.startsWith('•') || line.startsWith('  •')
                                  ? 'text-vw-text-muted pl-4'
                                  : line.startsWith('"') || line.startsWith('Kami')
                                  ? 'text-vw-text-muted font-medium'
                                  : 'text-vw-text-muted'
                              }`}
                            >
                              {line.startsWith('  ') ? line.trimStart() : line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="bg-vw-surface rounded-2xl border border-vw-border p-6 sm:p-8">
              <CheckCircle size={20} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-vw-text mb-1">Ada pertanyaan?</p>
              <p className="text-xs text-vw-text-muted mb-4 max-w-sm mx-auto">
                Tim support kami siap membantu 7 hari seminggu. Jangan ragu untuk menghubungi kami.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="https://wa.me/6288983082523"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-vw-accent hover:text-vw-accent-hover transition-colors"
                >
                  WhatsApp <ArrowUpRight size={11} />
                </a>
                <a
                  href="https://discord.gg/G4qbWnrxxk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5865F2] hover:text-[#4752C4] transition-colors"
                >
                  Discord <ArrowUpRight size={11} />
                </a>
                <a
                  href="mailto:vitalwoundsstore@gmail.com"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-vw-text-muted hover:text-vw-text transition-colors"
                >
                  Email <ArrowUpRight size={11} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
