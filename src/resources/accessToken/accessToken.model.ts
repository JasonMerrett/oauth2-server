import mongoose from 'mongoose';
import AccessToken from './accessToken.interface';

const Schema = mongoose.Schema;

const AccessTokenSchema = new Schema({
    token: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    clientId: {
        type: String,
        required: true
    },
    scope: [
        {
            type: String
        }
    ],
    expirationDate: {
        type: Date
    }
});

export default mongoose.model<AccessToken>('AccessToken', AccessTokenSchema);
