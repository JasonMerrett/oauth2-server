import Joi from '@hapi/joi';

const register = Joi.object({
    username: Joi.string()
        .max(30)
        .required(),

    email: Joi.string()
        .email()
        .required(),

    password: Joi.string()
        .min(6)
        .required()
});

export default { register };
