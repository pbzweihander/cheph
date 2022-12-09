export interface User {
  primaryEmail: string;
  emails: string[];
}

export interface Metadata {
  creatorEmail: string;
  createdAt: string;
  tags: string[];
  description: string;
}

export type MetadataWithName = Metadata & { name: string };

export interface MetadataCreationRequest {
  tags: string;
  description: string;
}

export interface UploadReq {
  file: File;
  metadata: MetadataCreationRequest;
}

export type TagsWithSample = Map<String, MetadataWithName>;

export interface SearchReq {
  token: string;
}

export interface MetadataUpdateRequest {
  tags: string;
  description: string;
}
