"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubCallbackFunction = exports.googleCallbackFunction = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
const passport_google_oauth2_1 = require("passport-google-oauth2");
const zod_1 = require("zod");
const user_schema_1 = __importDefault(require("../schemas/user.schema"));
const my_envs_1 = require("../utils/my-envs");
const UserJsonSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    image: zod_1.z.string().url(),
    name: zod_1.z.string(),
    provider: zod_1.z.string(),
});
// ----------------- GOOGLE ------------------------
async function googleVerifyFunc(request, accessToken, refreshToken, profile, cb) {
    const user = profile._json;
    const mongoUser = await user_schema_1.default.findOne({ email: user.email });
    if (mongoUser && mongoUser?.provider !== "google")
        return cb("Sorry, an account with this email address already exists using a different sign-in method. Please use the appropriate sign-in option.");
    if (mongoUser)
        return cb(null, mongoUser);
    try {
        const parsedUser = UserJsonSchema.parse({
            ...user,
            image: user.picture,
            provider: "google",
        });
        const newUser = new user_schema_1.default(parsedUser);
        const savedUser = await newUser.save();
        return cb(null, savedUser);
    }
    catch (error) {
        return cb(error);
    }
}
async function githubVerifyFunction(request, accessToken, refreshToken, profile, cb) {
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
    const mongoUser = await user_schema_1.default.findOne({ email });
    if (mongoUser && mongoUser?.provider !== "github")
        return cb("Sorry, an account with this email address already exists using a different sign-in method. Please use the appropriate sign-in option.");
    if (mongoUser)
        return cb(null, mongoUser);
    try {
        const parsedUser = UserJsonSchema.parse({
            ...user,
            email,
            image: user.avatar_url,
            provider: "github",
        });
        const newUser = new user_schema_1.default(parsedUser);
        const savedUser = await newUser.save();
        return cb(null, savedUser);
    }
    catch (error) {
        return cb(error);
    }
}
passport_1.default.use(new passport_google_oauth2_1.Strategy({
    clientID: my_envs_1.GOOGLE_CLIENT_ID,
    clientSecret: my_envs_1.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.BACKEND_URL + "/auth/google/callback",
    passReqToCallback: true,
}, googleVerifyFunc));
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: my_envs_1.GITHUB_CLIENT_ID,
    clientSecret: my_envs_1.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.BACKEND_URL + "/auth/github/callback",
    passReqToCallback: true,
}, githubVerifyFunction));
// ------------ Google ------------------
const googleCallbackFunction = (req, res, next) => {
    passport_1.default.authenticate("google", {
        failureRedirect: "/auth/google/login",
        passReqToCallback: true,
    }, async (err, user) => {
        console.log({ err, user });
        if (err)
            return res.redirect(`${my_envs_1.FRONTEND_URL}/auth?error=${err}`);
        if (!user)
            return res.status(401).json({ message: "Authentication failed" });
        req.logIn(user, async (loginErr) => {
            if (loginErr) {
                console.error("Login error:", loginErr);
                return res.status(400).json({ message: loginErr });
            }
            const token = await jsonwebtoken_1.default.sign({ user: req.user }, my_envs_1.SECRET_KEY, {
                expiresIn: "12h",
            });
            console.log({ token });
            return res.redirect(`${my_envs_1.FRONTEND_URL}/auth/verify?token=${token}`);
        });
    })(req, res, next);
};
exports.googleCallbackFunction = googleCallbackFunction;
// ------------ GitHub ------------------
const githubCallbackFunction = (req, res, next) => {
    passport_1.default.authenticate("github", {
        failureRedirect: "/auth/github/login",
        passReqToCallback: true,
    }, async (err, user) => {
        console.log({ err, user });
        if (err)
            return res.redirect(`${my_envs_1.FRONTEND_URL}/auth?error=${err}`);
        if (!user)
            return res.status(401).json({ message: "Authentication failed" });
        req.logIn(user, async (loginErr) => {
            if (loginErr) {
                console.error("Login error:", loginErr);
                return res.status(500).json({ message: "Internal Server Error" });
            }
            const token = await jsonwebtoken_1.default.sign({ user: req.user }, my_envs_1.SECRET_KEY, {
                expiresIn: "12h",
            });
            console.log({ token });
            return res.redirect(`${my_envs_1.FRONTEND_URL}/auth/verify?token=${token}`);
        });
    })(req, res, next);
};
exports.githubCallbackFunction = githubCallbackFunction;
//# sourceMappingURL=auth.controllers.js.map