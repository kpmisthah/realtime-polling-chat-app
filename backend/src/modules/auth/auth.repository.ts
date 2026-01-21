import { User, IUser } from './auth.model';

class AuthRepository {
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = await User.create(userData);
        return user;
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email }).select('+password');
    }

    async findUserById(id: string): Promise<IUser | null> {
        return await User.findById(id);
    }

    async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
        return await User.findByIdAndUpdate(id, updateData, { new: true });
    }
}

export default new AuthRepository();
