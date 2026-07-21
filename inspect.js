const fs = require('fs');
const lines = fs.readFileSync('C:\\PackSite\\app\\profile\\page.tsx', 'utf8').split(/\r?\n/);
console.log('Total:', lines.length);
function find(pattern) {
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return null;
}
console.log('handleUpdateProfile:', find(/handleUpdateProfile/));
console.log('handleAvatarUpload:', find(/handleAvatarUpload/));
console.log('profileTab:', find(/profileTab/));
console.log('settingsModal:', find(/settingsModal/));
console.log('formStatus:', find(/formStatus/));
console.log('apply btn:', find(/Apply/i));
console.log('bio:', find(/setBio/));
console.log('lastWasExclusive:', find(/lastWasExclusive/));
console.log('level up:', find(/levelUp|showLevelUp/));
console.log('xpUpdated:', find(/xpUpdated/));
console.log('fetchProgress:', find(/fetchProgress/));
console.log('updateXpLocally:', find(/updateXpLocally/));
console.log('triggerLevelUpToast:', find(/triggerLevelUpToast/));
