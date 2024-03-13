import { RequestHandler } from "express";
import formidable from "formidable";
import { readFileSync } from "fs";
import { z } from "zod";
import {
  deleteFile,
  fileUpload,
  getFile,
} from "../lib/firebase-helper-functions";
import Showcase from "../schemas/showcase.schema";
import Testimonial from "../schemas/testimonial.schema";
import { UserType } from "../schemas/user.schema";
import { generateSlug } from "../utils/helper-functions";
import { responseHandler } from "../utils/response-handler";

const showcaseSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Showcase name must be at least 2 characters.",
    })
    .refine((value) => /^[a-zA-Z0-9 ]+$/.test(value), {
      message: "-, _ or any special characters are not allowed.",
    }),
  headerTitle: z.string(),
  message: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string().max(100, {
        message: "Question must be at maximum of 100 characters.",
      }),
    })
  ),
  collection: z.enum(["text-and-video", "text-only", "video-only"]),
  collectStarRating: z.boolean(),
  customFields: z.array(
    z.object({
      id: z.string(),
      name: z.any(),
      type: z.enum(["text", "number", "url"]),
    })
  ),
  isCustomFields: z.boolean(),
  // showAdvanceOptions: z.boolean(),
  isDarkTheme: z.boolean(),
  buttonData: z.object({
    video: z.object({
      label: z.string(),
      color: z.string(),
      bgColor: z.string(),
    }),
    text: z.object({
      label: z.string(),
      color: z.string(),
      bgColor: z.string(),
    }),
  }),
});

export const getMyShowcases: RequestHandler = async (req, res, next) => {
  const user = req.user as UserType;

  try {
    const showcases = await Showcase.aggregate([
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

    return responseHandler(res).success(
      201,
      "User showcases fetched successfully",
      showcases
    );
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const getMyShowcase: RequestHandler = async (req, res, next) => {
  const slug = req.params?.slug;
  const user = req.user as UserType;

  try {
    const showcases = await Showcase.findOne({ user: user._id, slug });

    if (!showcases)
      return responseHandler(res).error(404, "User showcase not found");

    return responseHandler(res).success(
      201,
      "User showcase fetched successfully",
      showcases
    );
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const getShowcase: RequestHandler = async (req, res, next) => {
  const slug = req.params?.slug;

  try {
    const showcase = await Showcase.findOne({ slug });

    return responseHandler(res).success(
      201,
      "Showcase fetched successfully",
      showcase
    );
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

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

export const createShowcase: RequestHandler = async (req, res, next) => {
  try {
    const user = req!.user! as UserType;

    const form = formidable({});

    form.parse(req, async (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }

      const jsonString = fields?.json?.[0];

      if (!jsonString)
        return responseHandler(res).error(400, "JSON body not found");

      const jsonData = JSON.parse(jsonString) as z.infer<typeof showcaseSchema>;

      console.log(jsonData);

      const data = showcaseSchema.parse(jsonData);

      const showcase = new Showcase({ ...data, user: user._id });

      const id = showcase._id;

      if (!files.image)
        return responseHandler(res).error(404, "Image not found");

      const image = files.image[0];

      const fileBlob = readFileSync(image.filepath);

      const filePath = `/${id}/showcase_image`;

      await fileUpload(filePath, fileBlob, {
        contentType: image.mimetype!,
      });

      const imageFileUrl = await getFile(filePath);

      const imageUrl = imageFileUrl.split("&")[0];

      showcase.image = imageUrl;

      const result = await showcase.save();

      return responseHandler(res).success(
        201,
        "Showcase created successfully",
        result
      );
    });
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const updateShowcase: RequestHandler = async (req, res, next) => {
  const id = req.params?.id;

  const user = req!.user! as UserType;

  const showcase = await Showcase.findOne({ _id: id, user: user?._id });

  if (!showcase) return responseHandler(res).error(404, "Showcase not found");

  try {
    const form = formidable({});

    form.parse(req, async (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }

      const jsonString = fields?.json?.[0];

      if (!jsonString)
        return responseHandler(res).error(400, "JSON body not found");

      const jsonData = JSON.parse(jsonString) as z.infer<typeof showcaseSchema>;

      const data = showcaseSchema.safeParse(jsonData);

      if (data.success) {
        let values = data.data as z.infer<typeof showcaseSchema> & {
          slug?: string;
        };

        if (data.data.name)
          values = { ...values, slug: generateSlug(values.name) };

        await Showcase.findByIdAndUpdate(id, values);
      } else return responseHandler(res).error(400, data.error);

      if (!files?.image) {
        const showcase = await Showcase.findOne({ _id: id, user: user?._id });

        return responseHandler(res).success(
          201,
          "Showcase updated successfully",
          showcase
        );
      }

      const image = files.image[0];

      const fileBlob = readFileSync(image.filepath);

      const filePath = `/${id}/showcase_image`;

      await deleteFile(filePath);

      await fileUpload(filePath, fileBlob, {
        contentType: image.mimetype!,
      });

      const imageFileUrl = await getFile(filePath);

      const imageUrl = imageFileUrl.split("&")[0];

      const newShowcase = await Showcase.findByIdAndUpdate(id, {
        image: imageUrl,
      });

      return responseHandler(res).success(
        201,
        "Showcase updated successfully",
        newShowcase
      );
    });
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const deleteShowcase: RequestHandler = async (req, res, next) => {
  const id = req.params?.id;

  const user = req!.user! as UserType;

  try {
    const showcase = await Showcase.findOne({ _id: id, user: user?._id });

    if (!showcase) return responseHandler(res).error(404, "Showcase not found");

    await showcase.deleteOne();

    const showcaseFolderPath = `/${id}/`;
    await deleteFile(showcaseFolderPath);

    await Testimonial.deleteMany({ showcase: id });

    // await Showcase.findOneAndDelete({ _id: id, user: user?._id });

    return responseHandler(res).success(201, "Showcase deleted successfully");
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};
