
const API_BASE_URL = "/api/xoftware";
const CACHE_PREFIX = "xoftware_cache_";
const CACHE_TTL_HOURS = 1; // Cache for 1 hour

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl?: string; // Added imageUrl
}

interface ProductDetail extends Product {
  fullDescription: string;
  // Add other detail-specific fields as needed
}

// Helper to check if cache is still valid
const isCacheValid = (timestamp: number): boolean => {
  const now = Date.now();
  const cacheTime = new Date(timestamp).getTime();
  return (now - cacheTime) < (CACHE_TTL_HOURS * 60 * 60 * 1000);
};

// --- Product List ---
export const getXoftwareProducts = async (): Promise<Product[]> => {
  const cacheKey = CACHE_PREFIX + "products";
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const { timestamp, data } = JSON.parse(cachedData);
    if (isCacheValid(timestamp)) {
      console.log("Serving products from cache.");
      return data;
    }
  }

  console.log("Fetching products from API.");
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) {
    throw new Error(`Error fetching products: ${response.statusText}`);
  }
  let products: Product[] = await response.json();

  // For initial setup, let's mock imageUrl if not provided by API
  products = products.map(p => ({
    ...p,
    imageUrl: p.imageUrl || `https://via.placeholder.com/150?text=${encodeURIComponent(p.name)}`
  }));

  localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: products }));
  return products;
};

// --- Product Detail ---
export const getXoftwareProductDetail = async (productId: string): Promise<ProductDetail> => {
  const cacheKey = CACHE_PREFIX + `product_detail_${productId}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const { timestamp, data } = JSON.parse(cachedData);
    if (isCacheValid(timestamp)) {
      console.log(`Serving product detail for ${productId} from cache.`);
      return data;
    }
  }

  console.log(`Fetching product detail for ${productId} from API.`);
  // Assuming the actual Xoftware API endpoint for detail is something like /products/{productId}/detail
  const response = await fetch(`${API_BASE_URL}/products/${productId}/detail`); 
  if (!response.ok) {
    throw new Error(`Error fetching product detail for ${productId}: ${response.statusText}`);
  }
  let productDetail: ProductDetail = await response.json();

  // Mock fullDescription and imageUrl if not provided
  if (!productDetail.fullDescription) {
    productDetail.fullDescription = `Detail lengkap untuk ${productDetail.name || "produk ini"}. Ini adalah deskripsi yang lebih panjang yang menjelaskan fitur-fitur, spesifikasi, dan manfaat produk.`;
  }
  if (!productDetail.imageUrl) {
    productDetail.imageUrl = `https://via.placeholder.com/300?text=${encodeURIComponent(productDetail.name || "Produk Detail")}`;
  }


  localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: productDetail }));
  return productDetail;
};
