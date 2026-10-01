import { getApps, initializeApp } from "firebase-admin/app";
function initializeAppIfNecessary() {
  if (!getApps().length) {
    initializeApp();
  }
}
export {
  initializeAppIfNecessary
};
//# sourceMappingURL=helpers.mjs.map