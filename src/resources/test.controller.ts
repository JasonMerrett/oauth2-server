import express, { Request, Response } from 'express';
import Controller from '../utils/interfaces/controller.interface';

class TestController implements Controller {
    public path = '/test';
    public router = express.Router();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.get(`${this.path}`, this.test);
    }

    private test = async (
        req: Request,
        res: Response
    ): Promise<Response | void> => {
        res.render('test');
    };
}

export default TestController;
