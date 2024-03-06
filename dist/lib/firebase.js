"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
const my_envs_1 = require("../utils/my-envs");
const firebaseConfig = {
    apiKey: my_envs_1.FIREBASE_API_KEY,
    authDomain: "testiverse-website.firebaseapp.com",
    projectId: "testiverse-website",
    storageBucket: "testiverse-website.appspot.com",
    messagingSenderId: "1000359046680",
    appId: my_envs_1.FIREBASE_APP_ID,
    measurementId: "G-J2GXBM1MEN",
};
// Initialize Firebase
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.storage = (0, storage_1.getStorage)(app);
//# sourceMappingURL=firebase.js.map