/** A runner account an experiment may be assigned to (GET /runners). */
export interface Runner {
  id: number;
  name: string;
  email: string;
  is_default: boolean;
}
