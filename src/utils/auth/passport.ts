import passport from 'passport';
import passportLocal from 'passport-local';
import passportBasic from 'passport-http';
import passportClient from 'passport-oauth2-client-password';
import roleModel from '../../resources/user/role/role.model';
import userModel from '../../resources/user/user.model';
import User from '../../resources/user/user.interface';
import clientModel from '../../resources/client/client.model';
import HttpException from '../exceptions/HttpExceptions';

const LocalStrategy = passportLocal.Strategy;
const BasicStrategy = passportBasic.BasicStrategy;
const ClientPasswordStrategy = passportClient.Strategy;

passport.use(
    'register',
    new LocalStrategy(
        { passReqToCallback: true },
        async (req, username, password, done) => {
            try {
                const role = await roleModel.findOne({ name: 'user' });

                if (!role) {
                    return done('Role not found', false);
                }

                const user = await userModel.create({
                    username: username.toLowerCase(),
                    displayName: username,
                    password: password,
                    email: req.body.email,
                    role: role._id
                });

                return done(null, user);
            } catch (e) {
                return done(e.message, false);
            }
        }
    )
);

passport.use(
    'login',
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await userModel.findOne({
                username: username.toLowerCase()
            });

            if (!user) {
                return done('User not found', false);
            }

            if (await user.isValidPassword(password)) {
                return done(false, user);
            } else {
                return done('Incorrect Password', null);
            }
        } catch (e) {
            return done(e.message, null);
        }
    })
);

passport.use(
    new BasicStrategy(async (clientId, clientSecret, done) => {
        console.log('test1');
        try {
            const client = await clientModel.findOne({ clientId: clientId });
            console.log('test2');

            if (!client)
                return done(new HttpException(404, 'Client not found'));

            console.log('test3');

            if (client.isValidSecret(clientSecret)) {
                console.log('test4');
                return done(null, client);
            } else {
                console.log('test5');
                return done(new HttpException(401, 'Client not authorised'));
            }
        } catch (e) {
            console.log(e);
            return done(e);
        }
    })
);

passport.use(
    new ClientPasswordStrategy(async (clientId, clientSecret, done) => {
        console.log('test2');
        try {
            const client = await clientModel.findOne({ clientId: clientId });

            if (!client)
                return done(new HttpException(404, 'Client not found'));

            if (client.isValidSecret(clientSecret)) return done(null, client);
            else return done(new HttpException(401, 'Client not authorised'));
        } catch (e) {
            return done(e);
        }
    })
);

passport.serializeUser((user: User, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    userModel
        .findOne({ _id: id })
        .then(user => done(null, user))
        .catch(err => done(err));
});
