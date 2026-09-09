# Sanity CMS Setup Guide · Finalitie

Ten projekt ma już wbudowaną pełną, ultralekką integrację z **Sanity.io** (zero zewnętrznych ciężkich bibliotek, natywne zapytania GROQ przez `fetch`).

---

## Krok 1: Załóż darmowe konto na Sanity.io

1. Wejdź na [sanity.io](https://www.sanity.io) i zarejestruj się (np. przez GitHub / Google).
2. Wejdź do panelu zarządzania: [sanity.io/manage](https://www.sanity.io/manage).
3. Kliknij **"Create project"** i nadaj nazwę (np. `finalitie-blog`).
4. Skopiuj swoje **Project ID** (np. `a1b2c3d4`).

---

## Krok 2: Wklej Project ID do projektu

Otwórz plik `sanity-client.js` i zamień:
```javascript
const SANITY_CONFIG = {
  projectId: 'TUTAJ_WKLEJ_SWOJE_PROJECT_ID', // np. 'a1b2c3d4'
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: true,
};
```

---

## Krok 3: Włącz CORS w panelu Sanity

Aby Twoja strona mogła pobierać artykuły z Sanity:
1. W [sanity.io/manage](https://www.sanity.io/manage) wejdź w swój projekt -> **API** -> **CORS Origins**.
2. Kliknij **"Add CORS origin"**:
   - Dla testów lokalnych: `http://localhost:3000` (lub `http://localhost:8080`, `http://127.0.0.1:5500`)
   - Dla wersji produkcyjnej: `https://andkz.github.io` (lub Twoja własna domena)
   - Zaznacz: **Allow credentials** -> Save.

---

## Krok 4: Uruchom Sanity Studio (panel do pisania wpisów)

Możesz uruchomić darmowy panel Sanity Studio w 2 minuty:
```bash
npm create sanity@latest
```
- Wybierz istniejący projekt (`finalitie-blog`).
- Skopiuj zawartość pliku `sanity-schema.js` do `schemaTypes/post.js`.
- Wpisz:
```bash
npx sanity deploy
```
Twój panel CMS będzie dostępny online pod adresem np. `https://finalitie.sanity.studio/`, skąd Ty i Twój zespół możecie pisać i publikować artykuły z dowolnego urządzenia!

---

## Jak to działa na stronie:
- **Strona główna (`index.html`)**: Automatycznie wyświetla 3 najnowsze artykuły z Sanity.
- **Wszystkie wpisy (`blog.html`)**: Wyświetla wszystkie artykuły z filtrowaniem po kategoriach (*SEO*, *Web Design*, *Business Growth*).
- **Czytnik artykułu (`post.html?slug=...`)**: Dynamicznie renderuje treść dowolnego posta z Sanity.
- **Odporność na błędy (Fallback)**: Dopóki nie podasz `projectId`, strona bezbłędnie wyświetla obecne 3 artykuły.
