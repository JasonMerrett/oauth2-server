import express from 'express';
import expressSession from 'express-session';
import mongoose from 'mongoose';
import compression from 'compression';
import Controller from './utils/interfaces/controller.interface';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import errorMiddleware from './middleware/error.middleware';
import hbs from 'hbs';
import passport from 'passport';

class App {
    public express: express.Application;
    public port: number;

    constructor(controllers: Controller[], port: number) {
        this.express = express();
        this.port = port;

        this.initialiseDatabaseConnection();
        this.initialiseMiddleware();
        this.initialiseControllers(controllers);
        this.initialiseErrorHandling();
    }

    private initialiseMiddleware(): void {
        this.express.use(
            expressSession({
                saveUninitialized: true,
                resave: true,
                secret: process.env.COOKIE_SECRET as string,
                cookie: { maxAge: 60000 }
            })
        );

        hbs.registerPartials(__dirname + '../views/partials');
        this.express.set('views', path.join(__dirname, '../views'));
        this.express.set('view engine', 'hbs');
        this.express.use(express.static(path.join(__dirname, '../public')));
        this.express.use(cors());
        this.express.use(morgan('dev'));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(compression());

        require('./utils/auth/passport');
        this.express.use(passport.initialize());
        this.express.use(passport.session());
    }

    private initialiseControllers(controllers: Controller[]): void {
        controllers.forEach((controller: Controller) => {
            this.express.use('/', controller.router);
        });
    }

    private initialiseErrorHandling(): void {
        this.express.use(errorMiddleware);
    }

    private initialiseDatabaseConnection(): void {
        const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;

        mongoose.connect(
            `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}`,
            {
                useCreateIndex: true,
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
    }

    public listen(): void {
        this.express.listen(this.port, () => {
            console.log(`App listening on the port ${this.port}`);
        });
    }
}

export default App;
