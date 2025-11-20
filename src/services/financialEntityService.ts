import { supabase } from '../lib/supabase';

export interface FinancialEntity {
  id: string;
  name: string;
  short_name: string | null;
  country: string;
  active: boolean;
  allowed_rate_types: ('effective' | 'nominal')[];
  allowed_capitalizations: ('monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual')[];
  min_down_payment: number | null;
  min_term_years: number | null;
  max_term_years: number | null;
  grace_allowed: boolean;
  grace_max_months: number | null;
  base_interest_rate: number | null;
  // Nuevos campos de seguros por defecto
  default_insurance_life_rate?: number | null;
  default_insurance_property_rate?: number | null;
  default_commission_evaluation?: number | null;
  default_commission_disbursement?: number | null;
  default_administrative_fees?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFinancialEntityData {
  name: string;
  short_name?: string;
  country?: string;
  active?: boolean;
  allowed_rate_types?: ('effective' | 'nominal')[];
  allowed_capitalizations?: ('monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual')[];
  min_down_payment?: number;
  min_term_years?: number;
  max_term_years?: number;
  grace_allowed?: boolean;
  grace_max_months?: number;
  base_interest_rate?: number;
  // Nuevos campos de seguros por defecto
  default_insurance_life_rate?: number;
  default_insurance_property_rate?: number;
  default_commission_evaluation?: number;
  default_commission_disbursement?: number;
  default_administrative_fees?: number;
}

export const financialEntityService = {
  /**
   * Obtener todas las entidades financieras
   * Según RLS, todos pueden verlas
   */
  async getAll(): Promise<FinancialEntity[]> {
    const { data, error } = await supabase
      .from('financial_entities')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as FinancialEntity[];
  },

  /**
   * Obtener entidades financieras activas
   */
  async getActive(): Promise<FinancialEntity[]> {
    const { data, error } = await supabase
      .from('financial_entities')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as FinancialEntity[];
  },

  /**
   * Obtener una entidad financiera por ID
   */
  async getById(id: string): Promise<FinancialEntity | null> {
    const { data, error } = await supabase
      .from('financial_entities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as FinancialEntity;
  },

  /**
   * Crear una nueva entidad financiera (solo admins)
   */
  async create(entityData: CreateFinancialEntityData): Promise<FinancialEntity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = {
      name: entityData.name,
      short_name: entityData.short_name || null,
      country: entityData.country || 'PE',
      active: entityData.active ?? true,
      allowed_rate_types: entityData.allowed_rate_types || ['effective', 'nominal'],
      allowed_capitalizations: entityData.allowed_capitalizations || ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'],
      min_down_payment: entityData.min_down_payment || null,
      min_term_years: entityData.min_term_years || null,
      max_term_years: entityData.max_term_years || null,
      grace_allowed: entityData.grace_allowed ?? true,
      grace_max_months: entityData.grace_max_months || null,
      base_interest_rate: entityData.base_interest_rate || null,
      default_insurance_life_rate: entityData.default_insurance_life_rate || null,
      default_insurance_property_rate: entityData.default_insurance_property_rate || null,
      default_commission_evaluation: entityData.default_commission_evaluation || null,
      default_commission_disbursement: entityData.default_commission_disbursement || null,
      default_administrative_fees: entityData.default_administrative_fees || null,
    };

    const { data, error } = await supabase
      .from('financial_entities')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialEntity;
  },

  /**
   * Actualizar una entidad financiera (solo admins)
   */
  async update(id: string, updates: Partial<CreateFinancialEntityData>): Promise<FinancialEntity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('financial_entities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialEntity;
  },

  /**
   * Eliminar una entidad financiera (solo admins)
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('financial_entities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

