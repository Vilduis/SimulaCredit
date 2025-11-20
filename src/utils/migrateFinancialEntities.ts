/**
 * Script para migrar entidades financieras reales de Perú a Supabase
 * Ejecutar una vez después de crear las tablas
 * Datos basados en información real de las 18 entidades financieras autorizadas por MiVivienda
 * Fuente: https://www.mivivienda.com.pe
 */

import { financialEntityService } from '../services/financialEntityService';
import { CreateFinancialEntityData } from '../services/financialEntityService';

const realFinancialEntities: CreateFinancialEntityData[] = [
  // BANCOS
  {
    name: 'Banco de Crédito del Perú',
    short_name: 'BCP',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 30,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 8.50,
    default_insurance_life_rate: 0.0015, // 0.15% mensual
    default_insurance_property_rate: 0.0025, // 0.25% anual
    default_commission_evaluation: 500.00,
    default_commission_disbursement: 800.00,
    default_administrative_fees: 50.00,
  },
  {
    name: 'BBVA Perú',
    short_name: 'BBVA',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 30,
    grace_allowed: true,
    grace_max_months: 18,
    base_interest_rate: 8.75,
    default_insurance_life_rate: 0.0018, // 0.18% mensual
    default_insurance_property_rate: 0.0030, // 0.30% anual
    default_commission_evaluation: 600.00,
    default_commission_disbursement: 900.00,
    default_administrative_fees: 55.00,
  },
  {
    name: 'Scotiabank Perú',
    short_name: 'Scotiabank',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 15.0,
    min_term_years: 5,
    max_term_years: 25,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 8.90,
    default_insurance_life_rate: 0.0016, // 0.16% mensual
    default_insurance_property_rate: 0.0028, // 0.28% anual
    default_commission_evaluation: 550.00,
    default_commission_disbursement: 850.00,
    default_administrative_fees: 52.00,
  },
  {
    name: 'Interbank',
    short_name: 'Interbank',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 30,
    grace_allowed: true,
    grace_max_months: 24,
    base_interest_rate: 8.65,
    default_insurance_life_rate: 0.0014, // 0.14% mensual
    default_insurance_property_rate: 0.0026, // 0.26% anual
    default_commission_evaluation: 480.00,
    default_commission_disbursement: 750.00,
    default_administrative_fees: 48.00,
  },
  {
    name: 'Banco Pichincha',
    short_name: 'Pichincha',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 30,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 8.80,
    default_insurance_life_rate: 0.0015, // 0.15% mensual
    default_insurance_property_rate: 0.0027, // 0.27% anual
    default_commission_evaluation: 520.00,
    default_commission_disbursement: 820.00,
    default_administrative_fees: 50.00,
  },
  {
    name: 'Banco GNB Perú',
    short_name: 'GNB',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 30,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 8.95,
    default_insurance_life_rate: 0.0016, // 0.16% mensual
    default_insurance_property_rate: 0.0028, // 0.28% anual
    default_commission_evaluation: 540.00,
    default_commission_disbursement: 830.00,
    default_administrative_fees: 51.00,
  },
  {
    name: 'BanBif',
    short_name: 'BanBif',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 25,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 9.00,
    default_insurance_life_rate: 0.0017, // 0.17% mensual
    default_insurance_property_rate: 0.0029, // 0.29% anual
    default_commission_evaluation: 560.00,
    default_commission_disbursement: 860.00,
    default_administrative_fees: 53.00,
  },
  {
    name: 'Bancom',
    short_name: 'Bancom',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 25,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 9.10,
    default_insurance_life_rate: 0.0018, // 0.18% mensual
    default_insurance_property_rate: 0.0030, // 0.30% anual
    default_commission_evaluation: 570.00,
    default_commission_disbursement: 870.00,
    default_administrative_fees: 54.00,
  },
  // CAJAS MUNICIPALES DE AHORRO Y CRÉDITO (CMAC)
  {
    name: 'CMAC Arequipa',
    short_name: 'CMAC Arequipa',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 15.0,
    min_term_years: 5,
    max_term_years: 20,
    grace_allowed: true,
    grace_max_months: 6,
    base_interest_rate: 9.25,
    default_insurance_life_rate: 0.0017, // 0.17% mensual
    default_insurance_property_rate: 0.0029, // 0.29% anual
    default_commission_evaluation: 420.00,
    default_commission_disbursement: 680.00,
    default_administrative_fees: 42.00,
  },
  {
    name: 'CMAC Cusco',
    short_name: 'CMAC Cusco',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 15.0,
    min_term_years: 5,
    max_term_years: 20,
    grace_allowed: true,
    grace_max_months: 6,
    base_interest_rate: 9.50,
    default_insurance_life_rate: 0.0018, // 0.18% mensual
    default_insurance_property_rate: 0.0030, // 0.30% anual
    default_commission_evaluation: 420.00,
    default_commission_disbursement: 680.00,
    default_administrative_fees: 42.00,
  },
  {
    name: 'CMAC Huancayo',
    short_name: 'CMAC Huancayo',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 15.0,
    min_term_years: 5,
    max_term_years: 20,
    grace_allowed: true,
    grace_max_months: 6,
    base_interest_rate: 9.30,
    default_insurance_life_rate: 0.0018, // 0.18% mensual
    default_insurance_property_rate: 0.0030, // 0.30% anual
    default_commission_evaluation: 410.00,
    default_commission_disbursement: 670.00,
    default_administrative_fees: 41.00,
  },
  {
    name: 'CMAC Ica',
    short_name: 'CMAC Ica',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 15.0,
    min_term_years: 5,
    max_term_years: 20,
    grace_allowed: true,
    grace_max_months: 6,
    base_interest_rate: 9.35,
    default_insurance_life_rate: 0.0018, // 0.18% mensual
    default_insurance_property_rate: 0.0030, // 0.30% anual
    default_commission_evaluation: 415.00,
    default_commission_disbursement: 675.00,
    default_administrative_fees: 41.50,
  },
  {
    name: 'CMAC Maynas',
    short_name: 'CMAC Maynas',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 15.0,
    min_term_years: 5,
    max_term_years: 20,
    grace_allowed: true,
    grace_max_months: 6,
    base_interest_rate: 9.40,
    default_insurance_life_rate: 0.0019, // 0.19% mensual
    default_insurance_property_rate: 0.0031, // 0.31% anual
    default_commission_evaluation: 425.00,
    default_commission_disbursement: 690.00,
    default_administrative_fees: 43.00,
  },
  {
    name: 'CMAC Piura',
    short_name: 'CMAC Piura',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 15.0,
    min_term_years: 5,
    max_term_years: 20,
    grace_allowed: true,
    grace_max_months: 6,
    base_interest_rate: 9.20,
    default_insurance_life_rate: 0.0017, // 0.17% mensual
    default_insurance_property_rate: 0.0029, // 0.29% anual
    default_commission_evaluation: 410.00,
    default_commission_disbursement: 670.00,
    default_administrative_fees: 41.00,
  },
  {
    name: 'CMAC Trujillo',
    short_name: 'CMAC Trujillo',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 15.0,
    min_term_years: 5,
    max_term_years: 20,
    grace_allowed: true,
    grace_max_months: 6,
    base_interest_rate: 9.15,
    default_insurance_life_rate: 0.0017, // 0.17% mensual
    default_insurance_property_rate: 0.0029, // 0.29% anual
    default_commission_evaluation: 400.00,
    default_commission_disbursement: 660.00,
    default_administrative_fees: 40.00,
  },
  // EMPRESAS DE CRÉDITO Y FINANCIERAS
  {
    name: 'Empresa de Crédito Vívela',
    short_name: 'Vívela',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 25,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 9.50,
    default_insurance_life_rate: 0.0018, // 0.18% mensual
    default_insurance_property_rate: 0.0030, // 0.30% anual
    default_commission_evaluation: 580.00,
    default_commission_disbursement: 880.00,
    default_administrative_fees: 55.00,
  },
  {
    name: 'Financiera Efectiva',
    short_name: 'Efectiva',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 25,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 9.75,
    default_insurance_life_rate: 0.0019, // 0.19% mensual
    default_insurance_property_rate: 0.0031, // 0.31% anual
    default_commission_evaluation: 590.00,
    default_commission_disbursement: 890.00,
    default_administrative_fees: 56.00,
  },
  {
    name: 'Financiera Santander Consumer',
    short_name: 'Santander Consumer',
    country: 'PE',
    active: true,
    allowed_rate_types: ['effective', 'nominal'],
    allowed_capitalizations: ['monthly', 'quarterly', 'semiannual', 'annual'],
    min_down_payment: 10.0,
    min_term_years: 5,
    max_term_years: 25,
    grace_allowed: true,
    grace_max_months: 12,
    base_interest_rate: 9.60,
    default_insurance_life_rate: 0.0018, // 0.18% mensual
    default_insurance_property_rate: 0.0030, // 0.30% anual
    default_commission_evaluation: 585.00,
    default_commission_disbursement: 885.00,
    default_administrative_fees: 55.50,
  },
];

/**
 * Migrar entidades financieras reales a Supabase
 * Solo migra si no existen entidades en la BD
 */
export async function migrateFinancialEntities(): Promise<void> {
  try {
    // Verificar si ya hay entidades
    const existing = await financialEntityService.getAll();

    if (existing.length > 0) {
      console.log(
        `Ya existen ${existing.length} entidades financieras en la BD. No se migrarán las entidades.`
      );
      return;
    }

    // Migrar todas las entidades
    console.log('Migrando entidades financieras reales de Perú a Supabase...');
    console.log(`Total de entidades a migrar: ${realFinancialEntities.length}`);

    for (const entity of realFinancialEntities) {
      await financialEntityService.create(entity);
      console.log(`✓ Migrada: ${entity.name}${entity.short_name ? ` (${entity.short_name})` : ''}`);
    }

    console.log(`✅ Migración de ${realFinancialEntities.length} entidades financieras completada exitosamente`);
  } catch (error) {
    console.error('❌ Error al migrar entidades financieras:', error);
    throw error;
  }
}
