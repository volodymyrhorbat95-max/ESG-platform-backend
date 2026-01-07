// User Service - Business logic for user management

import { User } from '../database/models/index.js';

interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state: string;
  termsAccepted: boolean;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
}

class UserService {
  // Find or create minimal user (CLAIM type - email only)
  async findOrCreateMinimalUser(email: string) {
    // Check if user exists by email
    let user = await User.findOne({ where: { email } });

    if (user) {
      return user;
    }

    // Create minimal user with placeholder data for required fields
    // This allows CLAIM type to work with just email
    user = await User.create({
      firstName: 'Guest',
      lastName: 'User',
      email,
      dateOfBirth: new Date('1900-01-01'), // Placeholder
      street: 'N/A',
      city: 'N/A',
      postalCode: '00000',
      country: 'N/A',
      state: 'N/A',
      termsAcceptedAt: new Date(),
    });

    return user;
  }

  // Find or create user (for transaction processing)
  async findOrCreateUser(data: CreateUserData) {
    // Check if user exists by email
    let user = await User.findOne({ where: { email: data.email } });

    if (user) {
      return user;
    }

    // Validate terms acceptance
    if (!data.termsAccepted) {
      throw new Error('Terms and conditions must be accepted');
    }

    // Create new user
    user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dateOfBirth: new Date(data.dateOfBirth),
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      state: data.state,
      termsAcceptedAt: new Date(),
    });

    return user;
  }

  // Get user by ID
  async getUserById(id: string) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Get user by email
  async getUserByEmail(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Get all users
  async getAllUsers() {
    return await User.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  // Update user profile
  async updateUser(id: string, updateData: UpdateUserData) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Only allow updating specific fields
    // email and dateOfBirth are NOT editable for security/compliance reasons
    const allowedFields: (keyof UpdateUserData)[] = [
      'firstName',
      'lastName',
      'street',
      'city',
      'postalCode',
      'country',
      'state',
    ];

    const filteredUpdates: Partial<UpdateUserData> = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredUpdates[field] = updateData[field];
      }
    });

    await user.update(filteredUpdates);
    return user;
  }

  // Delete user (soft delete - anonymize data)
  async deleteUser(id: string) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete: Anonymize user data instead of hard delete
    // This preserves transaction history while removing PII
    await user.update({
      firstName: 'Deleted',
      lastName: 'User',
      email: `deleted_${user.id}@anonymized.com`,
      street: 'Anonymized',
      city: 'Anonymized',
      postalCode: '00000',
      country: 'Anonymized',
      state: 'Anonymized',
    });

    return { success: true, message: 'User account deleted and anonymized' };
  }

  // Export user data (GDPR compliance)
  async exportUserData(id: string) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Return all user data in structured format for GDPR export
    return {
      personalInformation: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
      },
      address: {
        street: user.street,
        city: user.city,
        postalCode: user.postalCode,
        state: user.state,
        country: user.country,
      },
      accountInformation: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        termsAcceptedAt: user.termsAcceptedAt,
      },
    };
  }
}

export default new UserService();
