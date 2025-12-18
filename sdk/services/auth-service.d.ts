import { HttpClient } from '../client/http-client';
import * as types from '../types/auth';
export declare class AuthService {
    private http;
    constructor(http: HttpClient);
    register(params: types.RegisterParams): Promise<import("..").StandardResponse<any>>;
    login(params: types.LoginParams): Promise<import("..").StandardResponse<any>>;
    refreshToken(params: types.RefreshTokenParams): Promise<import("..").StandardResponse<any>>;
    verifyOtp(params: types.VerifyOtpParams): Promise<import("..").StandardResponse<any>>;
    resendOtp(params: types.ResendOtpParams): Promise<import("..").StandardResponse<any>>;
    resetPassword(params: types.ResetPasswordParams): Promise<import("..").StandardResponse<any>>;
    forgotPassword(params: types.ForgotPasswordParams): Promise<import("..").StandardResponse<any>>;
    loginByIdentityProvider(provider: string): Promise<import("..").StandardResponse<any>>;
    logout(params: types.LogoutParams): Promise<import("..").StandardResponse<any>>;
    callback(queryString: string): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=auth-service.d.ts.map