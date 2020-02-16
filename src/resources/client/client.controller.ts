import express, { Request, Response, NextFunction } from 'express';
import Controller from '../../utils/interfaces/controller.interface';
import cryptoRandomString from 'crypto-random-string';
import clientModel from './client.model';
import HttpException from '../../utils/exceptions/HttpExceptions';

class ClientController implements Controller {
    public path = '/client';
    public router = express.Router();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.post(`${this.path}`, this.create);
    }

    /**
     * Create client
     */
    private create = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        const clientId = cryptoRandomString({ length: 32 });
        const clientSecret = cryptoRandomString({ length: 32 });

        try {
            const client = await clientModel.create({
                name: req.body.name,
                userId: '5e2a0d3d6bce8e1724e9998e',
                clientId: clientId,
                clientSecret: clientSecret,
                redirectURI: req.body.redirectURI
            });

            return res.json({
                client: client.toJSON(),
                clientSecret: clientSecret
            });
        } catch (e) {
            return next(new HttpException(400, 'Unable to create client'));
        }
    };
}

export default ClientController;
