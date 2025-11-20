import { supabase } from '../lib/supabase';

export interface FinancialRequirement {
  id: string;
  entity_id: string;
  category: string;
  requirement: string;
  min_value: number | null;
  max_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFinancialRequirementData {
  entity_id: string;
  category: string;
  requirement: string;
  min_value?: number;
  max_value?: number;
  notes?: string;
}

export const financialRequirementService = {
  /**
   * Obtener todos los requisitos
   * Según RLS, todos pueden verlos
   */
  async getAll(): Promise<FinancialRequirement[]> {
    const { data, error } = await supabase
      .from('financial_requirements')
      .select('*')
      .order('entity_id', { ascending: true })
      .order('category', { ascending: true });

    if (error) throw error;
    return (data || []) as FinancialRequirement[];
  },

  /**
   * Obtener requisitos por entidad financiera
   */
  async getByEntityId(entityId: string): Promise<FinancialRequirement[]> {
    const { data, error } = await supabase
      .from('financial_requirements')
      .select('*')
      .eq('entity_id', entityId)
      .order('category', { ascending: true })
      .order('requirement', { ascending: true });

    if (error) throw error;
    return (data || []) as FinancialRequirement[];
  },

  /**
   * Obtener requisitos por categoría
   */
  async getByCategory(category: string): Promise<FinancialRequirement[]> {
    const { data, error } = await supabase
      .from('financial_requirements')
      .select('*')
      .eq('category', category)
      .order('entity_id', { ascending: true });

    if (error) throw error;
    return (data || []) as FinancialRequirement[];
  },

  /**
   * Obtener un requisito por ID
   */
  async getById(id: string): Promise<FinancialRequirement | null> {
    const { data, error } = await supabase
      .from('financial_requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as FinancialRequirement;
  },

  /**
   * Crear un nuevo requisito (solo admins)
   */
  async create(requirementData: CreateFinancialRequirementData): Promise<FinancialRequirement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = {
      entity_id: requirementData.entity_id,
      category: requirementData.category,
      requirement: requirementData.requirement,
      min_value: requirementData.min_value || null,
      max_value: requirementData.max_value || null,
      notes: requirementData.notes || null,
    };

    const { data, error } = await supabase
      .from('financial_requirements')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialRequirement;
  },

  /**
   * Actualizar un requisito (solo admins)
   */
  async update(id: string, updates: Partial<CreateFinancialRequirementData>): Promise<FinancialRequirement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('financial_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialRequirement;
  },

  /**
   * Eliminar un requisito (solo admins)
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('financial_requirements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

