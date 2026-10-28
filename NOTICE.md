# Notice

MihawkOS Compatibility is by [Mihawk](https://github.com/mihawk-99). Its code is GPL-3.0-or-later ([LICENSE](LICENSE)).
The files below come from elsewhere, or keep their own licence.

## From MihawkOS (PS5_MihawkOS)

Taken from MihawkOS's tree at commit `77db136` (its `main`, 2026-10-27), by the same author. The page is meant to look
like the same product as MihawkOS's WebUI.

| File here | Origin | Licence | Changes |
| --- | --- | --- | --- |
| `src/app.css` | `webui/app.css`: the WebUI's Frutiger Aero look (sky and grass, palette, glass panels, glossy pills, rising bubbles, night colours) | GPL-3.0-or-later | Adapted: the WebUI's tokens, background, bubbles, glass, bar, buttons and fields kept; this page's layout, rating badges and a starry night sky added. Badge and button colours made darker so white text keeps 4.5:1 under the gloss. |
| `src/assets/banner-day.svg`, `src/assets/banner-night.svg` | `docs/media/readme/banner-{day,night}.svg`: the README's banner, drawing the Mihawk mark | LGPL-2.1-or-later (SPDX line kept in each file) | Its SMIL `<animate>` and `<animateTransform>` elements removed, so the picture is still and reduced motion holds. Otherwise unchanged. |
| `src/assets/divider-day.svg`, `src/assets/divider-night.svg` | `docs/media/readme/divider-{day,night}.svg` | LGPL-2.1-or-later (SPDX line kept) | Unchanged. |
| `public/mark.svg` | `themes/windows11/start.svg`: the Mihawk OS mark | LGPL-2.1-or-later (SPDX line kept) | Unchanged. |
| `public/licenses/LGPL-2.1.txt` | `themes/windows11/COPYING.LIB` | the licence text | Unchanged. |

## Inter

`src/assets/fonts/Inter-Regular.ttf` and `Inter-SemiBold.ttf` are **Inter** by The Inter Project Authors
([rsms/inter](https://github.com/rsms/inter)), the face MihawkOS's launcher and WebUI use. They are copied unchanged
from the MihawkOS v4.0.0-alpha-4 title (`assets/hui/fonts/`):

| File | SHA-256 |
| --- | --- |
| `Inter-Regular.ttf` | `40d692fce188e4471e2b3cba937be967878f631ad3ebbbdcd587687c7ebe0c82` |
| `Inter-SemiBold.ttf` | `78a843fade9d4612a5567302fb595b56976eb5fcebf4fea5a5912d638bafcde3` |

SIL Open Font License 1.1: [`public/licenses/OFL-1.1-Inter.txt`](public/licenses/OFL-1.1-Inter.txt), the copy shipped
with that title. The licence is published with the site.

## npm packages

| Package | Version | Licence | Where |
| --- | --- | --- | --- |
| react, react-dom (and their scheduler) | 19.2.8 | MIT, Meta Platforms, Inc. and affiliates | bundled into the page's script; the notice is [`public/licenses/react-MIT.txt`](public/licenses/react-MIT.txt), published with the site |
| vite | 8.3.4 | MIT | build tool only, not in the published files |

Exact versions and hashes are in `package-lock.json`.

## GitHub Actions

The workflow uses `actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact` and `actions/deploy-pages`
(MIT, GitHub), each pinned to a commit in `.github/workflows/publish.yml`.

## Reports and pictures

- **Reports** in `data/reports.json` are written by players through the form. They are published under the licence
  the form states (CC0 1.0 is recommended in `docs/FORM.md`; the maintainer decides). The rows in the repository
  today are made-up examples, flagged `"examples": true`.
- **Game pictures** are not in this repository. Each visitor's browser loads a game's Steam header image from
  `shared.steamstatic.com`, by the AppID a report gives. The artwork belongs to the game's publisher.
- **Names.** PlayStation and PS5 are trademarks of Sony Interactive Entertainment; Steam is a trademark of Valve
  Corporation. This project is not affiliated with either. Names are used only to say which console or store a
  report means.
