"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TestimonialSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: ["video", "text"],
        default: "text",
    },
    file: {
        type: String,
        default: null,
    },
    text: {
        type: String,
        default: null,
    },
    rating: {
        type: String,
        default: null,
    },
    user: {
        name: String,
        email: String,
        image: String,
    },
    customFields: [
        {
            id: String,
            name: String,
            value: String,
            type: {
                type: String,
                enum: ["text", "number", "url"],
            },
        },
    ],
    showcase: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Showcase",
        required: true,
    },
}, { timestamps: { createdAt: "createdAt" } });
const Testimonial = (0, mongoose_1.model)("Testimonial", TestimonialSchema);
exports.default = Testimonial;
//# sourceMappingURL=testimonial.schema.js.map