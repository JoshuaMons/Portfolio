export type PublishStatus = 'draft' | 'published';

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string | null;
  tags: string[];
  thumbnail_url: string | null;
  status: PublishStatus;
  /** Optioneel: geüploade mini-site (ZIP); assets via `/api/mini-project/{token}/…`. */
  mini_project_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PublishStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherAssignment {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string | null;
  tags: string[];
  thumbnail_url: string | null;
  status: PublishStatus;
  /** Optioneel gekoppeld docent-bestand uit `files`. */
  attached_file_id?: string | null;
  created_at: string;
  updated_at: string;
}

