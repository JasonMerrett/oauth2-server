/* eslint-disable @typescript-eslint/no-unused-vars */
import defaultUser from '../../resources/user/user.interface';
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
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        export interface User extends defaultUser {}
    }
}
