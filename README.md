<a name="top"></a>

<div align="center">

# ₿ CryptoTrack

### Premium Real-Time Cryptocurrency Tracker & Calculator

[![Live Demo](https://img.shields.io/badge/Live-Demo-6366f1?style=for-the-badge&logo=github)](https://your-username.github.io/crypto-tracker)
[![MIT License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A polished, minimalist Single Page Application for tracking live crypto prices, converting currencies, and viewing interactive TradingView charts — all without a backend or any API key.

</div>

---

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="livemarket.png" alt="Live Market" width="100%">
      <p align="center"><b>Live Market View</b></p>
    </td>
    <td width="50%">
      <img src="CurrencyConverter.png" alt="Currency Converter" width="100%">
      <p align="center"><b>Currency Converter</b></p>
    </td>
  </tr>
</table>

---

## Features

- **250 Live Coins** — Top 250 cryptocurrencies by market cap, updated via [CoinGecko API](https://www.coingecko.com/en/api)
- **Paginated Market Table** — 50 coins per page with smooth navigation
- **Real-Time Search** — Instant filter across names and symbols
- **Interactive TradingView Charts** — Full candlestick charts via modal on any coin
- **Bidirectional Currency Calculator** — Type in crypto **or** fiat, instant conversion both ways
- **7 Fiat Currencies** — USD, EUR, RUB, BYN, GBP, KZT, UAH with live exchange rates
- **Searchable Coin Selector** — Custom dropdown with coin icons and live search
- **Light / Dark Theme** — Saved to localStorage, respects system preference
- **SPA Architecture** — Instant view transitions, no page reloads
- **Zero Dependencies** — Pure HTML, CSS, and Vanilla JS. No frameworks, no bundlers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 — Glassmorphism, `backdrop-filter`, CSS Variables |
| Logic | Vanilla JavaScript (ES2020+) |
| Fonts | [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts |
| Market Data | [CoinGecko Public API](https://docs.coingecko.com/) |
| Fiat Rates | [ExchangeRate API](https://www.exchangerate-api.com/) |
| Charts | [TradingView Widget](https://www.tradingview.com/widget/) |

---

## Getting Started

No installation required. Just open `index.html` in any modern browser.

```bash
git clone https://github.com/your-username/crypto-tracker.git
cd crypto-tracker
# Open index.html in your browser
open index.html
```

Or serve with any static server:

```bash
npx serve .
```

---

## Project Structure

```
crypto-tracker/
├── index.html          # App shell & SPA views
├── css/
│   └── style.css       # Glassmorphism design system
└── js/
    └── app.js          # All application logic
```

---

## API Usage

This project uses **public, keyless APIs** only:

| API | Endpoint | Used for |
|---|---|---|
| CoinGecko | `/api/v3/coins/markets` | Live prices, market caps, coin icons |
| ExchangeRate-API | `/v4/latest/USD` | Fiat conversion rates |
| TradingView | Widget CDN | Interactive candlestick charts |

> CoinGecko public API has a rate limit of **~30 req/min**. Refresh sparingly.

---

## License

MIT © 2026
