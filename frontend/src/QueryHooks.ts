import { AxiosError } from "axios";
import { useQuery, UseQueryResult } from "react-query";

import { useAxiosClient } from "./AxiosContext";
import { Metadata, MetadataWithName, TagsWithSample, User } from "./HttpTypes";

export function useUserFromQuery(): UseQueryResult<User, AxiosError> {
  const client = useAxiosClient();
  return useQuery(
    ["user"],
    async () => {
      const resp = await client.get("/api/user");
      return resp.data as User;
    },
    {
      retry: false,
    }
  );
}

export function useTagsWithSample(): UseQueryResult<
  TagsWithSample,
  AxiosError
> {
  const client = useAxiosClient();
  return useQuery(["tags-with-sample"], async () => {
    const resp = await client.get("/api/tags-with-sample");
    return resp.data as TagsWithSample;
  });
}

export function useMetadata(
  name: string | undefined
): UseQueryResult<Metadata | undefined, AxiosError> {
  const client = useAxiosClient();
  return useQuery(["metadata", name], async () => {
    if (!name) {
      return undefined;
    }
    const resp = await client.get(`/asset/metadata/${name}`);
    return resp.data as Metadata;
  });
}

export function useMetadatasByTag(
  tag: string | undefined
): UseQueryResult<MetadataWithName[], AxiosError> {
  const client = useAxiosClient();
  return useQuery(["metadatas-by-tag", tag], async () => {
    if (!tag) {
      return [];
    }
    const resp = await client.get("/api/metadatas-by-tag", { params: { tag } });
    return resp.data as MetadataWithName[];
  });
}
