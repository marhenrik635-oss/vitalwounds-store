export interface UserProfile {
  username: string;
  email: string;
  phone: string;
  balance: number;
  tier: "Regular" | "Reseller" | "VIP";
  role: "member" | "admin";
  apiKey: string;
}

export interface Deposit {
  id: string;
  amount: number;
  paymentMethod: string;
  status: "SUCCESS" | "PENDING" | "EXPIRED";
  date: string;
  invoiceNo: string;
}

export interface Order {
  id: string;
  serviceType: "App Premium" | "Suntik Sosmed" | "Nokos";
  productName: string;
  target: string;
  quantity: number;
  price: number;
  status: "Success" | "Processing" | "Failed";
  date: string;
  details?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  category: "Deposit" | "Layanan" | "Technical" | "Other";
  message: string;
  status: "Open" | "Replied" | "Closed";
  date: string;
  replies: {
    sender: "User" | "Admin";
    message: string;
    date: string;
  }[];
}

export interface AppProduct {
  id: string;
  name: string;
  price: number;
  priceRange?: number;
  stock: number;
  description: string;
  category: string;
  icon: string;
}

export interface SmmService {
  id: string;
  platform: "Instagram" | "TikTok" | "YouTube" | "Facebook" | "Twitter";
  name: string;
  pricePer1000: number;
  minOrder: number;
  maxOrder: number;
  description: string;
}

export interface NokosService {
  id: string;
  name: string; // e.g., "WhatsApp", "Telegram", "TikTok"
  country: string; // e.g., "Indonesia 🇮🇩", "USA 🇺🇸", "Russia 🇷🇺"
  price: number;
  availableQty: number;
}
