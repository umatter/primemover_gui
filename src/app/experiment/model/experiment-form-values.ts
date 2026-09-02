export type ExperimentFormValues = {
  name: string;
  description: string;
  contact: string;
  active: boolean;
  /** Runner account that executes the study; null = the API's default runner. */
  runner_user_id: number | null;
};
