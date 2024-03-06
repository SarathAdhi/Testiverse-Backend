"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteManyTestimonials = exports.getAllTestimonials = exports.createTestimonial = exports.getAllShowcaseTestimonials = exports.getTestimonialFromLinkedin = exports.getTestimonial = void 0;
const cheerio_1 = require("cheerio");
const formidable_1 = __importDefault(require("formidable"));
const fs_1 = require("fs");
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const firebase_helper_functions_1 = require("../lib/firebase-helper-functions");
const showcase_schema_1 = __importDefault(require("../schemas/showcase.schema"));
const testimonial_schema_1 = __importDefault(require("../schemas/testimonial.schema"));
const response_handler_1 = require("../utils/response-handler");
const testimonialSchema = zod_1.z
    .object({
    type: zod_1.z.enum(["video", "text"]),
    file: zod_1.z.string().optional(),
    text: zod_1.z.string().optional(),
    rating: zod_1.z.number().optional(),
    customFields: zod_1.z.array(zod_1.z
        .object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        value: zod_1.z.string(),
        type: zod_1.z.enum(["text", "number", "url"]),
    })
        .optional()),
    user: zod_1.z
        .object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
    })
        .optional(),
    showcase: zod_1.z.string(),
})
    .refine((data) => (data.type === "video" ? true : data.text !== undefined), {
    message: "Text field is required for non-video testimonials.",
})
    .refine((data) => data.type === "video"
    ? true
    : (data.user?.email && data.user.name) !== undefined, {
    message: "User details is required.",
});
const getTestimonial = async (req, res, next) => {
    const testimonial_id = req.params?.id;
    try {
        const testimonial = await testimonial_schema_1.default.findOne({
            _id: testimonial_id,
        });
        if (!testimonial)
            return (0, response_handler_1.responseHandler)(res).error(400, "Testimonial not found or have been deleted.");
        (0, response_handler_1.responseHandler)(res).success(200, "", testimonial);
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.getTestimonial = getTestimonial;
const getTestimonialFromLinkedin = async (req, res, next) => {
    const linkedinPostUrl = req.query?.url;
    console.log(linkedinPostUrl);
    const response = await fetch(linkedinPostUrl);
    const result = await response.text();
    const $ = (0, cheerio_1.load)(result);
    try {
        const description = $("p.attributed-text-segment-list__content")
            .first()
            .text()
            .trim();
        const images = $("li.bg-color-background-container-tint img");
        console.log(`Title:`, images);
        // const testimonial = await Testimonial.findOne({
        //   _id: testimonial_id,
        // });
        // if (!testimonial)
        //   return responseHandler(res).error(
        //     400,
        //     "Testimonial not found or have been deleted."
        //   );
        (0, response_handler_1.responseHandler)(res).success(200, "");
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.getTestimonialFromLinkedin = getTestimonialFromLinkedin;
const getAllShowcaseTestimonials = async (req, res, next) => {
    const showcase_slug = req.params?.slug;
    const testimonial_type = req.query?.type;
    const search_query = req.query?.search;
    try {
        const showcase = await showcase_schema_1.default.findOne({
            slug: showcase_slug,
        });
        if (!showcase)
            return (0, response_handler_1.responseHandler)(res).error(400, "Showcase not found or have been deleted.");
        const showcase_id = showcase._id;
        if (!testimonial_type || testimonial_type === "all") {
            const testimonials = await testimonial_schema_1.default.find({
                showcase: showcase_id,
            }).sort({ createdAt: -1 });
            return (0, response_handler_1.responseHandler)(res).success(200, "", testimonials);
        }
        //
        else if (testimonial_type === "video" || testimonial_type === "text") {
            const testimonials = await testimonial_schema_1.default.find({
                showcase: showcase_id,
                type: testimonial_type,
            }).sort({ createdAt: -1 });
            return (0, response_handler_1.responseHandler)(res).success(200, "", testimonials);
        }
        else {
            return (0, response_handler_1.responseHandler)(res).error(422, `Type ${testimonial_type} does not exist`);
        }
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.getAllShowcaseTestimonials = getAllShowcaseTestimonials;
const createTestimonial = async (req, res, next) => {
    try {
        const form = (0, formidable_1.default)({});
        form.parse(req, async (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }
            const jsonString = fields?.json?.[0];
            if (!jsonString)
                return (0, response_handler_1.responseHandler)(res).error(400, "JSON body not found");
            const jsonData = JSON.parse(jsonString);
            const showcase = await showcase_schema_1.default.findById(jsonData.showcase);
            if (!showcase)
                return (0, response_handler_1.responseHandler)(res).error(400, "Showcase not found or have been deleted.");
            const data = testimonialSchema.parse(jsonData);
            const testimonial = new testimonial_schema_1.default({ ...data });
            const result = await testimonial.save();
            const id = showcase._id;
            if (data.type === "video") {
                if (!files.video)
                    return (0, response_handler_1.responseHandler)(res).error(404, "video not found");
                const video = files.video[0];
                const fileBlob = (0, fs_1.readFileSync)(video.filepath);
                const filePath = `/${id}/testimonials/videos/${testimonial._id}`;
                await (0, firebase_helper_functions_1.fileUpload)(filePath, fileBlob, {
                    contentType: video.mimetype,
                });
                const fileData = await (0, firebase_helper_functions_1.getFile)(filePath);
                const videoUrl = fileData.split("&")[0];
                testimonial.file = videoUrl;
                await testimonial.save();
            }
            if (files?.user_image) {
                const userImage = files.user_image[0];
                const fileBlob = (0, fs_1.readFileSync)(userImage.filepath);
                const filePath = `/${id}/testimonials/users/${testimonial._id}-` + data.user?.name;
                await (0, firebase_helper_functions_1.fileUpload)(filePath, fileBlob, {
                    contentType: userImage.mimetype,
                });
                const fileData = await (0, firebase_helper_functions_1.getFile)(filePath);
                const userImageUrl = fileData.split("&")[0];
                testimonial.user = {
                    ...data.user,
                    image: userImageUrl,
                };
                await testimonial.save();
            }
            return (0, response_handler_1.responseHandler)(res).success(201, "Your testimonial uploaded successfully", result);
        });
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.createTestimonial = createTestimonial;
const getAllTestimonials = async (req, res, next) => {
    const user = req.user;
    const testimonial_type = req.query?.type;
    try {
        const showcases = await showcase_schema_1.default.find({
            user: user._id,
        });
        const showcases_id = showcases.map(({ _id }) => _id);
        if (!testimonial_type || testimonial_type === "all") {
            const testimonials = await testimonial_schema_1.default.find({
                showcase: { $in: showcases_id },
            }).sort({ createdAt: -1 });
            return (0, response_handler_1.responseHandler)(res).success(200, "", testimonials);
        }
        //
        else if (testimonial_type === "video" || testimonial_type === "text") {
            const testimonials = await testimonial_schema_1.default.find({
                showcase: { $in: showcases_id },
                type: testimonial_type,
            }).sort({ createdAt: -1 });
            return (0, response_handler_1.responseHandler)(res).success(200, "", testimonials);
        }
        else {
            return (0, response_handler_1.responseHandler)(res).error(422, `Type ${testimonial_type} does not exist`);
        }
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.getAllTestimonials = getAllTestimonials;
const deleteManyTestimonials = async (req, res, next) => {
    const user = req.user;
    let testimonialIds = req.body;
    const mongoTestimonialIds = testimonialIds.map((e) => new mongoose_1.Types.ObjectId(e));
    console.log(testimonialIds);
    try {
        const testimonials = await testimonial_schema_1.default.aggregate([
            {
                $match: {
                    _id: { $in: mongoTestimonialIds },
                },
            },
            {
                $lookup: {
                    from: "showcases",
                    localField: "showcase",
                    foreignField: "_id",
                    as: "showcaseInfo",
                },
            },
            {
                $match: {
                    "showcaseInfo.user": user._id,
                },
            },
        ]);
        for (let i = 0; i < testimonials.length; i++) {
            const testimonial_id = testimonials[i]?._id;
            const showcase_id = testimonials[i]?.showcase;
            const userName = testimonials[i]?.user?.name;
            const isTypeVideo = testimonials[i]?.type === "video";
            if (isTypeVideo) {
                const videoPath = `/${showcase_id}/testimonials/videos/${testimonial_id}`;
                await (0, firebase_helper_functions_1.deleteFile)(videoPath);
            }
            const userImagePath = `/${showcase_id}/testimonials/users/${testimonial_id}-${userName}`;
            await (0, firebase_helper_functions_1.deleteFile)(userImagePath);
        }
        const allUserShowcaseTestimonial = testimonials?.map((testimonial) => testimonial?._id);
        await testimonial_schema_1.default.deleteMany({
            _id: { $in: allUserShowcaseTestimonial },
        });
        return (0, response_handler_1.responseHandler)(res).success(200, allUserShowcaseTestimonial?.length === 1
            ? "Testimonial deleted successfully"
            : "Selected testimonials deleted successfully");
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.deleteManyTestimonials = deleteManyTestimonials;
//# sourceMappingURL=testimonial.controllers.js.map