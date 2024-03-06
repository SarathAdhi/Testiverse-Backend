import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import {
  Strategy as GoogleStrategy,
  type VerifyCallback,
} from "passport-google-oauth2";
import { z } from "zod";
import User from "../schemas/user.schema";
import {
  FRONTEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  SECRET_KEY,
} from "../utils/my-envs";

const UserJsonSchema = z.object({
  email: z.string().email(),
  image: z.string().url(),
  name: z.string(),
  provider: z.string(),
});

// ----------------- GOOGLE ------------------------

async function googleVerifyFunc(
  request: Request,
  accessToken: string,
  refreshToken: string,
  profile: any,
  cb: VerifyCallback
) {
  const user = profile._json;

  const mongoUser = await User.findOne({ email: user.email });

  if (mongoUser && mongoUser?.provider !== "google")
    return cb(
      "Sorry, an account with this email address already exists using a different sign-in method. Please use the appropriate sign-in option."
    );

  if (mongoUser) return cb(null, mongoUser);

  try {
    const parsedUser = UserJsonSchema.parse({
      ...user,
      image: user.picture,
      provider: "google",
    });

    const newUser = new User(parsedUser);

    const savedUser = await newUser.save();

    return cb(null, savedUser);
  } catch (error) {
    return cb(error);
  }
}

async function githubVerifyFunction(
  request: Request,
  accessToken: string,
  refreshToken: string,
  profile: any,
  cb: VerifyCallback
) {
  var options = {
    headers: {
      "User-Agent": "JavaScript.ru",
      Authorization: "token " + accessToken,
    },
  };

  const data = await fetch("https://api.github.com/user/emails", options);
  const result = await data.json();

  const email = result[0].email;

  const user = profile._json;

  const mongoUser = await User.findOne({ email });

  if (mongoUser && mongoUser?.provider !== "github")
    return cb(
      "Sorry, an account with this email address already exists using a different sign-in method. Please use the appropriate sign-in option."
    );

  if (mongoUser) return cb(null, mongoUser);

  try {
    const parsedUser = UserJsonSchema.parse({
      ...user,
      email,
      image: user.avatar_url,
      provider: "github",
    });
    const newUser = new User(parsedUser);

    const savedUser = await newUser.save();

    return cb(null, savedUser);
  } catch (error) {
    return cb(error);
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.BACKEND_URL + "/auth/google/callback",
      passReqToCallback: true,
    },
    googleVerifyFunc
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID!,
      clientSecret: GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.BACKEND_URL + "/auth/github/callback",
      passReqToCallback: true,
    },
    githubVerifyFunction
  )
);

// ------------ Google ------------------

export const googleCallbackFunction: RequestHandler = (req, res, next) => {
  passport.authenticate(
    "google",
    {
      failureRedirect: "/auth/google/login",
      passReqToCallback: true,
    },
    async (err: any, user: any) => {
      console.log({ err, user });

      if (err) return res.redirect(`${FRONTEND_URL}/auth?error=${err}`);

      if (!user)
        return res.status(401).json({ message: "Authentication failed" });

      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.status(400).json({ message: loginErr });
        }

        const token = await jwt.sign({ user: req.user }, SECRET_KEY!, {
          expiresIn: "12h",
        });

        console.log({ token });

        return res.redirect(`${FRONTEND_URL}/auth/verify?token=${token}`);
      });
    }
  )(req, res, next);
};

// ------------ GitHub ------------------

export const githubCallbackFunction: RequestHandler = (req, res, next) => {
  passport.authenticate(
    "github",
    {
      failureRedirect: "/auth/github/login",
      passReqToCallback: true,
    },
    async (err: any, user: any) => {
      console.log({ err, user });

      if (err) return res.redirect(`${FRONTEND_URL}/auth?error=${err}`);

      if (!user)
        return res.status(401).json({ message: "Authentication failed" });

      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.status(500).json({ message: "Internal Server Error" });
        }

        const token = await jwt.sign({ user: req.user }, SECRET_KEY!, {
          expiresIn: "12h",
        });

        console.log({ token });

        return res.redirect(`${FRONTEND_URL}/auth/verify?token=${token}`);
      });
    }
  )(req, res, next);
};
