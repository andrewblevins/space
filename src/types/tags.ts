export type TagCategory =
  | 'person'
  | 'place'
  | 'organization'
  | 'topic'
  | 'activity'
  | 'state'
  | 'other';

export interface Tag {
  value: string;
  category: TagCategory;
}
