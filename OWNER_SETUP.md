# Owner setup

The steps to put the compatibility list online, in order. They take about half an hour.

**Done on 2026-10-27**, in your Google account, through the browser pane: step 1 (the form "MihawkOS game report",
all eleven questions, checks and settings, published to anyone with the link:
https://docs.google.com/forms/d/e/1FAIpQLSeju5lQnO8gcxxU9KVjUjIqPN70zaKz_oYwSkSxlaODLEw8Ng/viewform) and step 2 (the sheet "MihawkOS game report (Responses)", with the Approved checkbox column and the `Published`
tab). Step 3 was done on 2026-10-28 in the owner's own browser (Google asks a confirm popup that the desktop app's
browser pane cannot show); the raw responses tab was checked to answer with a sign-in page, and the `Published` CSV
to give the header and nothing approved. Steps 4 and 5 were done on 2026-10-28: the repository is public, the
secret and variable are set, Pages deploys from Actions, and the first successful run published the site at
https://mihawk-99.github.io/MihawkOS-Compatibility/. What remains is moderating (below). The `FORM_URL` of step 4.3 is
the form link above.

You need a Google account (a personal one is fine) and the `mihawk-99` GitHub account.

## 1. Create the form

1. Open [forms.google.com](https://forms.google.com) and choose **Blank form**.
2. Click **Untitled form** and type `MihawkOS game report`. Click under it and paste the description from
   [docs/FORM.md](docs/FORM.md#the-form). Keep or drop the CC0 line: it is your decision.
3. Add the eleven questions from the table in [docs/FORM.md](docs/FORM.md#the-form), in order:
   - Click **⊕ Add question**, type the title **exactly** as in the table, and choose the type in the menu on the
     right (Short answer, Paragraph, Multiple choice, Dropdown).
   - For a choice question, type each option on its own line.
   - Turn **Required** on for Game, MihawkOS version, Console, Firmware and Rating.
   - For the help text: ⋮ (bottom right of the question) > **Description**.
   - For the checks: ⋮ > **Response validation**, then the rule from the table.
4. Open the **Settings** tab:
   - **Responses > Collect email addresses: Do not collect.**
   - **Limit to 1 response: off.** **Allow response editing: off.**
   - **Presentation > Confirmation message**: paste the message from docs/FORM.md.
5. Click **Publish** (top right). Under **Responders**, choose **Anyone with the link**, then **Publish**.
6. Click **Send** > the link tab (🔗) > **Shorten URL** > **Copy**. Keep this **form link** for step 4.
7. Open the form link in a private window and check that it opens without asking you to sign in.

## 2. Link the sheet and add moderation

1. In the form, open the **Responses** tab > **Link to Sheets** > **Create a new spreadsheet** > **Create**.
   Google opens a sheet with a tab named `Form Responses 1`.
2. Send one test report through the form link, so the header row appears (Timestamp, then Game through Nickname, A
   to L).
3. Click **M1** and type `Approved`. The responses are a table, which takes the new column in: open the ▾ on its
   header > **Edit column type** > **Checkbox**.
4. Check **File > Settings > Locale**. If it is **United States**, skip this step. Otherwise select column **A**,
   choose **Format > Number > Custom date and time**, delete what is in the box, type `yyyy-mm-dd hh:mm:ss` and
   choose **Apply**.
5. Add the published tab: click **+** (bottom left) and rename the new tab (double-click its name) to `Published`.
   - In **A1** paste `={'Form Responses 1'!A1:M1}`
   - In **A2** paste `=FILTER('Form Responses 1'!A:M, 'Form Responses 1'!M:M=TRUE)`. Keep the whole columns
     (`A:M`): a range starting at row 2 shifts down each time Google adds a response, and misses it.
   - If you formatted dates in step 4, format this tab's column **A** the same way.
   - A2 shows `#N/A` until a box is ticked. That is expected.
6. Tick your test report's box in `Form Responses 1` and check that it appears in `Published`. Then untick it, or
   delete its row.

## 3. Publish only the `Published` tab as CSV

1. In the sheet, choose **File > Share > Publish to web**.
2. On the **Link** tab, change **Entire document** to **Published**, and **Web page** to **Comma-separated values
   (.csv)**.
3. Open **Published content and settings**. Check that **Automatically republish when changes are made** is ticked,
   and that only **Published** is chosen there too.
4. Click **Publish** > **OK**, and copy the link. It begins with `https://docs.google.com/spreadsheets/d/e/` and
   ends with `output=csv`. This is the **CSV link**.
5. Open the CSV link in a private window. It should download or show only the header row and ticked rows. Google
   can take up to five minutes to show a change.

Only the `Published` tab is public. The responses tab, with the rows nobody has approved, stays private.

**Check it.** What is public is decided by **Published content & settings**, not by the **Link** row above it,
which only picks which link to show. If the lower button says **Entire document**, the raw responses are public too:
a link without `gid=` then serves the first tab, Form Responses 1. Open the responses tab's own CSV link (its `gid`
is in the sheet's address bar) in a private window: it must show a Google sign-in page, not CSV. Google can take a
few minutes to apply a change.

## 4. Create the GitHub repository and push

1. Open [github.com/new](https://github.com/new). Owner: `mihawk-99`. Name: `MihawkOS-Compatibility`. **Public**.
   Do not add a README, .gitignore or licence: this repository has them. Click **Create repository**.
2. In this folder, run:

   ```bash
   git remote add origin https://github.com/mihawk-99/MihawkOS-Compatibility.git
   git push -u origin main
   ```

3. In the repository, open **Settings > Secrets and variables > Actions**:
   - **Secrets** tab > **New repository secret**. Name `SHEET_CSV_URL`, value the CSV link. A secret keeps the link
     out of the page and the logs. A variable of the same name also works, but anyone could then read the link.
   - **Variables** tab > **New repository variable**. Name `FORM_URL`, value the form link. This turns on the page's
     **Report a game** buttons. The page accepts only `https://docs.google.com/forms/`, `https://forms.gle/` or
     `https://tally.so/` links.
4. **Settings > Pages > Build and deployment > Source: GitHub Actions.**
5. **Settings > Actions > General**: keep **Allow all actions** (or allow `actions/*`), and keep the default
   workflow permissions. The workflow asks for what each job needs.
6. If you protect `main` later, let `github-actions[bot]` push to it, or the data commits will fail.

## 5. First run

1. Open the **Actions** tab > **Publish** > **Run workflow** > `main` > **Run workflow**.
2. Wait for its three jobs (about two minutes). **Update reports** prints only counts, for example
   `rows 3, published 1, left out {"not approved":2}`. It never prints anyone's words.
3. The **Publish to GitHub Pages** job shows the address:
   `https://mihawk-99.github.io/MihawkOS-Compatibility/`.
4. Without any ticked rows, the list says **No reports yet**. The made-up examples are gone as soon as the sheet is
   read once.

After that it runs every 15 minutes (GitHub may start a scheduled run a few minutes late), after every push to
`main`, and whenever you press **Run workflow**. A scheduled run that finds no change stops after reading the sheet.

## Moderating

- Open the sheet. New reports arrive at the bottom of `Form Responses 1`.
- Read each one. Tick **Approved** to publish it. Leave the box empty to keep it private, or delete the row.
- Approved reports appear at the next run. Press **Run workflow** to publish them at once.
- To take a report down, untick it: the next run removes it from the page. Older versions of `data/reports.json`
  stay in the repository's history. So never tick a report that holds personal details. Fix its cell instead, or
  delete it.
- To correct a typo, edit the cell in `Form Responses 1`. The `Published` tab follows.
- Before ticking, check that the report is about one game, and that the console, firmware and version look real.
  Reject requests for games, keys or firmware, and anything else MihawkOS's README turns away.

## If something goes wrong

| The run says | Do this |
| --- | --- |
| `SHEET_CSV_URL is not set` | Step 4.3: the secret is missing or misspelled. |
| `the sheet has no "…" column` | A question title differs from docs/FORM.md. Rename the question in the form; Google renames the column. |
| `the link gave a web page, not CSV` | Step 3.2: the link was published as a web page, not CSV. |
| `SHEET_CSV_URL must be a https://docs.google.com/ published CSV link` | The secret holds another kind of link. |
| `the sheet answered HTTP 4xx` | Publish to web was stopped, or the link changed. Repeat step 3. |
| Push rejected | `main` is protected. Step 4.6. |

If you add a question to the form later, Google adds a column for it in `Form Responses 1`. Check where it went and
where **Approved** is now, and update the two formulas in `Published` so they still cover every column and test the
Approved one. A column the script does not know is ignored. To show it on the page, add it to `src/fields.js`,
the script and the page.
