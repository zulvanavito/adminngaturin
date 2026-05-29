export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface CombinedUser {
  user_id: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  email?: string;
  display_name?: string;
  plan: 'free' | 'plus' | 'pro';
  gamification: {
    xp: number;
    level: number;
    current_streak: number;
  };
}
