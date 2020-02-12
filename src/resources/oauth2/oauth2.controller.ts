import express, { Request, Response } from 'express';
import oauth from 'oauth2orize';
import passport from 'passport';
import login from 'connect-ensure-login';
import uuidV4 from 'uuid/v4';
import jwt, { Secret } from 'jsonwebtoken';
import short from 'short-uuid';
import Controller from '../../utils/interfaces/controller.interface';
import date from 'date-fns';

import userModel from '../user/user.model';
import clientModel from '../client/client.model';
import authorisationCodeModel from '../authorisationCode/authorisationCode.model';
import accessTokenModel from '../accessToken/accessToken.model';
import refreshTokenModel from '../refreshToken/refreshToken.model';
import HttpException from '../../utils/exceptions/HttpExceptions';

class Oauth2 implements Controller {
    public path = '/oauth';
    public router = express.Router();
    private server = oauth.createServer();

    constructor() {
        // add grant types to server
        this.server.grant(this.grantAuthCode);
        this.server.grant(this.grantImplicitAuth);
        this.server.exchange(this.exchangeAuthCode);
        this.server.exchange(this.exchangeUsernameAndPassword);
        this.server.exchange(this.exchangeRefreshToken);
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
                await authorisationCodeModel.create({
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
                await accessTokenModel.create({
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
        async (client, code, redirectUri, done) => {
            try {
                const authCode = await authorisationCodeModel
                    .findOne({ code: code })
                    .populate('user');

                if (!authCode) return done(new Error('Auth code is invalid'));

                if (client.clientId !== authCode.clientId)
                    return done(new Error('Client does not match'));

                if (redirectUri !== authCode.redirectURI)
                    return done(new Error('redirect URI is invalid'));

                // TODO: if delete fails don't stop request but flag up in logs
                authorisationCodeModel.deleteOne({ code: code });

                // Everything validated return tokens
                const tokenExpirationDate = date.add(Date.now(), { days: 1 });
                const tokenID = uuidV4();
                const token = jwt.sign(
                    {
                        jti: tokenID,
                        user: { _id: authCode.user.id, scope: client.scope },
                        exp: tokenExpirationDate
                    },
                    process.env.JWT_SECRET as Secret
                );

                const refreshTokenExpirationDate = date.add(Date.now(), {
                    days: 365
                });
                const refreshTokenID = uuidV4();
                const refreshToken = jwt.sign(
                    {
                        jti: refreshTokenID,
                        user: { _id: authCode.user.id, scope: client.scope },
                        exp: refreshTokenExpirationDate
                    },
                    process.env.JWT_SECRET as Secret
                );

                // Using await so we don't continue with the request if a DB request fails
                await accessTokenModel.create({
                    token: tokenID,
                    userId: authCode.user.id,
                    clientId: client.clientId,
                    scope: client.scope,
                    expirationDate: tokenExpirationDate
                });

                await refreshTokenModel.create({
                    token: refreshTokenID,
                    userId: authCode.user.id,
                    clientId: client.clientId,
                    scope: client.scope,
                    expirationDate: refreshTokenExpirationDate
                });

                return done(null, token, refreshToken);
            } catch (e) {
                return done(e);
            }
        }
    );

    /**
     * Exchange username and password for access token
     */
    private exchangeUsernameAndPassword = oauth.exchange.password(
        async (client, username, password, scope, done) => {
            try {
                const user = await userModel.findOne({
                    username: username.toLocaleLowerCase()
                });

                if (!user)
                    return done(
                        new HttpException(401, 'Incorrect username or password')
                    );

                if ((await user.isValidPassword(password)) !== true)
                    return done(
                        new HttpException(401, 'Incorrect username or password')
                    );

                const tokenExpirationDate = date.add(Date.now(), { days: 1 });
                const tokenID = uuidV4();
                const token = jwt.sign(
                    {
                        jti: tokenID,
                        user: { _id: user.id, scope: scope },
                        exp: tokenExpirationDate
                    },
                    process.env.JWT_SECRET as Secret
                );

                const refreshTokenExpirationDate = date.add(Date.now(), {
                    days: 365
                });
                const refreshTokenID = uuidV4();
                const refreshToken = jwt.sign(
                    {
                        jti: refreshTokenID,
                        user: { _id: user.id, scope: scope },
                        exp: refreshTokenExpirationDate
                    },
                    process.env.JWT_SECRET as Secret
                );

                // Using await so we don't continue with the request if a DB request fails
                await accessTokenModel.create({
                    token: tokenID,
                    userId: user.id,
                    clientId: client.clientId,
                    scope: scope,
                    expirationDate: tokenExpirationDate
                });

                await refreshTokenModel.create({
                    token: refreshTokenID,
                    userId: user.id,
                    clientId: client.clientId,
                    scope: scope,
                    expirationDate: refreshTokenExpirationDate
                });

                return done(null, token, refreshToken);
            } catch (e) {
                return done(e);
            }
        }
    );

    /**
     * Exchange refresh token for access token
     */
    private exchangeRefreshToken = oauth.exchange.refreshToken(
        async (client, refreshToken, scope, done) => {
            try {
                // Probably better to create a decoded refresh token interface
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const refreshTokenDecoded: any = jwt.verify(
                    refreshToken,
                    process.env.JWT_SECRET as Secret
                );

                const fetchedRefreshToken = await refreshTokenModel
                    .findOne({
                        token: refreshTokenDecoded.jti
                    })
                    .populate('user');

                if (!fetchedRefreshToken)
                    return done(
                        new HttpException(401, 'Refresh token invalid')
                    );

                if (fetchedRefreshToken.clientId !== client.clientId)
                    return done(
                        new HttpException(
                            401,
                            'Refresh token client does not match'
                        )
                    );

                const tokenExpirationDate = date.add(Date.now(), { days: 1 });
                const tokenID = uuidV4();
                const token = jwt.sign(
                    {
                        jti: tokenID,
                        user: {
                            _id: fetchedRefreshToken.user.id,
                            scope: scope
                        },
                        exp: tokenExpirationDate
                    },
                    process.env.JWT_SECRET as Secret
                );

                await accessTokenModel.create({
                    token: tokenID,
                    userId: fetchedRefreshToken.user.id,
                    clientId: client.clientId,
                    scope: scope,
                    expirationDate: tokenExpirationDate
                });

                return done(null, token);
            } catch (e) {
                return done(e);
            }
        }
    );
}

export default Oauth2;
