import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { isVoided } from "@/lib/void";

/**
 * A purchase amount that reads correctly whether or not the purchase was voided.
 *
 * Voided purchases stay in every list — deleting them would erase the record of what
 * the customer submitted — so the list itself has to make it unmistakable that the
 * amount no longer counts. Strike-through alone is invisible to a screen reader, hence
 * the sr-only suffix.
 */
export function VoidedAmount({
  formatted,
  purchase,
  showReason = true,
  className,
}: Readonly<{
  formatted: string;
  purchase: { voidedAt?: string | null; voidReason?: string | null };
  showReason?: boolean;
  className?: string;
}>) {
  if (!isVoided(purchase)) {
    return <span className={cn("font-semibold", className)}>{formatted}</span>;
  }
  return (
    <span className={cn("inline-flex flex-col items-end md:items-start gap-1", className)}>
      <span className="flex items-center gap-2">
        <span className="line-through text-slate-400">{formatted}</span>
        <span className="sr-only">(voided)</span>
        <Badge variant="error" title={purchase.voidReason ?? undefined}>Voided</Badge>
      </span>
      {showReason && purchase.voidReason && (
        // whitespace-normal: the mobile card cell is nowrap, and a reason cut off at
        // 375px would hide the one thing the reader needs.
        <span className="text-xs text-slate-500 whitespace-normal break-words max-w-[16rem]">
          {purchase.voidReason}
        </span>
      )}
    </span>
  );
}
