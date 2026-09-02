export interface Experiment {
  id: number;
  name: string;
  contact: string;
  description: string;
  /** Runner account that executes the study; null = the API's default runner. */
  runner_user_id?: number | null;
  created_at: string;
  updated_at: string;
}
