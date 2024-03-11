"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("passport"));
const auth_routes_1 = require("./routes/auth.routes");
const showcase_routes_1 = require("./routes/showcase.routes");
const testimonial_routes_1 = require("./routes/testimonial.routes");
const my_envs_1 = require("./utils/my-envs");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
// app.use(
//   bodyParser.urlencoded({
//     extended: false,
//   })
// );
// app.use(bodyParser.json());
app.use((0, cookie_parser_1.default)());
app.use(async (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use((0, express_session_1.default)({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
const port = process.env.PORT || 8000;
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.use("/auth", auth_routes_1.AuthRouter);
app.use("/showcase", showcase_routes_1.ShowcaseRouter);
app.use("/testimonial", testimonial_routes_1.TestimonialRouter);
mongoose_1.default
    .connect(my_envs_1.MONGO_DB_URI)
    .then(() => console.log("MONGODB: CONNECTED TO DB"));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map