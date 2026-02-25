import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns the currency code and symbol for a given city string. */
export function getCurrencyForCity(city: string | null | undefined): {
  code: string;
  symbol: string;
} {
  if (!city) return { code: "USD", symbol: "$" };
  const c = city.toLowerCase();

  if (/singapore|sg\b/.test(c)) return { code: "SGD", symbol: "S$" };
  if (/malaysia|kuala lumpur|kl\b|penang|johor/.test(c))
    return { code: "MYR", symbol: "RM" };
  if (/australia|sydney|melbourne|brisbane|perth|adelaide/.test(c))
    return { code: "AUD", symbol: "A$" };
  if (/new zealand|auckland|wellington|christchurch/.test(c))
    return { code: "NZD", symbol: "NZ$" };
  if (/uk|united kingdom|london|manchester|birmingham|edinburgh/.test(c))
    return { code: "GBP", symbol: "£" };
  if (/europe|germany|france|spain|italy|netherlands|berlin|paris|madrid|rome|amsterdam/.test(c))
    return { code: "EUR", symbol: "€" };
  if (/canada|toronto|vancouver|montreal|calgary/.test(c))
    return { code: "CAD", symbol: "C$" };
  if (/india|mumbai|delhi|bangalore|hyderabad|chennai|kolkata/.test(c))
    return { code: "INR", symbol: "₹" };
  if (/japan|tokyo|osaka/.test(c)) return { code: "JPY", symbol: "¥" };
  if (/china|beijing|shanghai|shenzhen/.test(c))
    return { code: "CNY", symbol: "¥" };
  if (/hong kong|hk\b/.test(c)) return { code: "HKD", symbol: "HK$" };
  if (/philippines|manila/.test(c)) return { code: "PHP", symbol: "₱" };
  if (/indonesia|jakarta|bali/.test(c)) return { code: "IDR", symbol: "Rp" };
  if (/thailand|bangkok/.test(c)) return { code: "THB", symbol: "฿" };
  if (/uae|dubai|abu dhabi/.test(c)) return { code: "AED", symbol: "AED" };
  if (/saudi|riyadh|jeddah/.test(c)) return { code: "SAR", symbol: "SAR" };

  // Default to USD
  return { code: "USD", symbol: "$" };
}
