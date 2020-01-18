import { Document, Schema } from 'mongoose';

interface Role extends Document {
    _id: Schema.Types.ObjectId;
    name: string;
}

export default Role;
