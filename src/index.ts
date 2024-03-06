import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import session from "express-session";
import mongoose from "mongoose";
import passport from "passport";
import { AuthRouter } from "./routes/auth.routes";
import { ShowcaseRouter } from "./routes/showcase.routes";
import { TestimonialRouter } from "./routes/testimonial.routes";
import { MONGO_DB_URI } from "./utils/my-envs";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// app.use(
//   bodyParser.urlencoded({
//     extended: false,
//   })
// );
// app.use(bodyParser.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);
app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});

app.use("/auth", AuthRouter);
app.use("/showcase", ShowcaseRouter);
app.use("/testimonial", TestimonialRouter);

mongoose
  .connect(MONGO_DB_URI!)
  .then(() => console.log("MONGODB: CONNECTED TO DB"));

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
