import express, { Request, Response } from 'express';
import Controller from '../../utils/interfaces/controller.interface';
import passport from 'passport';
import validationMiddleware from '../../middleware/validation.middleware';
import validate from './authentication.validation';

class AuthenticationController implements Controller {
    public path = '/auth';
    public router = express.Router();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.get(`${this.path}/register`, this.getRegister);
        this.router.post(
            `${this.path}/register`,
            validationMiddleware(validate.register),
            passport.authenticate('register', {
                successReturnToOrRedirect: '/auth/login',
                failureRedirect: '/auth/register'
            }),
            this.register
        );
    }

    private register = async (
        req: Request,
        res: Response
    ): Promise<Response | void> => {
        res.render('test');
    };

    private getRegister = async (
        req: Request,
        res: Response
    ): Promise<Response | void> => {
        res.render('register');
    };
}

export default AuthenticationController;
