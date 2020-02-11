import { Document, Schema } from 'mongoose';

interface Client extends Document {
    _id: Schema.Types.ObjectId;
    userId?: Schema.Types.ObjectId;
    clientId: string;
    clientSecret?: string;
    trusted: boolean;
    redirectURI: string;
    logo: string;
    scope?: string[];

    isValidSecret(secret: string): boolean;
    toJSON(): Client;
}

export default Client;
