import { supabase } from '../lib/supabase';
import { LoanConfig, SimulationResult } from '../App';

export interface SimulationDB {
    id: string;
    user_id?: string;
    client_id: string | null;
    property_id: string | null;
    entity_id: string | null; // Nueva: Entidad financiera asociada
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled'; // Nueva: Estado
    property_price: number;
    down_payment: number;
    loan_amount: number;
    term_years: number;
    currency: 'PEN' | 'USD';
    rate_type: 'effective' | 'nominal';
    interest_rate: number;
    capitalization: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual' | null;
    grace_applies: boolean;
    grace_type: 'total' | 'partial' | null;
    grace_months: number | null;
    bonus_applies: boolean;
    bonus_type: 'bbp' | 'bfh' | null;
    bonus_amount: number | null;
    bfh_modalidad: 'compra' | 'construccion' | 'mejoramiento' | null;
    is_sustainable_housing: boolean;
    discount_rate_annual?: number | null;
    extra_monthly_costs?: number | null;
    // Nuevos campos de seguros
    insurance_life_rate?: number | null;
    insurance_life_amount?: number | null;
    insurance_property_rate?: number | null;
    insurance_property_amount?: number | null;
    commission_evaluation?: number | null;
    commission_disbursement?: number | null;
    administrative_fees?: number | null;
    // Resultados
    monthly_payment: number;
    tcea: number;
    trea: number;
    total_amount: number;
    total_interest: number;
    van: number;
    tir: number;
    duration: number;
    modified_duration: number;
    convexity: number;
    amortization_table: any;
    created_at?: string;
    updated_at?: string;
}

export interface CreateSimulationData {
    clientId?: string | null;
    propertyId?: string | null;
    entityId?: string | null; // Nueva: ID de entidad financiera
    config: LoanConfig;
    result: SimulationResult;
}

export const simulationService = {
    /**
     * Obtener todas las simulaciones del usuario actual
     * Los admins verán todas las simulaciones gracias a RLS
     */
    async getAll(): Promise<SimulationDB[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // RLS maneja automáticamente el acceso: usuarios ven solo las suyas, admins ven todas
        const { data, error } = await supabase
            .from('simulations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    },

    /**
     * Obtener simulaciones de un cliente
     */
    async getByClientId(clientId: string): Promise<SimulationDB[]> {
        const { data, error } = await supabase
            .from('simulations')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    },

    /**
     * Obtener simulaciones de una propiedad
     */
    async getByPropertyId(propertyId: string): Promise<SimulationDB[]> {
        const { data, error } = await supabase
            .from('simulations')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    },

    /**
     * Obtener una simulación por ID
     */
    async getById(id: string): Promise<SimulationDB | null> {
        const { data, error } = await supabase
            .from('simulations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return data;
    },

    /**
     * Crear una nueva simulación
     */
    async create(simulation: CreateSimulationData): Promise<SimulationDB> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { config, result, clientId, propertyId } = simulation;

        const dbData: any = {
            user_id: user.id,
            client_id: clientId || null,
            property_id: propertyId || null,
            entity_id: simulation.entityId || null,
            status: 'draft', // Por defecto es borrador
            property_price: config.propertyPrice,
            down_payment: config.downPayment,
            loan_amount: config.loanAmount,
            term_years: config.termYears,
            currency: config.currency,
            rate_type: config.rateType,
            interest_rate: config.interestRate,
            capitalization: config.capitalization || null,
            grace_applies: config.graceApplies,
            grace_type: config.graceType || null,
            grace_months: config.graceMonths || null,
            bonus_applies: config.bonusApplies,
            bonus_type: config.bonusType || null,
            bonus_amount: config.bonusAmount || null,
            bfh_modalidad: config.bfhModalidad || null,
            is_sustainable_housing: config.isSustainableHousing || false,
            discount_rate_annual: config.discountRateAnnual ?? null,
            extra_monthly_costs: config.extraMonthlyCosts ?? null,
            // Campos de seguros del LoanConfig
            insurance_life_rate: config.insuranceLifeRate ?? null,
            insurance_life_amount: config.insuranceLifeAmount ?? null,
            insurance_property_rate: config.insurancePropertyRate ?? null,
            insurance_property_amount: config.insurancePropertyAmount ?? null,
            commission_evaluation: config.commissionEvaluation ?? null,
            commission_disbursement: config.commissionDisbursement ?? null,
            administrative_fees: config.administrativeFees ?? null,
            // Resultados
            monthly_payment: result.monthlyPayment,
            tcea: result.tcea,
            trea: result.trea,
            total_amount: result.totalAmount,
            total_interest: result.totalInterest,
            van: result.van,
            tir: result.tir,
            duration: result.duration,
            modified_duration: result.modifiedDuration,
            convexity: result.convexity,
            amortization_table: result.amortizationTable
        };

        const { data, error } = await supabase
            .from('simulations')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return data;
    },

    /**
     * Actualizar una simulación
     */
    async update(id: string, updates: Partial<SimulationDB>): Promise<SimulationDB> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('simulations')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        return data;
    },

    /**
     * Eliminar una simulación
     */
    async delete(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('simulations')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    /**
     * Obtener simulaciones por estado
     */
    async getByStatus(status: SimulationDB['status']): Promise<SimulationDB[]> {
        const { data, error } = await supabase
            .from('simulations')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtener simulaciones por entidad financiera
     */
    async getByEntityId(entityId: string): Promise<SimulationDB[]> {
        const { data, error } = await supabase
            .from('simulations')
            .select('*')
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Cambiar estado de una simulación
     */
    async updateStatus(id: string, status: SimulationDB['status']): Promise<SimulationDB> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('simulations')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

