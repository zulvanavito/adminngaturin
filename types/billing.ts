export type SubscriptionStatus = 'pending' | 'settlement' | 'expire' | 'cancel' | 'deny' | 'refund' | 'partial_refund';
export type SubscriptionPlan = 'plus' | 'pro';
export type SubscriptionInterval = 'monthly' | 'yearly';

export interface SubscriptionLog {
  id: string;
  user_id: string;
  plan_id: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  interval: SubscriptionInterval;
  current_period_start: string;
  current_period_end: string | null;
  midtrans_order_id: string | null;
  payment_type: string | null;
  snap_token: string | null;
  created_at: string;
  updated_at: string;
  // Joined or RPC data
  email?: string;
  display_name?: string;
}

export interface MidtransStatusResponse {
  transaction_status: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  payment_type: string;
  transaction_time: string;
  gross_amount: string;
  currency: string;
  settlement_time?: string;
  signature_key: string;
  fraud_status?: string;
}
