import { supabase } from '../lib/supabase';

export interface CreditEvaluation {
  id: string;
  simulation_id: string;
  evaluated_by: string | null;
  credit_score: number | null;
  debt_to_income_ratio: number | null;
  payment_capacity: number | null;
  recommended_loan_amount: number | null;
  recommended_term_years: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'conditional';
  approval_amount: number | null;
  approval_term_years: number | null;
  approval_interest_rate: number | null;
  observations: string | null;
  rejection_reason: string | null;
  conditions: string | null;
  evaluated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCreditEvaluationData {
  simulation_id: string;
  credit_score?: number;
  debt_to_income_ratio?: number;
  payment_capacity?: number;
  recommended_loan_amount?: number;
  recommended_term_years?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'conditional';
  approval_amount?: number;
  approval_term_years?: number;
  approval_interest_rate?: number;
  observations?: string;
  rejection_reason?: string;
  conditions?: string;
}

export const creditEvaluationService = {
  /**
   * Obtener evaluación por ID de simulación
   */
  async getBySimulationId(simulationId: string): Promise<CreditEvaluation | null> {
    const { data, error } = await supabase
      .from('credit_evaluations')
      .select('*')
      .eq('simulation_id', simulationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as CreditEvaluation;
  },

  /**
   * Obtener todas las evaluaciones (solo admin)
   */
  async getAll(): Promise<CreditEvaluation[]> {
    const { data, error } = await supabase
      .from('credit_evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CreditEvaluation[];
  },

  /**
   * Obtener evaluaciones por estado
   */
  async getByStatus(status: CreditEvaluation['status']): Promise<CreditEvaluation[]> {
    const { data, error } = await supabase
      .from('credit_evaluations')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CreditEvaluation[];
  },

  /**
   * Crear una nueva evaluación crediticia (solo admin)
   */
  async create(evaluationData: CreateCreditEvaluationData): Promise<CreditEvaluation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = {
      simulation_id: evaluationData.simulation_id,
      evaluated_by: user.id,
      credit_score: evaluationData.credit_score || null,
      debt_to_income_ratio: evaluationData.debt_to_income_ratio || null,
      payment_capacity: evaluationData.payment_capacity || null,
      recommended_loan_amount: evaluationData.recommended_loan_amount || null,
      recommended_term_years: evaluationData.recommended_term_years || null,
      status: evaluationData.status || 'pending',
      approval_amount: evaluationData.approval_amount || null,
      approval_term_years: evaluationData.approval_term_years || null,
      approval_interest_rate: evaluationData.approval_interest_rate || null,
      observations: evaluationData.observations || null,
      rejection_reason: evaluationData.rejection_reason || null,
      conditions: evaluationData.conditions || null,
      evaluated_at: evaluationData.status && evaluationData.status !== 'pending' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('credit_evaluations')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data as CreditEvaluation;
  },

  /**
   * Actualizar una evaluación crediticia (solo admin)
   */
  async update(id: string, updates: Partial<CreateCreditEvaluationData>): Promise<CreditEvaluation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = { ...updates };
    
    // Si se cambia el status a algo diferente de pending, actualizar evaluated_at
    if (updates.status && updates.status !== 'pending') {
      updateData.evaluated_at = new Date().toISOString();
      updateData.evaluated_by = user.id;
    }

    const { data, error } = await supabase
      .from('credit_evaluations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CreditEvaluation;
  },

  /**
   * Eliminar una evaluación (solo admin)
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('credit_evaluations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

