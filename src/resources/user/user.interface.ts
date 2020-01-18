import { Document, Schema } from 'mongoose';

interface User extends Document {
    _id: Schema.Types.ObjectId;
    username: string;
    displayName: string;
    email: string;
    password?: string;
    role?: {
        _id: Schema.Types.ObjectId;
        name: string;
    };

    isValidPassword(password: string): Promise<Error | boolean>;
}

export default User;
