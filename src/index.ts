import 'dotenv/config';
import App from './app';
import validateEnv from './utils/validateEnv';
import AuthenticationController from './resources/authentication/authentication.controller';
import Oauth2Controller from './resources/oauth2/oauth2.controller';
import ClientController from './resources/client/client.controller';

validateEnv();

const app = new App(
    [
        // instantiate controller classes
        new AuthenticationController(),
        new Oauth2Controller(),
        new ClientController()
    ],
    Number(process.env.PORT)
);

app.listen();
