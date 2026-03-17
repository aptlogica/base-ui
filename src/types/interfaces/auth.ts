// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export interface LoginParams {
  email: string;
  password: string;
}

export interface VerifyOtpParams {
  token: string;
  otp: string;
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