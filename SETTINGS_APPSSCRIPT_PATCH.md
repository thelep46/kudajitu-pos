# Final Settings V2 Apps Script patch

`settings_v2.gs` and `settings_bridge.gs` are ready. Upload both to the same Apps Script project.

The existing `code.gs` must keep its current `doGet()` and `doPost()` logic. Add only these routes.

## 1. Inside doGet(), after `requireAuth(p.token);`

```javascript
if (p.action === 'getSettings') return jsonResponse({ok:true,data:settingsApiGet_(p)});
```

## 2. Inside doPost(), after `requireAuth(b.token);` and before the final `else return ...`

```javascript
else if (b.action === 'getSettings') d = settingsApiGet_(b);
else if (b.action === 'saveSettings') d = settingsApiSave_(b);
else if (b.action === 'saveCategory') d = settingsApiSaveCategory_(b);
else if (b.action === 'deleteCategory') d = settingsApiDeleteCategory_(b);
```

## 3. Apps Script files

Upload:
- `settings_v2.gs`
- `settings_bridge.gs`

Do **not** create another `doGet()` or `doPost()` function.

## 4. First setup

After saving all Apps Script files, run:

```javascript
settingsV2Setup()
```

Run it once. It creates/rebuilds the `Settings` sheet with the default configuration.

## 5. Deploy

Deploy a new version of the existing Web App. Keep the same Web App URL because `app.js` already points to the current deployment.

Then hard-refresh KUDAJITU with `Ctrl + Shift + R`.

## 6. Test

1. Open `Pengaturan`.
2. Add `Kopi & Nongkrong`.
3. Confirm it appears in `Settings`.
4. Open `Keuangan Pribadi`.
5. Confirm `Kopi & Nongkrong` appears in the category dropdown.
6. Change POS or receipt settings and reload the page.
7. Confirm the values remain after reload.
