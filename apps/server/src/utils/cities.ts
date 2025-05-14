/**
 * List of cities in Bahia, Brazil.
 */
export const CITIES = [
  'Salvador',
  'Feira de Santana',
  'Vitória da Conquista',
  'Ilhéus',
  'Itabuna',
  'Juazeiro',
  'Barreiras',
  'Alagoinhas',
  'Eunápolis',
  'Porto Seguro',
  'Jequié',
  'Teixeira de Freitas',
  'Paulo Afonso',
  'Santo Antônio de Jesus',
  'Simões Filho',
  'Lauro de Freitas',
  'Camaçari',
  'Jacobina',
  'Serrinha',
  'Irecê',
] as const;

/**
 * Type representing a city in Bahia, Brazil.
 */
export type City = (typeof CITIES)[number];
