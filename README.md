# CashConvert

A friendly Chrome side panel for currency conversion, with Penny the coin as your guide.

## Features
- **Office currency tiles:** GBP, EUR, USD, BRL and CNY at a glance. Tap a tile to make it the base.
- **Right-click to convert:** highlight a price on any page (for example "€249.00", "R$ 1.250,90" or "US$ 99"), right-click and choose *Convert with Penny*.
- **World converter:** convert between any currency published by the European Central Bank, with a swap button.
- **Works offline:** uses saved rates when the network is unavailable and shows when they were last updated.

## Install (developer mode)
1. Download or clone this repository
2. Go to `chrome://extensions` and turn on **Developer mode**
3. Click **Load unpacked** and select the `cashconvert` folder
4. Click the CashConvert icon to open the side panel

## Permissions
| Permission | Why |
|---|---|
| `storage` | Cache rates and remember your currency choices |
| `sidePanel` | Show CashConvert as a side panel |
| `contextMenus` | Add *Convert with Penny* to the right-click menu |
| Frankfurter host access | Fetch public ECB exchange rates |

## Credits
Exchange rates from the [Frankfurter API](https://www.frankfurter.app/) (European Central Bank data).
