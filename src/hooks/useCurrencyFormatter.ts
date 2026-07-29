import { useAppSelector } from "@/store/hooks";
import { formatCurrency } from "@/lib/utils";

// Returns a formatCurrency function pre-loaded with the logged-in company's country,
// so every call site in company pages gets the correct local currency symbol.
export function useCurrencyFormatter(): (amount: string | number) => string {
  const country = useAppSelector((state) => state.company.profile?.country ?? "");
  return (amount: string | number) => formatCurrency(amount, country);
}
