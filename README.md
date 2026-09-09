# dota2-mobile

اسکلت مینیمال یه اپ موبایل (Expo / React Native / TypeScript) که فقط به سرور relay وصل می‌شه و دیتای بازی رو می‌گیره — بدون هیچ UI طراحی‌شده‌ای، صرفاً یه پایه برای اینکه خودت روش بسازی.

## اجرا

```bash
npm install
npx expo start
```

بعد با اپ **Expo Go** (از App Store / Play Store) کد QR رو اسکن کن تا روی گوشی باز بشه. گوشی و کامپیوتر باید روی یه وای‌فای باشن.

### پیش‌نمایش در مرورگر (مثل گوشی)

```bash
npm run web
```

مرورگر روی آدرسی مثل `http://localhost:8081` باز می‌شود. برای دیدن اندازهٔ موبایل، DevTools را باز کن (`F12`) و Device Toolbar / Responsive را فعال کن.

## قبل از اجرا

تو فایل `src/config.ts`، مقدار `RELAY_WS_URL` رو به IP لوکال کامپیوتری که سرور `dota2-gsi-relay` روش اجراست عوض کن:

```ts
export const RELAY_WS_URL = "ws://<IP-کامپیوتر>:3500";
```

## ساختار

```
App.tsx              نقطه‌ی ورود — فعلاً فقط status اتصال + دیتای خام JSON رو نشون می‌ده
src/
  config.ts           آدرس سرور WebSocket
  useGameState.ts      هوک اتصال به WebSocket با reconnect خودکار؛ state و status رو برمی‌گردونه
  types.ts             تایپ RelayState (باید با سرور sync بمونه)
```

## برای توسعه‌ی بعدی

هر UI‌ای که بخوای بسازی، فقط کافیه از `useGameState()` استفاده کنی:

```tsx
const { status, state } = useGameState();
// state?.hero.health, state?.player.gold, state?.items, ...
```

خود هوک منطق اتصال/قطعی/reconnect رو مدیریت می‌کنه؛ نیازی نیست چیزی توش دست بزنی مگر بخوای رفتار اتصال رو عوض کنی.
