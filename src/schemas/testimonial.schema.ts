import { InferSchemaType, Schema, Types, model } from "mongoose";

const TestimonialSchema = new Schema(
  {
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
      type: Schema.Types.ObjectId,
      ref: "Showcase",
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt" } }
);

export type TestimonialType = InferSchemaType<typeof TestimonialSchema> & {
  _id: Types.ObjectId;
};

const Testimonial = model("Testimonial", TestimonialSchema);

export default Testimonial;
