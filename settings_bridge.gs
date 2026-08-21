/** KUDAJITU POS - Settings V2 API bridge.
 * Keep this file in Apps Script together with settings_v2.gs and team.gs.
 * Existing code.gs routing remains unchanged.
 */
function settingsApiGet_(p){
  const settings=settingsV2Get_();
  settings.team=teamApiGet_();
  return settings;
}

function settingsApiSave_(b){
  if(b&&b.team_operation){
    if(b.team_operation==='add_member')return teamApiSaveMember_(b);
    if(b.team_operation==='delete_member')return teamApiDeleteMember_(b);
    if(b.team_operation==='save_payment')return teamApiSavePayment_(b);
    if(b.team_operation==='refresh')return teamApiGet_();
    throw new Error('Operasi team tidak dikenali.');
  }
  return settingsV2SaveConfig(b||{});
}

function settingsApiSaveCategory_(b){return settingsV2SaveCategory(b&&b.name)}
function settingsApiDeleteCategory_(b){return settingsV2DeleteCategory(b&&b.name)}
