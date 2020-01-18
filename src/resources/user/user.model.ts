import mongoose from 'mongoose';
import User from './user.interface';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const UserSchema: mongoose.Schema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        // same as username but not lowercase
        displayName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        role: {
            type: Schema.Types.ObjectId,
            ref: 'role'
        }
    },
    {
        timestamps: true
    }
);

UserSchema.pre<User>('save', function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    bcrypt.hash(this.password, 10, (err: Error, hash: string): void => {
        if (err) return next(err);

        this.password = hash;
        next();
    });
});

UserSchema.methods.isValidPassword = function(
    password: string
): Promise<Error | boolean> {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, this.password, (err, match) => {
            if (err) return reject(err);

            resolve(match);
        });
    });
};

export default mongoose.model<User>('User', UserSchema);
