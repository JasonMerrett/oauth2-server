import mongoose from 'mongoose';
import RefreshToken from './refreshToken.interface';

const Schema = mongoose.Schema;

const RefreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true
    },
    userId: {
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

export default mongoose.model<RefreshToken>('RefreshToken', RefreshTokenSchema);
