"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = void 0;
const generateSlug = (value) => value
    .toLowerCase()
    .replace(/[^\p{L}\d\s]+/gu, "")
    .replaceAll(" ", "-");
exports.generateSlug = generateSlug;
//# sourceMappingURL=helper-functions.js.map