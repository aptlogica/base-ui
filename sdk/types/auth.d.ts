export interface LoginParams {
    email: string;
    password: string;
}
export interface RegisterParams {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}
export interface VerifyOtpParams {
    token: string;
    otp: string;
}
export interface ValidateTokenParams {
    token: string;
}
export interface VerifyTokenParams {
    token: string;
}
export interface RefreshTokenParams {
    refresh_token: string;
}
export interface ResendOtpParams {
    token: string;
}
export interface ResetPasswordParams {
    token: string;
    new_password: string;
}
export interface ForgotPasswordParams {
    email: string;
}
export interface LogoutParams {
    token: string;
}
//# sourceMappingURL=auth.d.ts.map