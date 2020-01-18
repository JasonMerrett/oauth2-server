import passport from 'passport';
import passportLocal from 'passport-local';
import roleModel from '../../resources/user/role/role.model';
import userModel from '../../resources/user/user.model';
import User from '../../resources/user/user.interface';

const LocalStrategy = passportLocal.Strategy;

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

passport.serializeUser((user: User, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    userModel
        .findOne({ _id: id })
        .then(user => done(null, user))
        .catch(err => done(err));
});
