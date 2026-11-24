export type AuthScreenType =
  | 'LOGIN'
  | 'SIGNUP'
  | 'FORGOT_PASSWORD'
  | 'RESET_PASSWORD';

export interface AuthAccountSummary {
  name: string;
  identifier: string;
  roleLabel: string;
  locationLabel: string;
  initials: string;
  portal: 'CUSTOMER' | 'SELLER' | 'ADMIN';
}
