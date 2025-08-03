const { cognito, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } = require('../config/aws');
const crypto = require('crypto');

class CognitoService {
  // Register a new user
  async registerUser(email, password, name, attributes = {}) {
    const params = {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'name',
          Value: name
        },
        ...Object.entries(attributes).map(([key, value]) => ({
          Name: key,
          Value: value
        }))
      ]
    };

    try {
      const result = await cognito.signUp(params).promise();
      return {
        success: true,
        userSub: result.UserSub,
        codeDeliveryDetails: result.CodeDeliveryDetails
      };
    } catch (error) {
      console.error('Cognito sign up error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Confirm user registration with verification code
  async confirmRegistration(email, confirmationCode) {
    const params = {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode
    };

    try {
      await cognito.confirmSignUp(params).promise();
      return { success: true };
    } catch (error) {
      console.error('Cognito confirm sign up error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Resend confirmation code
  async resendConfirmationCode(email) {
    const params = {
      ClientId: COGNITO_CLIENT_ID,
      Username: email
    };

    try {
      const result = await cognito.resendConfirmationCode(params).promise();
      return {
        success: true,
        codeDeliveryDetails: result.CodeDeliveryDetails
      };
    } catch (error) {
      console.error('Cognito resend confirmation error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Sign in user
  async signInUser(email, password) {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    };

    try {
      const result = await cognito.initiateAuth(params).promise();
      
      if (result.ChallengeName) {
        return {
          success: false,
          challenge: result.ChallengeName,
          session: result.Session,
          challengeParameters: result.ChallengeParameters
        };
      }

      return {
        success: true,
        tokens: {
          accessToken: result.AuthenticationResult.AccessToken,
          idToken: result.AuthenticationResult.IdToken,
          refreshToken: result.AuthenticationResult.RefreshToken,
          expiresIn: result.AuthenticationResult.ExpiresIn
        }
      };
    } catch (error) {
      console.error('Cognito sign in error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    };

    try {
      const result = await cognito.initiateAuth(params).promise();
      return {
        success: true,
        tokens: {
          accessToken: result.AuthenticationResult.AccessToken,
          idToken: result.AuthenticationResult.IdToken,
          expiresIn: result.AuthenticationResult.ExpiresIn
        }
      };
    } catch (error) {
      console.error('Cognito refresh token error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Sign out user
  async signOutUser(accessToken) {
    const params = {
      AccessToken: accessToken
    };

    try {
      await cognito.globalSignOut(params).promise();
      return { success: true };
    } catch (error) {
      console.error('Cognito sign out error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Get user details
  async getUser(accessToken) {
    const params = {
      AccessToken: accessToken
    };

    try {
      const result = await cognito.getUser(params).promise();
      
      const attributes = {};
      result.UserAttributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
      });

      return {
        success: true,
        user: {
          username: result.Username,
          attributes: attributes,
          userCreateDate: result.UserCreateDate,
          userLastModifiedDate: result.UserLastModifiedDate,
          enabled: result.Enabled,
          userStatus: result.UserStatus
        }
      };
    } catch (error) {
      console.error('Cognito get user error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Update user attributes
  async updateUserAttributes(accessToken, attributes) {
    const userAttributes = Object.entries(attributes).map(([key, value]) => ({
      Name: key,
      Value: value
    }));

    const params = {
      AccessToken: accessToken,
      UserAttributes: userAttributes
    };

    try {
      const result = await cognito.updateUserAttributes(params).promise();
      return {
        success: true,
        codeDeliveryDetailsList: result.CodeDeliveryDetailsList
      };
    } catch (error) {
      console.error('Cognito update user attributes error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Change password
  async changePassword(accessToken, previousPassword, proposedPassword) {
    const params = {
      AccessToken: accessToken,
      PreviousPassword: previousPassword,
      ProposedPassword: proposedPassword
    };

    try {
      await cognito.changePassword(params).promise();
      return { success: true };
    } catch (error) {
      console.error('Cognito change password error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Forgot password
  async forgotPassword(email) {
    const params = {
      ClientId: COGNITO_CLIENT_ID,
      Username: email
    };

    try {
      const result = await cognito.forgotPassword(params).promise();
      return {
        success: true,
        codeDeliveryDetails: result.CodeDeliveryDetails
      };
    } catch (error) {
      console.error('Cognito forgot password error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Confirm forgot password
  async confirmForgotPassword(email, confirmationCode, newPassword) {
    const params = {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    };

    try {
      await cognito.confirmForgotPassword(params).promise();
      return { success: true };
    } catch (error) {
      console.error('Cognito confirm forgot password error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Delete user account
  async deleteUser(accessToken) {
    const params = {
      AccessToken: accessToken
    };

    try {
      await cognito.deleteUser(params).promise();
      return { success: true };
    } catch (error) {
      console.error('Cognito delete user error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Admin operations (require admin privileges)
  async adminGetUser(username) {
    const params = {
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: username
    };

    try {
      const result = await cognito.adminGetUser(params).promise();
      
      const attributes = {};
      result.UserAttributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
      });

      return {
        success: true,
        user: {
          username: result.Username,
          attributes: attributes,
          userCreateDate: result.UserCreateDate,
          userLastModifiedDate: result.UserLastModifiedDate,
          enabled: result.Enabled,
          userStatus: result.UserStatus
        }
      };
    } catch (error) {
      console.error('Cognito admin get user error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  async adminCreateUser(email, name, temporaryPassword, attributes = {}) {
    const params = {
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email,
      TemporaryPassword: temporaryPassword,
      MessageAction: 'SUPPRESS', // Don't send welcome email
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'name',
          Value: name
        },
        {
          Name: 'email_verified',
          Value: 'true'
        },
        ...Object.entries(attributes).map(([key, value]) => ({
          Name: key,
          Value: value
        }))
      ]
    };

    try {
      const result = await cognito.adminCreateUser(params).promise();
      return {
        success: true,
        user: result.User
      };
    } catch (error) {
      console.error('Cognito admin create user error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  async adminDeleteUser(username) {
    const params = {
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: username
    };

    try {
      await cognito.adminDeleteUser(params).promise();
      return { success: true };
    } catch (error) {
      console.error('Cognito admin delete user error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      // This would typically use a JWT library to verify the token
      // For now, we'll use Cognito's getUser method
      const result = await this.getUser(token);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Handle Cognito errors
  handleCognitoError(error) {
    switch (error.code) {
      case 'UsernameExistsException':
        return 'An account with this email already exists';
      case 'InvalidPasswordException':
        return 'Password does not meet requirements';
      case 'UserNotConfirmedException':
        return 'Please verify your email address';
      case 'NotAuthorizedException':
        return 'Invalid email or password';
      case 'UserNotFoundException':
        return 'User not found';
      case 'CodeMismatchException':
        return 'Invalid verification code';
      case 'ExpiredCodeException':
        return 'Verification code has expired';
      case 'LimitExceededException':
        return 'Too many attempts. Please try again later';
      case 'TooManyRequestsException':
        return 'Too many requests. Please try again later';
      default:
        return error.message || 'Authentication error occurred';
    }
  }

  // Generate secure random password
  generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  // List users (admin operation)
  async listUsers(limit = 60, paginationToken = null) {
    const params = {
      UserPoolId: COGNITO_USER_POOL_ID,
      Limit: limit
    };

    if (paginationToken) {
      params.PaginationToken = paginationToken;
    }

    try {
      const result = await cognito.listUsers(params).promise();
      return {
        success: true,
        users: result.Users,
        paginationToken: result.PaginationToken
      };
    } catch (error) {
      console.error('Cognito list users error:', error);
      throw new Error(this.handleCognitoError(error));
    }
  }
}

module.exports = new CognitoService();
