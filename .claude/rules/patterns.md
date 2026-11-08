# Code patterns

Real examples to copy. When a pattern here and the code disagree, the code is newer; fix this file.

## Data fetching

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ["company", "draws"],
  queryFn: companyService.getDraws,
});
```

- Query keys: `["admin", ...]`, `["company", ...]`, `["subscription", ...]`, `["plans"]`. Mutations call `queryClient.invalidateQueries({ queryKey: ["company"] })` by prefix.
- `placeholderData: (prev) => prev` on paginated tables so the page does not flash (see `src/app/admin/email/page.tsx`).
- Loading: `PageLoader` for a page, `Loader` inline. Errors: `QueryErrorState` with a retry.

## Services

`src/services/*.service.ts` export one object per area. A function does the HTTP call and returns `data.data`:

```ts
sendBulkEmail: async (payload) => {
  const form = new FormData();           // multipart; api.ts clears the JSON Content-Type
  ...
  const { data } = await api.post("/admin/bulk-email", form, { onUploadProgress });
  return data;
},
```

Types for requests and responses live in `src/types/index.ts`, named after the backend shape.

## Errors and toasts

```ts
import { actionErrorMessage, parseApiError } from "@/lib/errors";
onError: (err) => toast.error(actionErrorMessage(err)),
```

`parseApiError` keeps `details[]` (field errors), `retryAfterSeconds` for 429s and the request id, so a user can quote `(ID: ...)` back to support.

## Forms

Small in-house validator `src/lib/validation.ts`; the backend re-validates with Joi. Phone inputs use `CustomerPhoneInput` / `PhoneInput` with the country's dialling code (`libphonenumber-js`). Email typo suggestions come from `src/lib/emailSuggest.ts`.

## Dialogs

`ConfirmDialog` for anything irreversible (pause QR, hide plan, ban, send bulk email). `Modal` traps focus; pass `isLoading` to the confirm button during the mutation.

## Access and countdowns

```ts
const { entitlement, hasAccess } = useEntitlement();
const countdown = useCountdown(entitlement?.endsAt ?? null);
```

Copy for banners comes from `countdownCopy()` and `planDisplayName()` in `src/lib/entitlement.ts`, which say "trial" (never "free trial") and show the plan name for paid periods.

## Money and dates

`useCurrencyFormatter()` formats customer amounts in the company's currency; platform payments are always USD. Dates go through `src/lib/dates.ts` (local whole days for filters, UTC on the wire).

## PDFs

`src/lib/pdf/` builds the QR poster and reports with jsPDF. Non-ASCII currency symbols (₹) need the embedded font path; see the comments there before adding text.

## Testing

Helpers in `src/lib/` are pure and get colocated `*.test.ts` files (`node:test` + `assert`). UI is verified in the browser at 390 px and 1280 px; there is no component test runner.

## Styling

Tailwind utility classes with the theme tokens in `globals.css` (`primary-*`, `success-*`, `warning-*`, `error-*`, `info-*`). Variants via `cva` (`src/components/ui/button.tsx`). `cn()` from `src/lib/utils.ts` merges classes.
