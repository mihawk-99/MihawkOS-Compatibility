# Notice

MihawkOS Compatibility is by [Mihawk](https://github.com/mihawk-99). Its code is GPL-3.0-or-later ([LICENSE](LICENSE)).
The files below come from elsewhere, or keep their own licence.

## From MihawkOS (PS5_MihawkOS)

Taken from MihawkOS's tree at commit `77db136` (its `main`, 2026-10-27), by the same author. The page is meant to look
like the same product as MihawkOS's WebUI.

| File here | Origin | Licence | Changes |
| --- | --- | --- | --- |
| `src/app.css` | `webui/app.css`: the WebUI's Frutiger Aero look (sky and grass, palette, glass panels, glossy pills, rising bubbles, night colours) | GPL-3.0-or-later | Adapted: the WebUI's tokens, background, bubbles, glass, bar, buttons and fields kept; this page's layout, rating badges, a starry night sky and a Day/Night slider added; night is the default, set by the slider instead of the system theme. Badge and button colours made darker so white text keeps 4.5:1 under the gloss. |
| `src/assets/banner-day.svg`, `src/assets/banner-night.svg` | `docs/media/readme/banner-{day,night}.svg`: the README's banner, drawing the Mihawk mark | LGPL-2.1-or-later (SPDX line kept in each file) | Its SMIL `<animate>` and `<animateTransform>` elements removed, so the picture is still and reduced motion holds. Otherwise unchanged. |
| `src/assets/orbs/document-{day,night}.svg` | `docs/media/readme/orb-document-{day,night}.svg`: a README heading orb | LGPL-2.1-or-later (SPDX line kept) | Unchanged; the report page's title icon. |
| `src/assets/orbs/{ps5,dualsense}-{day,night}.svg` | the README orb's frame (`docs/media/readme/orb-*`) | LGPL-2.1-or-later (SPDX line kept) | New glyphs drawn here, a console and a controller: original drawings, not Sony artwork. PlayStation, PS5 and DualSense are trademarks of Sony Interactive Entertainment. |
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

## Launcher logos

`src/launchers.js` holds the logos of Steam, Epic Games, GOG.com, EA, Ubisoft, Battle.net, Rockstar Games and itch.io:
the 24x24 SVG paths of [Simple Icons](https://simpleicons.org) 16.35.0 (npm `simple-icons`, tarball SHA-256
`20ebead4f6bc93464812a5e260d19fc4d84772e5eeff69a6fbea263ca2441c5f`), copied unchanged from its `icons/*.svg`. Simple Icons
is CC0-1.0, and none of these eight icons names another licence in its data. The marks remain the trademarks of their
owners. The page draws them small beside the launcher's name, on a pill in the brand's colour (Simple Icons' hex where
it is not black: GOG.com, Rockstar Games, itch.io, Battle.net; otherwise the store's own dark or blue, darkened
where needed so white text stays readable), only to say which launcher a report used, as Simple Icons' disclaimer asks; it does not suggest that any of them endorses this project. Brand guidelines
named in Simple Icons' data: [Steam](https://partner.steamgames.com/doc/marketing/branding),
[Epic Games](https://dev.epicgames.com/docs/services/en-US/EpicAccountServices/DesignGuidelines/index.html#epicgamesbrandguidelines),
[itch.io](https://itch.io/press-kit).

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
  `shared.steamstatic.com`, by the AppID a report gives or the one Steam's store search returns for the game's exact
  name (`data/appids.json`). The artwork belongs to the game's publisher.
- **Names.** PlayStation and PS5 are trademarks of Sony Interactive Entertainment; Steam is a trademark of Valve
  Corporation; the launchers' names and logos are their owners' trademarks. This project is not affiliated with any
  of them. Names are used only to say which console or store a
  report means.
