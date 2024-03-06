import { InferSchemaType, Schema, Types, model } from "mongoose";
import { generateSlug } from "../utils/helper-functions";

const ShowcaseSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Showcase name is required"],
      minlength: [2, "Showcase name must be at least 2 characters."],
      validate: {
        validator: (value: string) => /^[a-zA-Z0-9 ]+$/.test(value),
        message: "-, _ or any special characters are not allowed.",
      },
    },
    slug: {
      type: String,
      unique: [true, "Slug already exist, it should be unique."],
      // required: [true, "Slug is required"],
    },
    image: {
      type: String,
      default: null,
    },
    headerTitle: {
      type: String,
      required: [true, "Header Title is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    questions: [
      {
        id: String,
        question: {
          type: String,
          maxlength: [100, "Question must be at maximum of 100 characters."],
          required: [true, "Question is required"],
        },
      },
    ],
    collection: {
      type: String,
      enum: ["text-and-video", "text-only", "video-only"],
    },
    collectStarRating: Boolean,
    customFields: [
      {
        id: String,
        name: String,
        type: {
          type: String,
          enum: ["text", "number", "url"],
        },
      },
    ],
    isCustomFields: Boolean,
    isDarkTheme: Boolean,
    buttonData: {
      video: {
        label: String,
        color: String,
        bgColor: String,
      },
      text: {
        label: String,
        color: String,
        bgColor: String,
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

ShowcaseSchema.pre("save", async function (next) {
  // Generate slug based on headerTitle
  if (this.isModified("name")) {
    const slug = generateSlug(this.name);

    const isExist = await Showcase.findOne({ slug });

    if (isExist) {
      const error = new Error("Slug already exists, change the showcase name.");
      return next(error);
    }

    this.slug = slug;
  }

  next();
});

export type ShowcaseType = InferSchemaType<typeof ShowcaseSchema> & {
  _id: Types.ObjectId;
};

const Showcase = model("Showcase", ShowcaseSchema);

export default Showcase;
