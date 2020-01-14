import "dotenv/config";
import App from "./app";
import validateEnv from "./utils/validateEnv";

validateEnv();

const app = new App(
  [
    // instantiate controller classes
    // new AuthenticationController()
  ],
  Number(process.env.PORT)
);

app.listen();
