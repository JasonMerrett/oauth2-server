import express, { Request, Response } from 'express';
import oauth from 'oauth2orize';
import passport from 'passport';
import login from 'connect-ensure-login';
import uuidV4 from 'uuid/v4';
import jwt, { Secret } from 'jsonwebtoken';
import short from 'short-uuid';
import Controller from '../../utils/interfaces/controller.interface';
import date from 'date-fns';

import user from '../user/user.model';
import client from '../client/client.model';
import authorisationCode from '../authorisationCode/authorisationCode.model';
import accessToken from '../accessToken/accessToken.model';
import refreshToken from '../refreshToken/refreshToken.model';

class Oauth2 implements Controller {
    public path = '/oauth';
    public router = express.Router();
    private server = oauth.createServer();

    constructor() {
        // add grant types to server
        this.server.grant(this.grantAuthCode);
        this.server.grant(this.grantImplicitAuth);
        // initialise routes
    }

    /**
     * Grant authorisation code
     */
    private grantAuthCode = oauth.grant.code(
        async (client, redirectUri, user, ares, done) => {
            if (client instanceof Array) {
                client = client[0];
            }

            const code = short.generate();

            try {
                await authorisationCode.create({
                    code: code,
                    clientId: client.clientId,
                    redirectURI: redirectUri,
                    user: user._id
                });

                return done(null, code);
            } catch (e) {
                return done(e);
            }
        }
    );

    /**
     * Grant implicit authorisation
     */
    private grantImplicitAuth = oauth.grant.token(
        async (client, user, ares, done) => {
            if (client instanceof Array) {
                client = client[0];
            }

            const expirationDate = date.add(Date.now(), { days: 1 });
            const tokenID = uuidV4();
            const token = jwt.sign(
                {
                    jti: tokenID,
                    user: { _id: user.id, scope: client.scope },
                    exp: expirationDate
                },
                process.env.JWT_SECRET as Secret
            );

            try {
                await accessToken.create({
                    token: tokenID,
                    userId: user.id,
                    clientId: client.clientId,
                    expirationDate: expirationDate
                });

                return done(null, token, null);
            } catch (e) {
                return done(e);
            }
        }
    );

    /**
     * Exchange authorisation code for access token
     */
    private exchangeAuthCode = oauth.exchange.code(
        (client, code, redirectUri, done) => {}
    );
}

export default Oauth2;
