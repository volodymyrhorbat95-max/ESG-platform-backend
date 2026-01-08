// User Service - Business logic for user management
// Supports 3 registration levels: minimal (email only), standard (email+name), full (all fields)

import { User } from '../database/models/index.js';
import { RegistrationLevel } from '../database/models/User.js';

// Input for minimal registration (CLAIM type - email only)
interface MinimalRegistrationData {
  email: string;
}

// Input for standard registration (email + name)
interface StandardRegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
}

// Input for full registration (all fields - required for 10+ euro transactions)
interface FullRegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
  termsAccepted: boolean;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
}

class UserService {
  // Create or find user with minimal registration (email only)
  // Used for CLAIM type transactions
  async findOrCreateMinimalUser(data: MinimalRegistrationData): Promise<User> {
    // Check if user exists by email
    let user = await User.findOne({ where: { email: data.email } });

    if (user) {
      return user;
    }

    // Create minimal user with only email
    user = await User.create({
      email: data.email,
      registrationLevel: 'minimal',
      corsairConnectFlag: false,
    });

    return user;
  }

  // Create or find user with standard registration (email + name)
  // Used for small PAY/ALLOCATION transactions under 10 euros
  async findOrCreateStandardUser(data: StandardRegistrationData): Promise<User> {
    // Validate terms acceptance
    if (!data.termsAccepted) {
      throw new Error('Terms and conditions must be accepted');
    }

    // Check if user exists by email
    let user = await User.findOne({ where: { email: data.email } });

    if (user) {
      // Update to standard if currently minimal
      if (user.registrationLevel === 'minimal') {
        await user.update({
          firstName: data.firstName,
          lastName: data.lastName,
          registrationLevel: 'standard',
          termsAcceptedAt: new Date(),
        });
      }
      return user;
    }

    // Create standard user
    user = await User.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      registrationLevel: 'standard',
      corsairConnectFlag: false,
      termsAcceptedAt: new Date(),
    });

    return user;
  }

  // Create or find user with full registration (all fields)
  // Required for transactions >= 10 euros (corsairConnectFlag = true)
  async findOrCreateFullUser(data: FullRegistrationData): Promise<User> {
    // Validate terms acceptance
    if (!data.termsAccepted) {
      throw new Error('Terms and conditions must be accepted');
    }

    // Check if user exists by email
    let user = await User.findOne({ where: { email: data.email } });

    if (user) {
      // Upgrade to full if not already
      if (user.registrationLevel !== 'full') {
        await user.update({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          street: data.street,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country,
          state: data.state,
          registrationLevel: 'full',
          corsairConnectFlag: true,
          termsAcceptedAt: new Date(),
        });
      }
      return user;
    }

    // Create full user
    user = await User.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      state: data.state,
      registrationLevel: 'full',
      corsairConnectFlag: true,
      termsAcceptedAt: new Date(),
    });

    return user;
  }

  // Upgrade user to full registration (when crossing 10 euro threshold)
  async upgradeToFullRegistration(userId: string, data: FullRegistrationData): Promise<User> {
    const user = await this.getUserById(userId);

    await user.update({
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      state: data.state,
      registrationLevel: 'full',
      corsairConnectFlag: true,
      termsAcceptedAt: user.termsAcceptedAt || new Date(),
    });

    return user;
  }

  // Set corsair connect flag on user
  async setCorsairConnectFlag(userId: string, flag: boolean): Promise<User> {
    const user = await this.getUserById(userId);
    await user.update({ corsairConnectFlag: flag });
    return user;
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    return await User.findOne({ where: { email } });
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return await User.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  // Update user profile
  async updateUser(id: string, updateData: UpdateUserData): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (updateData.firstName !== undefined) updates.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) updates.lastName = updateData.lastName;
    if (updateData.dateOfBirth !== undefined) updates.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.street !== undefined) updates.street = updateData.street;
    if (updateData.city !== undefined) updates.city = updateData.city;
    if (updateData.postalCode !== undefined) updates.postalCode = updateData.postalCode;
    if (updateData.country !== undefined) updates.country = updateData.country;
    if (updateData.state !== undefined) updates.state = updateData.state;

    await user.update(updates);
    return user;
  }

  // Delete user (soft delete - anonymize data for GDPR)
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete: Anonymize user data instead of hard delete
    // This preserves transaction history while removing PII
    await user.update({
      firstName: null,
      lastName: null,
      email: `deleted_${user.id}@anonymized.local`,
      dateOfBirth: null,
      street: null,
      city: null,
      postalCode: null,
      country: null,
      state: null,
    });

    return { success: true, message: 'User account deleted and anonymized' };
  }

  // Export user data (GDPR compliance)
  async exportUserData(id: string) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      personalInformation: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
        registrationLevel: user.registrationLevel,
        corsairConnectFlag: user.corsairConnectFlag,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        termsAcceptedAt: user.termsAcceptedAt,
      },
    };
  }
}

export default new UserService();
