# Lucky draw UI

Files: `src/app/company/lucky-draw/page.tsx`, `src/components/lucky-draw/wheel.tsx`, `draw-mode.tsx`, `confetti.tsx`, `src/hooks/useSpinSound.ts`, `src/lib/draw-sound.ts`, `public/sounds/lucky-draw-spin.mp3`.

## What the server owns

`GET /company/draws` returns spins per pool, `canBuySpins`, the current period and recent winners. `POST /company/draws/spin` returns the winner. The wheel only animates to the result; nothing about who wins is decided in the browser.

## Wheel

- `SPIN_MS = 15000`, `SPIN_TURNS = 24` (`page.tsx`). Changing the feel means changing both together; the sound clip is cut to the spin length.
- `WHEEL_SEGMENTS` in `wheel.tsx` drives the tick timing and the landing angle.
- With `prefers-reduced-motion` the wheel lands at once and no music plays.

## Draw mode

Full-screen overlay for a shop TV: big wheel, spins left, repeated spins, confetti and a "Winner!" reveal showing only the name and masked mobile (`src/lib/mask-mobile.ts`). The page wheel passes `active:false` to its sound hook while Draw mode is open so the two never play at once.

## Sound

`useSpinSound` is shared by the page and Draw mode. Sound is **on by default**; the mute choice is stored per browser under `kimates.drawMode.muted`. Browsers only allow audio to start inside a click, so `unlock()` is called from the Spin button handler. `DrawSound` preloads the clip with an `OfflineAudioContext` and plays a synthesised fanfare on a new winner.

## Buying spins

The page shows "Buy more spins" when `draws.canBuySpins === true`. It links to `/company/billing#buy-spins`, where the spin add-on card renders under the same rule (paid plan any time; trial or comp only once the free spins are used up). The price comes from `paymentService.getSpinAddonPrice()`. Checkout is a PayPal order like a plan.

## Copy

"spins left", "No eligible purchases yet in this plan period" when there are spins but no entries, and the period label from the server. Headings over the dark overlay need an explicit light text colour.
