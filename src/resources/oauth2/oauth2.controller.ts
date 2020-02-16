import express, { Request, Response } from 'express';
import oauth from 'oauth2orize';
import passport from 'passport';
import login from 'connect-ensure-login';
import uuidV4 from 'uuid/v4';
import jwt, { Secret } from 'jsonwebtoken';
import short from 'short-uuid';
import Controller from '../../utils/interfaces/controller.interface';
import { add, format } from 'date-fns';

import userModel from '../user/user.model';
import clientModel from '../client/client.model';
import authorisationCodeModel from '../authorisationCode/authorisationCode.model';
import accessTokenModel from '../accessToken/accessToken.model';
import refreshTokenModel from '../refreshToken/refreshToken.model';
import HttpException from '../../utils/exceptions/HttpExceptions';
import Client from '../client/client.interface';

class Oauth2Controller implements Controller {
    public path = '/oauth';
    public router = express.Router();
    private server = oauth.createServer();

    constructor() {
        // Add grant types to server
        this.server.grant(this.grantAuthCode);
        this.server.grant(this.grantImplicitAuth);
        this.server.exchange(this.exchangeAuthCode);
        this.server.exchange(this.exchangeUsernameAndPassword);
        this.server.exchange(this.exchangeRefreshToken);

        // Add serialize and deserialize functions
        this.server.serializeClient((client: Client, done) => {
            return done(null, client.id);
        });

        this.server.deserializeClient(async (clientId, done) => {
            try {
                const client = await clientModel.findById(clientId);

                if (!client)
                    return done(new HttpException(401, 'Client not found'));

                return done(null, client);
            } catch (e) {
                return done(e);
            }
        });

        // Initialise routes
        this.router.get(
            `${this.path}/authorize`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.authorisation as unknown) as express.RequestHandler<any>
        );
        this.router.post(
            `${this.path}/authorize/decision`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.decision as unknown) as express.RequestHandler<any>
        );
        this.router.post(
            `${this.path}/token`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.token as unknown) as express.RequestHandler<any>
        );
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
            const expirationDate = add(Date.now(), { days: 1 });
            const tokenID = uuidV4();
            const token = jwt.sign(
                {
                    jti: tokenID,
                    user: { id: user.id, scope: client.scope },
                    exp: Number(format(expirationDate, 't'))
                },
                process.env.JWT_SECRET as Secret
            );

            try {
                await accessTokenModel.create({
                    token: tokenID,
                    user: user.id,
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

                if (!authCode)
                    return done(new HttpException(401, 'Auth code is invalid'));

                if (client.clientId !== authCode.clientId)
                    return done(
                        new HttpException(401, 'Client does not match')
                    );

                if (redirectUri !== authCode.redirectURI)
                    return done(
                        new HttpException(401, 'redirect URI is invalid')
                    );

                // TODO: if delete fails don't stop request but flag up in logs
                authorisationCodeModel.deleteOne({ code: code });

                // Everything validated return tokens
                const tokenExpirationDate = add(Date.now(), { days: 1 });
                const tokenID = uuidV4();
                const token = jwt.sign(
                    {
                        jti: tokenID,
                        user: { id: authCode.user.id, scope: client.scope },
                        exp: Number(format(tokenExpirationDate, 't'))
                    },
                    process.env.JWT_SECRET as Secret
                );

                const refreshTokenExpirationDate = add(Date.now(), {
                    days: 365
                });
                const refreshTokenID = uuidV4();
                const refreshToken = jwt.sign(
                    {
                        jti: refreshTokenID,
                        user: { id: authCode.user.id, scope: client.scope },
                        exp: Number(format(refreshTokenExpirationDate, 't'))
                    },
                    process.env.JWT_SECRET as Secret
                );

                // Using await so we don't continue with the request if a DB request fails
                await accessTokenModel.create({
                    token: tokenID,
                    user: authCode.user.id,
                    clientId: client.clientId,
                    scope: client.scope,
                    expirationDate: tokenExpirationDate
                });

                await refreshTokenModel.create({
                    token: refreshTokenID,
                    user: authCode.user.id,
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

                const tokenExpirationDate = add(Date.now(), { days: 1 });
                const tokenID = uuidV4();
                const token = jwt.sign(
                    {
                        jti: tokenID,
                        user: { id: user.id, scope: scope },
                        exp: Number(format(tokenExpirationDate, 't'))
                    },
                    process.env.JWT_SECRET as Secret
                );

                const refreshTokenExpirationDate = add(Date.now(), {
                    days: 365
                });
                const refreshTokenID = uuidV4();
                const refreshToken = jwt.sign(
                    {
                        jti: refreshTokenID,
                        user: { id: user.id, scope: scope },
                        exp: Number(format(refreshTokenExpirationDate, 't'))
                    },
                    process.env.JWT_SECRET as Secret
                );

                // Using await so we don't continue with the request if a DB request fails
                await accessTokenModel.create({
                    token: tokenID,
                    user: user.id,
                    clientId: client.clientId,
                    scope: scope,
                    expirationDate: tokenExpirationDate
                });

                await refreshTokenModel.create({
                    token: refreshTokenID,
                    user: user.id,
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
                    .populate('user')
                    .exec();

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

                const tokenExpirationDate = add(Date.now(), { days: 1 });
                const tokenID = uuidV4();
                const token = jwt.sign(
                    {
                        jti: tokenID,
                        user: {
                            id: fetchedRefreshToken.user.id,
                            scope: scope
                        },
                        exp: Number(format(tokenExpirationDate, 't'))
                    },
                    process.env.JWT_SECRET as Secret
                );

                await accessTokenModel.create({
                    token: tokenID,
                    user: fetchedRefreshToken.user.id,
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

    /**
     * User authorisation middleware
     */
    private authorisation = [
        login.ensureLoggedIn('/auth/login'),
        this.server.authorization(
            async (clientId, redirectUri, done) => {
                try {
                    const client = await clientModel.findOne({
                        clientId: clientId
                    });

                    if (!client)
                        return done(new HttpException(401, 'Invalid Client'));

                    if (client.redirectURI !== redirectUri)
                        return done(
                            new HttpException(403, 'Unauthorized Client')
                        );

                    return done(null, client, redirectUri);
                } catch (e) {
                    return done(e);
                }
            },
            (client, user, scope, type, areq, done) => {
                // auto approve if client is trusted
                if (client.trusted) return done(null, true, '', '');

                // otherwise ask the user
                return done(null, false, '', '');
            }
        ),
        (req: Request, res: Response): void => {
            // TODO: Pass through scopes so user can see what client will be able to access
            return res.render('dialog', {
                transactionId: req.oauth2.transactionID,
                user: req.user,
                client: req.oauth2.client
            });
        }
    ];

    /**
     * User decision middleware
     */
    private decision = [
        login.ensureLoggedIn('/auth/login'),
        this.server.decision()
    ];

    /**
     * Token middleware
     */
    private token = [
        passport.authenticate(['basic', 'oauth2-client-password'], {
            session: false
        }),
        this.server.token(),
        this.server.errorHandler()
    ];
}

export default Oauth2Controller;
