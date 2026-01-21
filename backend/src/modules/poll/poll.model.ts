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
}

const pollOptionSchema = new Schema<IPollOption>({
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
});

const pollSchema = new Schema<IPoll>({
    question: { type: String, required: true },
    options: [pollOptionSchema],
    active: { type: Boolean, default: true },
});

export const PollModel = mongoose.model<IPoll>('Poll', pollSchema);
