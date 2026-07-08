import { AppProduct, SmmService, NokosService, UserProfile, Deposit, Order, Ticket } from "./types";

export const initialUserProfile: UserProfile = {
  username: "",
  email: "",
  phone: "",
  balance: 0,
  tier: "Regular",
  role: "member",
  apiKey: "",
};

export const initialDeposits: Deposit[] = [];

export const initialOrders: Order[] = [];

export const initialTickets: Ticket[] = [];

export const appProducts: AppProduct[] = [
  {
    id: "APP-001",
    name: "Netflix Premium Ultra HD (Shared)",
    price: 30000,
    stock: 45,
    description: "Akun bersama (Shared Screen), Resolusi 4K UHD, Garansi Full 30 Hari, Support semua device.",
    category: "Streaming",
    icon: "Tv",
  },
  {
    id: "APP-002",
    name: "Spotify Premium Individual 1 Bulan",
    price: 15000,
    stock: 99,
    description: "Akun Privat / Invite Family plan, bebas iklan, kualitas audio sangat tinggi, bisa download offline.",
    category: "Music",
    icon: "Music",
  },
  {
    id: "APP-003",
    name: "YouTube Premium Privat 1 Bulan",
    price: 12000,
    stock: 72,
    description: "Tanpa Iklan, Putar di latar belakang, Termasuk YouTube Music, Garansi penuh.",
    category: "Streaming",
    icon: "Youtube",
  },
  {
    id: "APP-004",
    name: "Canva Pro Team Invite (Lifetime Access)",
    price: 25000,
    stock: 120,
    description: "Akses penuh fitur premium Canva, ratusan template, font premium, cloud storage 1TB.",
    category: "Productivity",
    icon: "Palette",
  },
  {
    id: "APP-005",
    name: "ChatGPT Plus Pro Shared Account",
    price: 49000,
    stock: 15,
    description: "Akses GPT-4o, DALL-E 3, pembuatan custom GPTs, tanpa batas kirim pesan, shared profile.",
    category: "AI Tools",
    icon: "BrainCircuit",
  },
  {
    id: "APP-006",
    name: "CapCut Pro Mobile / PC 1 Bulan",
    price: 18000,
    stock: 28,
    description: "Bebas watermark, semua efek & transisi pro terbuka, kualitas ekspor maksimal.",
    category: "Editing",
    icon: "Video",
  },
];

export const smmServices: SmmService[] = [
  {
    id: "SMM-001",
    platform: "Instagram",
    name: "Instagram Followers Mixed Pasif [Murah]",
    pricePer1000: 8000,
    minOrder: 100,
    maxOrder: 50000,
    description: "Followers berkualitas campuran, pasif, kecepatan 2k-5k per hari. No Refill.",
  },
  {
    id: "SMM-002",
    platform: "Instagram",
    name: "Instagram Followers Real Indonesia [Garansi 30 Hari]",
    pricePer1000: 22000,
    minOrder: 100,
    maxOrder: 10000,
    description: "Followers akun asli Indonesia aktif, bisa drop sedikit tapi ada tombol garansi refill 30 hari.",
  },
  {
    id: "SMM-003",
    platform: "Instagram",
    name: "Instagram Likes Server Express [Non-Drop]",
    pricePer1000: 4500,
    minOrder: 50,
    maxOrder: 20000,
    description: "Likes instan langsung masuk sesaat setelah order, kualitas aman, minim drop.",
  },
  {
    id: "SMM-004",
    platform: "TikTok",
    name: "TikTok Followers High Quality [Instant]",
    pricePer1000: 18000,
    minOrder: 100,
    maxOrder: 30000,
    description: "Followers TikTok kualitas premium, akun berfoto profil, pengerjaan cepat dan mantap.",
  },
  {
    id: "SMM-005",
    platform: "TikTok",
    name: "TikTok Video Views Max Speed",
    pricePer1000: 800,
    minOrder: 500,
    maxOrder: 1000000,
    description: "Tingkatkan views video TikTok dalam hitungan detik. Sangat bagus untuk FYP.",
  },
  {
    id: "SMM-006",
    platform: "YouTube",
    name: "YouTube Subscribers Organik [Membantu Monetisasi]",
    pricePer1000: 185000,
    minOrder: 50,
    maxOrder: 2000,
    description: "Subscribers kualitas real manusia. Drop rate rendah. Aman untuk partner youtube.",
  },
  {
    id: "SMM-007",
    platform: "YouTube",
    name: "YouTube Jam Tayang (Watchtime) [Garansi 30 Hari]",
    pricePer1000: 120000,
    minOrder: 100,
    maxOrder: 4000,
    description: "Tingkatkan jam tayang video durasi >15 menit. Membantu monetisasi channel.",
  },
];

export const nokosServices: NokosService[] = [
  {
    id: "NKS-001",
    name: "WhatsApp OTP",
    country: "Indonesia 🇮🇩",
    price: 8500,
    availableQty: 140,
  },
  {
    id: "NKS-002",
    name: "WhatsApp OTP",
    country: "USA 🇺🇸",
    price: 3500,
    availableQty: 350,
  },
  {
    id: "NKS-003",
    name: "Telegram OTP",
    country: "Indonesia 🇮🇩",
    price: 12000,
    availableQty: 85,
  },
  {
    id: "NKS-004",
    name: "Telegram OTP",
    country: "Russia 🇷🇺",
    price: 6000,
    availableQty: 210,
  },
  {
    id: "NKS-005",
    name: "TikTok OTP",
    country: "Indonesia 🇮🇩",
    price: 3000,
    availableQty: 420,
  },
  {
    id: "NKS-006",
    name: "Shopee OTP",
    country: "Indonesia 🇮🇩",
    price: 5000,
    availableQty: 180,
  },
];
