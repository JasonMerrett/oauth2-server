/* eslint-disable @typescript-eslint/no-unused-vars */
import User from '../../resources/user/user.interface';
import Client from '../../resources/client/client.interface';

declare global {
    namespace Express {
        export interface Request {
            user?: User;
            oauth2: {
                transactionID: string;
                client: Client;
            };
        }
    }
}
