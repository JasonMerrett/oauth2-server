import mongoose from 'mongoose';
import AuthCode from './authorisationCode.interface';

const Schema = mongoose.Schema;

const AuthCodeSchema = new Schema({
    code: {
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
    redirectURI: {
        type: String
    },
    scope: [
        {
            type: String
        }
    ]
});

export default mongoose.model<AuthCode>('AuthCode', AuthCodeSchema);
