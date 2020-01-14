import express from "express";
import expressSession from "express-session";
import mongoose from "mongoose";
import compression from "compression";
import Controller from "./utils/interfaces/controller.interface";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import mustacheExpress from "mustache-express";
import errorMiddleware from "./middleware/error.middleware";

class App {
  public express: express.Application;
  public port: number;

  constructor(controllers: Controller[], port: number) {
    this.express = express();
    this.port = port;

    this.initialiseDatabaseConnection();
    this.initialiseMiddleware();
    this.initialiseControllers(controllers);
    this.initialiseErrorHandling();
  }

  private initialiseMiddleware(): void {
    this.express.use(
      expressSession({
        saveUninitialized: true,
        resave: true,
        secret: process.env.COOKIE_SECRET as string,
        cookie: { maxAge: (process.env.COOKIE_MAX_AGE as unknown) as number }
      })
    );

    this.express.engine("mst", mustacheExpress());
    this.express.set("views", path.join(__dirname, "../views"));
    this.express.set("view engine", "mst");
    this.express.use(express.static(path.join(__dirname, "../public")));
    this.express.use(cors());
    this.express.use(morgan("dev"));
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(compression());
  }

  private initialiseControllers(controllers: Controller[]): void {
    controllers.forEach((controller: Controller) => {
      this.express.use("/api", controller.router);
    });
  }

  private initialiseErrorHandling(): void {
    this.express.use(errorMiddleware);
  }

  private initialiseDatabaseConnection(): void {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;

    mongoose.connect(
      `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}`,
      {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );
  }

  public listen(): void {
    this.express.listen(this.port, () => {
      console.log(`App listening on the port ${this.port}`);
    });
  }
}

export default App;
