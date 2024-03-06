"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilesInFolder = exports.getFile = exports.deleteFile = exports.fileUpload = void 0;
const storage_1 = require("firebase/storage");
const firebase_1 = require("./firebase");
const fileUpload = async (fileName, file, metadata) => {
    const storageRef = (0, storage_1.ref)(firebase_1.storage, fileName);
    return await (0, storage_1.uploadBytes)(storageRef, file, metadata);
};
exports.fileUpload = fileUpload;
const deleteFile = async (filePath) => {
    const storageRef = (0, storage_1.ref)(firebase_1.storage, filePath);
    try {
        await (0, storage_1.deleteObject)(storageRef);
        console.log("File deleted");
    }
    catch (error) {
        console.log({ error });
    }
};
exports.deleteFile = deleteFile;
const getFile = async (filePath) => {
    const fileref = (0, storage_1.ref)(firebase_1.storage, filePath);
    return await (0, storage_1.getDownloadURL)(fileref).then((url) => url);
};
exports.getFile = getFile;
const getFilesInFolder = async (filePath, blob = false) => {
    const folderRef = (0, storage_1.ref)(firebase_1.storage, filePath);
    const folder = await (0, storage_1.listAll)(folderRef);
    let files;
    // if (blob) files = folder.items.map((itemRef) => getBlob(itemRef));
    // else files = folder.items.map((itemRef) => getDownloadURL(itemRef));
    files = folder.items.map((itemRef) => (0, storage_1.getDownloadURL)(itemRef));
    return Promise.all(files);
};
exports.getFilesInFolder = getFilesInFolder;
//# sourceMappingURL=firebase-helper-functions.js.map