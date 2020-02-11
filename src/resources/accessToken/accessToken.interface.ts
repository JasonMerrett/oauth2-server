import { Document, Schema } from 'mongoose';
import User from '../user/user.interface';

interface AccessToken extends Document {
    _id: Schema.Types.ObjectId;
    token: string;
    user?: User | Schema.Types.ObjectId;
    clientId: string;
    scope: string[];
    expirationDate: Date;
}

export default AccessToken;
