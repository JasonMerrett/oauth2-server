import 'dotenv/config';
import App from './app';
import validateEnv from './utils/validateEnv';
import TestController from './resources/test.controller';

validateEnv();

const app = new App(
    [
        // instantiate controller classes
        // new AuthenticationController()
        new TestController()
    ],
    Number(process.env.PORT)
);

app.listen();
