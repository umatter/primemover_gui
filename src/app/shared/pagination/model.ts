export interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: Link[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface Link {
  active: boolean;
  label: string | null;
  url: string | null;
}

export interface Links {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}
