import { HttpClient } from '../client/http-client';
import * as types from '../types/auth';
export declare class AuthService {
    private http;
    constructor(http: HttpClient);
    /**
     * Login with email and password
     * POST /auth/login
     */
    login(params: types.LoginParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Verify email with OTP
     * POST /auth/otp/verify
     */
    verifyOtp(params: types.VerifyOtpParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Resend OTP
     * POST /auth/otp/resend
     */
    resendOtp(params: types.ResendOtpParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Request password reset
     * POST /auth/forgot-password
     */
    forgotPassword(params: types.ForgotPasswordParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Reset password with token
     * POST /auth/reset-password
     */
    resetPassword(params: types.ResetPasswordParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Validate if token is valid
     * POST /auth/validate-token
     */
    validateToken(params: types.ValidateTokenParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Verify token validity
     * POST /auth/verify-token
     */
    verifyToken(params: types.VerifyTokenParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Logout and invalidate token
     * POST /auth/logout
     */
    logout(params: types.LogoutParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Login with identity provider
     * @deprecated Use OAuth/identity provider flows
     */
    loginByIdentityProvider(provider: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Callback for identity provider login
     * @deprecated Use OAuth/identity provider flows
     */
    callback(queryString: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Refresh token
     * @deprecated Use standard refresh token flow
     */
    refreshToken(params: types.RefreshTokenParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Register new user
     * @deprecated Use standard auth flow
     */
    register(params: types.RegisterParams): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=auth-service.d.ts.map