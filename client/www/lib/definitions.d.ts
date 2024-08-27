import { UUID } from 'crypto';

export type Note = {
  id: UUID;
  custom_properties: JSON;
};
export type Table = {
  id?: UUID;
  title: String;
  slug: String;
  color: String;
  custom_properties: JSON;
  is_private: Boolean;
  published_at: Date;
  minimap: JSON;
  notes: Note[];
};

export type Schema = {
  tables: Table;
  notes: Note;
};
