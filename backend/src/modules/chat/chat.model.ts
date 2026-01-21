import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    username: string;
    text: string;
    timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
    username: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

export const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
