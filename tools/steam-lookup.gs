// SPDX-License-Identifier: GPL-3.0-or-later
// MihawkOS Compatibility: the Steam lookup the report page asks while a player types, since Steam does not answer
// other websites' pages. A Google Apps Script web app (OWNER_SETUP.md, "The Steam lookup"):
//
//   GET ?q=<game name>  ->  { "games": [ { "id": "413150", "name": "Stardew Valley", "capsule": "<hash or empty>" } ] }
//   GET ?id=<AppID>     ->  { "game": { "id": "413150", "name": "Stardew Valley", "header": "<hash or empty>" } }
//
// Only a game name or an AppID passes through; nothing is stored but a 6-hour cache of Steam's answers, which also
// keeps the lookups well inside Google's daily quota.

function doGet(e) {
  var p = (e && e.parameter) || {};
  var body;
  try {
    if (/^\d{1,10}$/.test(p.id || '')) body = { game: details(p.id) };
    else if (String(p.q || '').trim().length >= 2) body = { games: search(String(p.q).trim().slice(0, 100)) };
    else body = { error: 'Ask with ?q=<name> or ?id=<AppID>.' };
  } catch (err) {
    body = { error: 'Steam did not answer.' };
  }
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function cached(key, make) {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  var value = make();
  cache.put(key, JSON.stringify(value), 21600);
  return value;
}

// Newer games keep their pictures under a content hash: .../apps/<id>/<hash>/<file>.
function hashOf(url, id, file) {
  var m = new RegExp('/apps/' + id + '/([0-9a-f]{40})/' + file).exec(String(url || ''));
  return m ? m[1] : '';
}

function steamJson(url) {
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
  return JSON.parse(res.getContentText());
}

function search(q) {
  return cached('q:' + q.toLowerCase(), function () {
    var body = steamJson('https://store.steampowered.com/api/storesearch/?l=english&cc=US&term=' + encodeURIComponent(q));
    return (body.items || []).slice(0, 8).map(function (i) {
      return { id: String(i.id), name: String(i.name).slice(0, 100), capsule: hashOf(i.tiny_image, i.id, 'capsule_231x87\\.jpg') };
    });
  });
}

function details(id) {
  return cached('id:' + id, function () {
    var data = ((steamJson('https://store.steampowered.com/api/appdetails?filters=basic&appids=' + id) || {})[id] || {}).data;
    if (!data) return null;
    return { id: id, name: String(data.name || '').slice(0, 100), header: hashOf(data.header_image, id, 'header\\.jpg') };
  });
}
