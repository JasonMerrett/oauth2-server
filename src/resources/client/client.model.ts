import mongoose from 'mongoose';
import Client from './client.interface';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const ClientSchema: mongoose.Schema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        clientId: {
            type: String,
            required: true,
            unique: true
        },
        clientSecret: {
            type: String
        },
        trusted: {
            type: Boolean,
            default: false
        },
        redirectURI: {
            type: String,
            required: true
        },
        logo: {
            type: String,
            required: true,
            default: 'https://via.placeholder.com/150'
        }
    },
    {
        timestamps: true
    }
);

ClientSchema.pre<Client>('save', function(next) {
    if (!this.isModified('clientSecret')) {
        return next();
    }

    bcrypt.hash(this.clientSecret, 10, (err: Error, hash: string): void => {
        if (err) return next(err);

        this.clientSecret = hash;
        next();
    });
});

ClientSchema.methods.isValidSecret = function(
    clientSecret: string
): Promise<Error | boolean> {
    return new Promise((resolve, reject) => {
        bcrypt.compare(clientSecret, this.clientSecret, (err, match) => {
            if (err) return reject(err);

            resolve(match);
        });
    });
};

ClientSchema.method('toJSON', function(this: Client) {
    const client: Client = this.toObject();
    delete client.clientSecret;
    delete client.trusted;
    return client;
});

export default mongoose.model<Client>('Client', ClientSchema);
