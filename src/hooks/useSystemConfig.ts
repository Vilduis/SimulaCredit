import { useQuery } from '@tanstack/react-query';
import { configService } from '../services/configService';
import { useMemo } from 'react';

// Valores por defecto hardcodeados (fallback)
const DEFAULT_VALUES = {
  defaultCurrency: 'PEN' as const,
  defaultInterestRate: 8.5,
  defaultTermYears: 20,
  defaultDownPayment: 20,
  enableGracePeriod: true,
  enableStateBonus: true,
  defaultDiscountRateAnnual: 8.0,
};

export function useSystemConfig() {
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['system_config'],
    queryFn: () => configService.getFirst(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Valores por defecto calculados (usa configuración si existe, sino usa fallback)
  const defaults = useMemo(() => {
    if (!config) {
      return DEFAULT_VALUES;
    }
    
    return {
      defaultCurrency: (config.default_currency ?? DEFAULT_VALUES.defaultCurrency) as 'PEN' | 'USD',
      defaultInterestRate: config.default_interest_rate ?? DEFAULT_VALUES.defaultInterestRate,
      defaultTermYears: config.default_term_years ?? DEFAULT_VALUES.defaultTermYears,
      defaultDownPayment: config.default_down_payment ?? DEFAULT_VALUES.defaultDownPayment,
      enableGracePeriod: config.enable_grace_period ?? DEFAULT_VALUES.enableGracePeriod,
      enableStateBonus: config.enable_state_bonus ?? DEFAULT_VALUES.enableStateBonus,
      defaultDiscountRateAnnual: config.default_discount_rate_annual ?? DEFAULT_VALUES.defaultDiscountRateAnnual,
    };
  }, [config]);

  return {
    config,
    isLoading,
    error,
    defaults,
  };
}

