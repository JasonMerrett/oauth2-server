import mongoose from 'mongoose';
import Role from './role.interface';

const Schema = mongoose.Schema;

const RoleSchema: mongoose.Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
});

export default mongoose.model<Role>('Role', RoleSchema);
