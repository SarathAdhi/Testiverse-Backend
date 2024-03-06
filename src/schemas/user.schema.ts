import { InferSchemaType, Schema, Types, model } from "mongoose";
import validator from "validator";

const UserSchema = new Schema({
  // uuid: {
  //   type: String,
  //   required: true,
  //   unique: true,
  // },
  provider: {
    type: String,
    required: true,
    enum: ["google", "github"],
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email address"],
  },
  image: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// UserSchema.pre("save")

export type UserType = InferSchemaType<typeof UserSchema> & {
  _id: Types.ObjectId;
};

const User = model("User", UserSchema);

export default User;
