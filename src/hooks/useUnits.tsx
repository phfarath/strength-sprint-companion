import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';

export const useUnits = () => {
  const { settings } = useAppContext();
  const { units } = settings.appearance;

  const api = useMemo(() => ({
    units,
    toWeight: (kg: number) => (units.weight === 'lb' ? kg * 2.20462 : kg),
    fromWeight: (value: number) => (units.weight === 'lb' ? value / 2.20462 : value),
    toLength: (cm: number) => (units.length === 'in' ? cm / 2.54 : cm),
    fromLength: (value: number) => (units.length === 'in' ? value * 2.54 : value),
    toEnergy: (kcal: number) => (units.energy === 'kJ' ? kcal * 4.184 : kcal),
    fromEnergy: (value: number) => (units.energy === 'kJ' ? value / 4.184 : value),
    formatWeight: (kg: number, digits = 1) =>
      `${api.toWeight(kg).toFixed(digits)} ${units.weight}`,
    formatLength: (cm: number, digits = 1) =>
      `${api.toLength(cm).toFixed(digits)} ${units.length}`,
    formatEnergy: (kcal: number, digits = 0) =>
      `${Math.round(api.toEnergy(kcal))}${units.energy}`,
  }), [units]);

  return api;
};

