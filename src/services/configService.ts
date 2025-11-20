import { supabase } from '../lib/supabase';

export interface SystemConfigDB {
  id: string;
  default_currency: 'PEN' | 'USD' | null;
  default_interest_rate: number | null;
  default_term_years: number | null;
  default_down_payment: number | null;
  enable_grace_period: boolean | null;
  enable_state_bonus: boolean | null;
  default_discount_rate_annual?: number | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const configService = {
  async getFirst(): Promise<SystemConfigDB | null> {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (data && data.length > 0) ? data[0] as SystemConfigDB : null;
  },

  async upsertFinancialSettings(settings: {
    default_currency: 'PEN' | 'USD';
    default_interest_rate: number;
    default_term_years: number;
    default_down_payment: number;
    enable_grace_period: boolean;
    enable_state_bonus: boolean;
    default_discount_rate_annual?: number;
  }): Promise<SystemConfigDB> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const existing = await this.getFirst();

    if (existing) {
      const { data, error } = await supabase
        .from('system_config')
        .update({
          default_currency: settings.default_currency,
          default_interest_rate: settings.default_interest_rate,
          default_term_years: settings.default_term_years,
          default_down_payment: settings.default_down_payment,
          enable_grace_period: settings.enable_grace_period,
          enable_state_bonus: settings.enable_state_bonus,
          default_discount_rate_annual: settings.default_discount_rate_annual ?? null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      // Log de operación
      try {
        await supabase.from('operations_log').insert({
          user_id: user.id,
          action: 'UPDATE',
          entity: 'system_config',
          entity_id: existing.id,
          details: {
            default_currency: settings.default_currency,
            default_interest_rate: settings.default_interest_rate,
            default_term_years: settings.default_term_years
          }
        });
      } catch (_) { }

      return data as SystemConfigDB;
    } else {
      const { data, error } = await supabase
        .from('system_config')
        .insert({
          default_currency: settings.default_currency,
          default_interest_rate: settings.default_interest_rate,
          default_term_years: settings.default_term_years,
          default_down_payment: settings.default_down_payment,
          enable_grace_period: settings.enable_grace_period,
          enable_state_bonus: settings.enable_state_bonus,
          default_discount_rate_annual: settings.default_discount_rate_annual ?? null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log de operación
      try {
        await supabase.from('operations_log').insert({
          user_id: user.id,
          action: 'CREATE',
          entity: 'system_config',
          entity_id: data.id,
          details: {
            default_currency: settings.default_currency,
            default_interest_rate: settings.default_interest_rate,
            default_term_years: settings.default_term_years
          }
        });
      } catch (_) { }

      return data as SystemConfigDB;
    }
  }
};
