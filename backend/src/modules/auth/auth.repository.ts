import { UserModel, IUser } from './user.model';

export interface IAuthRepository {
    findUserByUsername(username: string): Promise<IUser | null>;
    findUserByEmail(email: string): Promise<IUser | null>;
    createUser(userData: Partial<IUser>): Promise<IUser>;
}

export class AuthRepository implements IAuthRepository {
    async findUserByUsername(username: string): Promise<IUser | null> {
        return await UserModel.findOne({ username });
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        return await UserModel.findOne({ email });
    }

    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData);
        return await user.save();
    }
}
