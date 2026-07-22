import api from './api';

export type BiodiversitySummary = {
  species_richness: number;
  species_frequency: Array<{ species: string; observations: number }>;
  endangered_species_count: number;
  observation_density: number;
  habitat_utilization: unknown[];
  population_trend: unknown[];
  observation_count: number;
};

/** Data source for future charts; intentionally returns raw aggregate data. */
export const getBiodiversitySummary = async (includeUnknown = false): Promise<BiodiversitySummary> => {
  const response = await api.get('/api/biodiversity/summary', {
    params: { include_unknown: includeUnknown }
  });
  return response.data;
};
