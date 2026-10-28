# The report form and its sheet

Reports come in through a Google Form, with no account and no e-mail. Google writes each answer into a Google Sheet.
The owner ticks the rows to publish, and only those rows reach the page. [`OWNER_SETUP.md`](../OWNER_SETUP.md) has the
clicks. This page is the exact specification that `scripts/build-reports.mjs` checks against.

## The form

**Title:** MihawkOS game report

**Description** (shown at the top of the form):

> Tell other players how a Windows game ran on MihawkOS. You need no account and no e-mail.
> Every report is read before it appears on the public list.
> Write only about the game: no links and no personal details. Links and e-mail addresses are removed anyway.
> Reports are published under CC0 1.0, so anyone may reuse them.

The last line is a recommendation, and the owner decides it: without a licence line, nobody but the writer may
reuse a report.

**Questions.** The titles must be written exactly as below, because Google uses them as the sheet's column headers
and the script finds the columns by those headers. Case does not matter. The question's help text is the
"Description" line under the title.

| # | Title (exact) | Type | Required | Options and validation | Help text |
| --- | --- | --- | --- | --- | --- |
| 1 | `Game` | Short answer | yes | Response validation: Length, Maximum character count, 100 | The game's name, as on its store page. |
| 2 | `Steam AppID` | Short answer | no | Response validation: Regular expression, Matches, `^\d{1,10}$`; error text: *Only the number, like 620.* | The number in the game's Steam store link: store.steampowered.com/app/**620**/. Leave empty if it is not on Steam. Used for the game's picture; without it, the picture is found by the game's name. |
| 3 | `Launcher` | Multiple choice | no | `None`, `Steam`, `Epic Games Store`, `GOG Galaxy`, `EA app`, `Ubisoft Connect`, `Battle.net`, `Rockstar Games Launcher`, `itch.io`, `Other` (a plain option: do not turn on Google's own "Other" box, whose free text would be published only as Other anyway) | What you started the game from, if anything. *None*: you started the game's own program. |
| 4 | `MihawkOS version` | Dropdown | yes | `v4.0.0-alpha-4`, `v3.0.0-alpha-3`, `v2.0.0-alpha-2`, `v1.0.0-alpha-1`, spelled as on the Releases page. Put the newest first, and add each new release at the top. | The version you played on. MihawkOS shows it on its wallpaper and on the WebUI's Help page. |
| 5 | `Console` | Multiple choice | yes | `PS5`, `PS5 Slim`, `PS5 Digital Edition`, `PS5 Pro` | Digital Edition: any PS5 without a disc drive. |
| 6 | `Firmware` | Short answer | yes | Response validation: Regular expression, Matches, `^\d{1,2}\.\d{2}$`; error text: *Like 10.01 or 13.40.* | Settings > System > System Software > Console Information. |
| 7 | `Rating` | Multiple choice | yes | `Perfect`, `Playable`, `Runs with issues`, `Boots only`, `Broken` | *Perfect*: plays start to end as on a PC, nothing to change. *Playable*: plays to the end, small problems or a setting to change. *Runs with issues*: you can play, but slowdowns, missing sound or video, or crashes get in the way. *Boots only*: reaches its menu or first scene, but you cannot really play. *Broken*: does not start, or stops before you see anything. |
| 8 | `FPS` | Short answer | no | Response validation: Number, Between, 1 and 500 | About how many frames per second, if you know. |
| 9 | `Settings` | Short answer | no | Response validation: Length, Maximum character count, 300 | The game's settings or MihawkOS options you changed, like 120 Hz, Game Mode or the controller type. |
| 10 | `Notes` | Paragraph | no | Response validation: Length, Maximum character count, 1000 | What worked and what did not. |
| 11 | `Nickname` | Short answer | no | Response validation: Length, Maximum character count, 32 | Shown with your report. Leave it empty to stay anonymous. Not your e-mail. |

**Settings** (the form's Settings tab):

- Responses > **Collect email addresses: Do not collect**.
- Responses > **Limit to 1 response: off** (on, it makes people sign in).
- Responses > **Allow response editing: off**.
- Presentation > Confirmation message: *Thank you. Your report will appear on the list once it has been read, usually within a day.*
- When you publish the form, choose **Responders: Anyone with the link**.

## The sheet

Google names the responses tab `Form Responses 1`, with the columns `Timestamp`, then the ten questions in order
(A to L). The owner adds two things:

1. **The `Approved` column (M).** Type `Approved` in M1. Google now keeps form responses in a table, which takes the
   new column in; open its header's ▾ menu > Edit column type > Checkbox. (In a sheet without a table: select M2
   down to the end and choose Insert > Checkbox.) A ticked box publishes the row; an empty one keeps it private.
2. **A tab named `Published`**, which holds only the ticked rows. Only this tab is published to the web, so a row
   nobody has approved never leaves Google.
   - A1: `={'Form Responses 1'!A1:M1}`
   - A2: `=FILTER('Form Responses 1'!A:M, 'Form Responses 1'!M:M=TRUE)`

   Whole columns, not `A2:M`: Google inserts a new response as a row, which shifts a range that starts at row 2
   past the row just added (the first approved report, 2026-10-28, stayed hidden that way). The header row is left
   out anyway, as its Approved cell holds text. While nothing is ticked, A2 shows `#N/A`; the script reads that row
   as not approved and leaves it out.

**Dates.** The script reads `yyyy-mm-dd` or the US `m/d/yyyy`. A sheet whose locale is United States (File >
Settings > Locale) writes the US form, and needs nothing more; the sheet made on 2026-10-27 is one. In any other
locale, select column A on both tabs and choose Format > Number > Custom date and time, then type
`yyyy-mm-dd hh:mm:ss`: `27/10/2026` cannot be told apart from a US date. Only the day is published.

**What the script checks.** It reads the published CSV and keeps a row only if `Approved` is ticked and the
required fields are valid:

| Field | Rule | If it fails |
| --- | --- | --- |
| Timestamp | a real day, 2026 or later | row left out |
| Game | plain text, 1 to 100 characters after cleaning | row left out |
| MihawkOS version | `v1.2.3` or `v1.2.3-alpha-4` | row left out |
| Console | one of the four options | row left out |
| Firmware | `NN.NN`; `10.1` from a number cell becomes `10.10` | row left out |
| Rating | one of the five options | row left out |
| Steam AppID | digits only (a store link gives its number); if empty, found by name (below) | left empty |
| Launcher | one of the ten options, matched as written; any other answer becomes `Other` | left empty |
| FPS | a whole number from 1 to 500 | left empty |
| Settings, Notes, Nickname | plain text, at most 300, 1000 and 32 characters | cut to the limit, with … |

"Cleaning" removes HTML tags, scripts and styles, links (web addresses, `www.` and common domain names), e-mail
addresses, control characters and invisible characters (zero-width and direction marks). It also collapses spaces.
Notes keep their line breaks. The page then shows every value as text: nothing in a report becomes a link, markup or
style. A sheet without one of the thirteen headers stops the run with the header's name, and the page keeps its last
data.

## Game pictures

The page shows a game's Steam header picture (`shared.steamstatic.com/store_item_assets/steam/apps/<AppID>/header.jpg`)
and a coloured letter when there is none. A report's own Steam AppID comes first. Without one, the run asks
Steam's public store search (`store.steampowered.com/api/storesearch`) for the game's name and takes the AppID only
when a result has exactly that name (case, accents, ™ and punctuation aside), so a near match never shows another
game's art. Found AppIDs are kept in `data/appids.json`, so a day Steam does not answer changes nothing, and each name
is asked once. At most 50 new names are asked per run; the rest wait for the next. A wrong match is fixed by
deleting its line from `data/appids.json` and asking reporters for the AppID. Games not on Steam keep their letter.

## Tally instead of Google Forms

Tally's free plan also takes answers without an account and can write them into a Google Sheet, so it is about as
simple. Two differences: Tally adds its own columns (submission id, respondent id, submitted at), and its timestamp
column has another name. The `Published` tab then needs its first row typed by hand with the thirteen titles above,
and FILTER picks Tally's columns in that order. Google Forms needs neither step, so it stays the default.

## A future hook: "Report this game" from the WebUI

MihawkOS's WebUI (port 6767) already knows the console, its firmware, MihawkOS's version, the game's name, often its
Steam AppID, and sometimes its frame rate. A button on a game's page could open the form with those answers filled
in. This is Google Forms' pre-filled link. Nothing below is built yet; it is the format to build against.

**Getting the field ids.** In the form editor, open ⋮ (More) > **Get pre-filled link**. Fill in the seven fields with
recognisable values (Game `GAME`, Steam AppID `123`, a launcher, a version, `PS5 Pro`, Firmware `10.01`, FPS `60`) and choose
**Get link > Copy link**. The link names each question by its `entry.<number>` id:

```text
https://docs.google.com/forms/d/e/<FORM_ID>/viewform?usp=pp_url
  &entry.<GAME_ID>=GAME
  &entry.<APPID_ID>=123
  &entry.<LAUNCHER_ID>=Steam
  &entry.<VERSION_ID>=v4.0.0-alpha-4
  &entry.<CONSOLE_ID>=PS5+Pro
  &entry.<FIRMWARE_ID>=10.01
  &entry.<FPS_ID>=60
```

(one line in practice). The ids of the form created on 2026-10-27, read from its pre-fill page:

| Field | Entry id |
| --- | --- |
| Game | `entry.360954` |
| Steam AppID | `entry.1142179574` |
| Launcher | `entry.346947463` |
| MihawkOS version | `entry.1455217213` |
| Console | `entry.675106169` |
| Firmware | `entry.412913000` |
| Rating | `entry.1075560426` |
| FPS | `entry.608722964` |
| Settings | `entry.657180200` |
| Notes | `entry.763652494` |
| Nickname | `entry.1272920297` |

An id stays the same while its question exists; a question deleted and made again gets a new one.

**Rules for the values.** Each value is URL-encoded (`URLSearchParams` does it). The launcher, the version and the console must
match an option exactly, or Google leaves the question empty. The WebUI should send `Steam` for a game it started through Steam, and `PS5 Pro` or `PS5` as it knows,
and the player corrects Slim or Digital Edition. The rating, settings, notes and nickname are left for the player:
a report is their judgement, not the console's.

**In the WebUI** (`webui/app.js`), as a sketch:

```js
const REPORT_FORM = 'https://docs.google.com/forms/d/e/<FORM_ID>/viewform';
const REPORT_FIELDS = { game: 'entry.360954', appid: 'entry.1142179574', launcher: 'entry.346947463', version: 'entry.1455217213',
  console: 'entry.675106169', firmware: 'entry.412913000', fps: 'entry.608722964' };

function reportLink(values) { // { game, appid, launcher, version, console, firmware, fps }
  const query = new URLSearchParams({ usp: 'pp_url' });
  for (const [field, entry] of Object.entries(REPORT_FIELDS)) {
    if (values[field] != null && values[field] !== '') query.set(entry, String(values[field]));
  }
  return `${REPORT_FORM}?${query}`;
}
// <a class="button" target="_blank" rel="noopener noreferrer" href={reportLink(...)}>Report this game</a>
```

The link opens in a new tab on the player's phone or computer, which needs the internet, not the console. The WebUI's
Content-Security-Policy does not restrict where a link goes, so the policy needs no change. The link carries only the
seven values above, never the console's address or anything from its logs.
