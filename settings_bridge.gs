/** KUDAJITU POS - Settings V2 API bridge.
 * Keep this file in Apps Script together with settings_v2.gs.
 * Add the marked routing lines to doGet() and doPost() in code.gs.
 */
function settingsApiGet_(p){
  return settingsV2Get_();
}

function settingsApiSave_(b){
  return settingsV2SaveConfig(b||{});
}

function settingsApiSaveCategory_(b){
  return settingsV2SaveCategory(b&&b.name);
}

function settingsApiDeleteCategory_(b){
  return settingsV2DeleteCategory(b&&b.name);
}
