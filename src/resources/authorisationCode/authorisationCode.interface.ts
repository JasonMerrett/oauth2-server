import { Document, Schema } from 'mongoose';
import User from '../user/user.interface';

interface AuthorisationCode extends Document {
    _id: Schema.Types.ObjectId;
    code: string;
    user: User;
    clientId: string;
    scope: string[];
    redirectURI: string;
}

export default AuthorisationCode;
