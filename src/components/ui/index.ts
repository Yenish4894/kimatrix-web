export { Button } from "./button";
// NOTE: CustomerPhoneInput is deliberately NOT re-exported here. It pulls in
// `country-state-city` (country.json, 95 KB) and `libphonenumber-js`, and 26 files
// import from this barrel — including /login, every admin page, and the company
// dashboard, none of which render a phone or country field. Exporting it here put
// 191 KB raw / 37 KB gzipped into 24 routes that never use it.
// Import it by path: `@/components/ui/customer-phone-input`.
export { Input } from "./input";
export { Select } from "./select";
export { SearchableSelect } from "./searchable-select";
export { Checkbox } from "./checkbox";
export { Card, CardHeader, CardContent, CardFooter } from "./card";
export { Badge } from "./badge";
export { StatCard } from "./stat-card";
export { Modal } from "./modal";
export { Table } from "./table";
export { Pagination } from "./pagination";
export { Loader, PageLoader } from "./loader";
export { QueryErrorState } from "./query-error-state";
