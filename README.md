# CashConvert

A Chrome extension that shows live exchange rates and lets you convert between currencies instantly.

Available as both a popup and a full side panel with a world currency converter.

## Features

- **Live exchange rates** via the [Frankfurter API](https://www.frankfurter.app) (European Central Bank data)
- **Office currency tiles** - at-a-glance rates for GBP, EUR, BRL, CNY, and USD
- **Selectable base currency** - click any currency to use it as the base
- **Built-in converter** - convert any amount between any of the five currencies
- **World converter** (side panel) - search and convert between 38 world currencies
- **Swap button** - instantly flip the from/to currencies
- **Tile amount input** (side panel) - enter any amount and all tiles update live
- **Rates cached for 1 hour** - avoids unnecessary API calls
- **Last updated note** - shows how fresh the current rates are
- **Click-to-set base** (side panel) - click any tile to make it the base currency

## Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `cashconvert` folder

## Customising the Currencies

The office currency tiles are defined at the top of `popup.js` and `sidepanel.js`:

```js
const CURRENCIES = [
  { code:'GBP', flag:'🇬🇧', name:'British Pound',  symbol:'£',  office:'United Kingdom' },
  { code:'EUR', flag:'🇪🇺', name:'Euro',            symbol:'€',  office:'Brussels'       },
  // Add or change currencies here...
];
```

Update these to match your own team's locations.

## How It Works

Rates are fetched from `api.frankfurter.app` using your chosen base currency. All other rates are derived from this single API call. Cross-rates (e.g. BRL to CNY) are calculated via the base currency.

Rates are cached in `storage.local` for 60 minutes to avoid unnecessary requests.

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Caches exchange rates and saves your base currency preference |
| `sidePanel` | Enables the side panel view |
| `host_permissions: api.frankfurter.app` | Fetches live exchange rates from the Frankfurter API |

## File Structure

```
cashconvert/
  manifest.json     Extension config and permissions
  background.js     Service worker - opens side panel on icon click
  popup.html        Popup UI - compact tile grid and converter
  popup.js          Popup logic - rate fetching, tiles, converter
  sidepanel.html    Side panel UI - full-featured layout
  sidepanel.js      Side panel logic - tiles, office converter, world converter
  icons/            Extension icons (16px, 48px, 128px)
```

## Licence

MIT
