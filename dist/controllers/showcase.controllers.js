"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShowcase = exports.updateShowcase = exports.createShowcase = exports.getShowcase = exports.getMyShowcase = exports.getMyShowcases = void 0;
const formidable_1 = __importDefault(require("formidable"));
const fs_1 = require("fs");
const zod_1 = require("zod");
const firebase_helper_functions_1 = require("../lib/firebase-helper-functions");
const showcase_schema_1 = __importDefault(require("../schemas/showcase.schema"));
const testimonial_schema_1 = __importDefault(require("../schemas/testimonial.schema"));
const helper_functions_1 = require("../utils/helper-functions");
const response_handler_1 = require("../utils/response-handler");
const showcaseSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, {
        message: "Showcase name must be at least 2 characters.",
    })
        .refine((value) => /^[a-zA-Z0-9 ]+$/.test(value), {
        message: "-, _ or any special characters are not allowed.",
    }),
    headerTitle: zod_1.z.string(),
    message: zod_1.z.string(),
    questions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        question: zod_1.z.string().max(100, {
            message: "Question must be at maximum of 100 characters.",
        }),
    })),
    collection: zod_1.z.enum(["text-and-video", "text-only", "video-only"]),
    collectStarRating: zod_1.z.boolean(),
    customFields: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.any(),
        type: zod_1.z.enum(["text", "number", "url"]),
    })),
    isCustomFields: zod_1.z.boolean(),
    // showAdvanceOptions: z.boolean(),
    isDarkTheme: zod_1.z.boolean(),
    buttonData: zod_1.z.object({
        video: zod_1.z.object({
            label: zod_1.z.string(),
            color: zod_1.z.string(),
            bgColor: zod_1.z.string(),
        }),
        text: zod_1.z.object({
            label: zod_1.z.string(),
            color: zod_1.z.string(),
            bgColor: zod_1.z.string(),
        }),
    }),
});
const getMyShowcases = async (req, res, next) => {
    const user = req.user;
    try {
        const showcases = await showcase_schema_1.default.aggregate([
            {
                $match: { user: user._id },
            },
            {
                $lookup: {
                    from: "testimonials",
                    localField: "_id",
                    foreignField: "showcase",
                    as: "testimonials",
                },
            },
            {
                $unwind: { path: "$testimonials", preserveNullAndEmptyArrays: true },
            },
            {
                $group: {
                    _id: {
                        showcaseId: "$_id",
                        testimonialType: "$testimonials.type",
                    },
                    count: {
                        $sum: { $cond: [{ $ifNull: ["$testimonials", false] }, 1, 0] },
                    },
                    showcaseDetails: { $first: "$$ROOT" },
                },
            },
            {
                $group: {
                    _id: "$_id.showcaseId",
                    name: { $first: "$showcaseDetails.name" },
                    image: { $first: "$showcaseDetails.image" },
                    headerTitle: { $first: "$showcaseDetails.headerTitle" },
                    message: { $first: "$showcaseDetails.message" },
                    user: { $first: "$showcaseDetails.user" },
                    createdAt: { $first: "$showcaseDetails.createdAt" },
                    updatedAt: { $first: "$showcaseDetails.updatedAt" },
                    slug: { $first: "$showcaseDetails.slug" },
                    testimonialCounts: {
                        $push: {
                            type: "$_id.testimonialType",
                            count: "$count",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    headerTitle: 1,
                    message: 1,
                    user: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    slug: 1,
                    testimonialCounts: 1,
                },
            },
            {
                $sort: { createdAt: -1 },
            },
        ]);
        // const showcases = await Showcase.find({ user: user._id });
        return (0, response_handler_1.responseHandler)(res).success(201, "User showcases fetched successfully", showcases);
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.getMyShowcases = getMyShowcases;
const getMyShowcase = async (req, res, next) => {
    const slug = req.params?.slug;
    const user = req.user;
    try {
        const showcases = await showcase_schema_1.default.findOne({ user: user._id, slug });
        if (!showcases)
            return (0, response_handler_1.responseHandler)(res).error(404, "User showcase not found");
        return (0, response_handler_1.responseHandler)(res).success(201, "User showcase fetched successfully", showcases);
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.getMyShowcase = getMyShowcase;
const getShowcase = async (req, res, next) => {
    const slug = req.params?.slug;
    try {
        const showcase = await showcase_schema_1.default.findOne({ slug });
        return (0, response_handler_1.responseHandler)(res).success(201, "Showcase fetched successfully", showcase);
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.getShowcase = getShowcase;
// export const createShowcase: RequestHandler = async (req, res, next) => {
//   try {
//     const data = showcaseSchema.parse(req.body);
//     const user = req!.user! as UserType;
//     const showcase = new Showcase({ ...data, user: user._id });
//     const result = await showcase.save();
//     return responseHandler(res).success(
//       201,
//       "Showcase created successfully",
//       result
//     );
//   } catch (error) {
//     return responseHandler(res).error(400, error);
//   }
// };
const createShowcase = async (req, res, next) => {
    try {
        const user = req.user;
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
            console.log(jsonData);
            const data = showcaseSchema.parse(jsonData);
            const showcase = new showcase_schema_1.default({ ...data, user: user._id });
            const id = showcase._id;
            if (!files.image)
                return (0, response_handler_1.responseHandler)(res).error(404, "Image not found");
            const image = files.image[0];
            const fileBlob = (0, fs_1.readFileSync)(image.filepath);
            const filePath = `/${id}/showcase_image`;
            await (0, firebase_helper_functions_1.fileUpload)(filePath, fileBlob, {
                contentType: image.mimetype,
            });
            const imageFileUrl = await (0, firebase_helper_functions_1.getFile)(filePath);
            const imageUrl = imageFileUrl.split("&")[0];
            showcase.image = imageUrl;
            const result = await showcase.save();
            return (0, response_handler_1.responseHandler)(res).success(201, "Showcase created successfully", result);
        });
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.createShowcase = createShowcase;
const updateShowcase = async (req, res, next) => {
    const id = req.params?.id;
    const user = req.user;
    const showcase = await showcase_schema_1.default.findOne({ _id: id, user: user?._id });
    if (!showcase)
        return (0, response_handler_1.responseHandler)(res).error(404, "Showcase not found");
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
            const data = showcaseSchema.safeParse(jsonData);
            if (data.success) {
                let values = data.data;
                if (data.data.name)
                    values = { ...values, slug: (0, helper_functions_1.generateSlug)(values.name) };
                await showcase_schema_1.default.findByIdAndUpdate(id, values);
            }
            else
                return (0, response_handler_1.responseHandler)(res).error(400, data.error);
            if (!files?.image) {
                const showcase = await showcase_schema_1.default.findOne({ _id: id, user: user?._id });
                return (0, response_handler_1.responseHandler)(res).success(201, "Showcase updated successfully", showcase);
            }
            const image = files.image[0];
            const fileBlob = (0, fs_1.readFileSync)(image.filepath);
            const filePath = `/${id}/showcase_image`;
            await (0, firebase_helper_functions_1.deleteFile)(filePath);
            await (0, firebase_helper_functions_1.fileUpload)(filePath, fileBlob, {
                contentType: image.mimetype,
            });
            const imageFileUrl = await (0, firebase_helper_functions_1.getFile)(filePath);
            const imageUrl = imageFileUrl.split("&")[0];
            const newShowcase = await showcase_schema_1.default.findByIdAndUpdate(id, {
                image: imageUrl,
            });
            return (0, response_handler_1.responseHandler)(res).success(201, "Showcase updated successfully", newShowcase);
        });
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.updateShowcase = updateShowcase;
const deleteShowcase = async (req, res, next) => {
    const id = req.params?.id;
    const user = req.user;
    try {
        const showcase = await showcase_schema_1.default.findOne({ _id: id, user: user?._id });
        if (!showcase)
            return (0, response_handler_1.responseHandler)(res).error(404, "Showcase not found");
        await showcase.deleteOne();
        const showcaseFolderPath = `/${id}/`;
        await (0, firebase_helper_functions_1.deleteFile)(showcaseFolderPath);
        await testimonial_schema_1.default.deleteMany({ showcase: id });
        // await Showcase.findOneAndDelete({ _id: id, user: user?._id });
        return (0, response_handler_1.responseHandler)(res).success(201, "Showcase deleted successfully");
    }
    catch (error) {
        return (0, response_handler_1.responseHandler)(res).error(400, error);
    }
};
exports.deleteShowcase = deleteShowcase;
//# sourceMappingURL=showcase.controllers.js.map