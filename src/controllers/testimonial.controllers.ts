import { load } from "cheerio";
import { RequestHandler } from "express";
import formidable from "formidable";
import { readFileSync } from "fs";
import { Types } from "mongoose";
import { z } from "zod";
import {
  deleteFile,
  fileUpload,
  getFile,
} from "../lib/firebase-helper-functions";
import Showcase from "../schemas/showcase.schema";
import Testimonial from "../schemas/testimonial.schema";
import { UserType } from "../schemas/user.schema";
import { responseHandler } from "../utils/response-handler";

const testimonialSchema = z
  .object({
    type: z.enum(["video", "text"]),
    file: z.string().optional(),
    text: z.string().optional(),
    rating: z.number().optional(),
    customFields: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
          value: z.string(),
          type: z.enum(["text", "number", "url"]),
        })
        .optional()
    ),
    user: z
      .object({
        name: z.string(),
        email: z.string().email(),
      })
      .optional(),
    showcase: z.string(),
  })
  .refine((data) => (data.type === "video" ? true : data.text !== undefined), {
    message: "Text field is required for non-video testimonials.",
  })
  .refine(
    (data) =>
      data.type === "video"
        ? true
        : (data.user?.email && data.user.name) !== undefined,
    {
      message: "User details is required.",
    }
  );

export const getTestimonial: RequestHandler = async (req, res, next) => {
  const testimonial_id = req.params?.id;

  try {
    const testimonial = await Testimonial.findOne({
      _id: testimonial_id,
    });

    if (!testimonial)
      return responseHandler(res).error(
        400,
        "Testimonial not found or have been deleted."
      );

    responseHandler(res).success(200, "", testimonial);
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const getTestimonialFromLinkedin: RequestHandler = async (
  req,
  res,
  next
) => {
  const linkedinPostUrl = req.query?.url as string;

  console.log(linkedinPostUrl);

  const response = await fetch(linkedinPostUrl);
  const result = await response.text();

  const $ = load(result);

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

    responseHandler(res).success(200, "");
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const getAllShowcaseTestimonials: RequestHandler = async (
  req,
  res,
  next
) => {
  const showcase_slug = req.params?.slug;
  const testimonial_type = req.query?.type;
  const search_query = req.query?.search as string;

  try {
    const showcase = await Showcase.findOne({
      slug: showcase_slug,
    });

    if (!showcase)
      return responseHandler(res).error(
        400,
        "Showcase not found or have been deleted."
      );

    const showcase_id = showcase._id;

    if (!testimonial_type || testimonial_type === "all") {
      const testimonials = await Testimonial.find({
        showcase: showcase_id,
      }).sort({ createdAt: -1 });

      return responseHandler(res).success(200, "", testimonials);
    }
    //
    else if (testimonial_type === "video" || testimonial_type === "text") {
      const testimonials = await Testimonial.find({
        showcase: showcase_id,
        type: testimonial_type,
      }).sort({ createdAt: -1 });

      return responseHandler(res).success(200, "", testimonials);
    } else {
      return responseHandler(res).error(
        422,
        `Type ${testimonial_type} does not exist`
      );
    }
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const createTestimonial: RequestHandler = async (req, res, next) => {
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

      const jsonData = JSON.parse(jsonString) as z.infer<
        typeof testimonialSchema
      >;

      const showcase = await Showcase.findById(jsonData.showcase);

      if (!showcase)
        return responseHandler(res).error(
          400,
          "Showcase not found or have been deleted."
        );

      const data = testimonialSchema.parse(jsonData);

      const testimonial = new Testimonial({ ...data });

      const result = await testimonial.save();

      const id = showcase._id;

      if (data.type === "video") {
        if (!files.video)
          return responseHandler(res).error(404, "video not found");

        const video = files.video[0];

        const fileBlob = readFileSync(video.filepath);

        const filePath = `/${id}/testimonials/videos/${testimonial._id}`;

        await fileUpload(filePath, fileBlob, {
          contentType: video.mimetype!,
        });

        const fileData = await getFile(filePath);

        const videoUrl = fileData.split("&")[0];

        testimonial.file = videoUrl;

        await testimonial.save();
      }

      if (files?.user_image) {
        const userImage = files.user_image[0];

        const fileBlob = readFileSync(userImage.filepath);

        const filePath =
          `/${id}/testimonials/users/${testimonial._id}-` + data.user?.name;

        await fileUpload(filePath, fileBlob, {
          contentType: userImage.mimetype!,
        });

        const fileData = await getFile(filePath);

        const userImageUrl = fileData.split("&")[0];

        testimonial.user = {
          ...data.user,
          image: userImageUrl,
        };

        await testimonial.save();
      }

      return responseHandler(res).success(
        201,
        "Your testimonial uploaded successfully",
        result
      );
    });
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const getAllTestimonials: RequestHandler = async (req, res, next) => {
  const user = req.user as UserType;

  const testimonial_type = req.query?.type;

  try {
    const showcases = await Showcase.find({
      user: user._id,
    });

    const showcases_id = showcases.map(({ _id }) => _id);

    if (!testimonial_type || testimonial_type === "all") {
      const testimonials = await Testimonial.find({
        showcase: { $in: showcases_id },
      }).sort({ createdAt: -1 });

      return responseHandler(res).success(200, "", testimonials);
    }
    //
    else if (testimonial_type === "video" || testimonial_type === "text") {
      const testimonials = await Testimonial.find({
        showcase: { $in: showcases_id },
        type: testimonial_type,
      }).sort({ createdAt: -1 });

      return responseHandler(res).success(200, "", testimonials);
    } else {
      return responseHandler(res).error(
        422,
        `Type ${testimonial_type} does not exist`
      );
    }
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};

export const deleteManyTestimonials: RequestHandler = async (
  req,
  res,
  next
) => {
  const user = req.user as UserType;

  let testimonialIds = req.body as string[];
  const mongoTestimonialIds = testimonialIds.map((e) => new Types.ObjectId(e));

  console.log(testimonialIds);

  try {
    const testimonials = await Testimonial.aggregate([
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
        await deleteFile(videoPath);
      }

      const userImagePath = `/${showcase_id}/testimonials/users/${testimonial_id}-${userName}`;
      await deleteFile(userImagePath);
    }

    const allUserShowcaseTestimonial = testimonials?.map(
      (testimonial) => testimonial?._id
    ) as string[];

    await Testimonial.deleteMany({
      _id: { $in: allUserShowcaseTestimonial },
    });

    return responseHandler(res).success(
      200,
      allUserShowcaseTestimonial?.length === 1
        ? "Testimonial deleted successfully"
        : "Selected testimonials deleted successfully"
    );
  } catch (error) {
    return responseHandler(res).error(400, error);
  }
};
