import mongoose, { Document, Schema } from 'mongoose';

export interface IPollOption {
    id: string;
    text: string;
    votes: number;
}

export interface IPoll extends Document {
    question: string;
    options: IPollOption[];
    active: boolean;
    votedBy: { user: string; optionId: string }[];
}

const pollMsgSchema = new Schema({
    user: { type: String, required: true },
    optionId: { type: String, required: true }
}, { _id: false });

const pollOptionSchema = new Schema<IPollOption>({
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
});

const pollSchema = new Schema<IPoll>({
    question: { type: String, required: true },
    options: [pollOptionSchema],
    active: { type: Boolean, default: true },
    votedBy: [pollMsgSchema]
});

export const PollModel = mongoose.model<IPoll>('Poll', pollSchema);
