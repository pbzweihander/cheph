import { AxiosError } from "axios";
import { ReactElement, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery, UseQueryResult } from "react-query";

import { useAxiosClient } from "./AxiosContext";
import { Metadata, MetadataWithName, TagsWithSample, User } from "./HttpTypes";

interface UseInfiniteQueryWithScrollRet<T> {
  data: T | undefined;
  error: string | undefined | unknown;
  isFetching: boolean;
  ObservationComponent: () => ReactElement;
}

export function useUserFromQuery(): UseQueryResult<User, AxiosError> {
  const client = useAxiosClient();
  return useQuery(
    ["user"],
    async () => {
      const resp = await client.get<User>("/api/user");
      return resp.data;
    },
    {
      retry: false,
    }
  );
}

export function useTagsWithSampleInfinite(): UseInfiniteQueryWithScrollRet<TagsWithSample> {
  const client = useAxiosClient();

  const { data, error, isFetching, fetchNextPage } = useInfiniteQuery(
    ["tags-with-sample"],
    async ({ pageParam = 0 }) => {
      const resp = await client.get<TagsWithSample>("/api/tags-with-sample", {
        params: { page: pageParam },
      });
      const nextPage =
        Object.entries(resp.data).length > 0 ? pageParam + 1 : undefined;
      return { result: resp.data, nextPage, isLast: !nextPage };
    },
    { getNextPageParam: (lastPage) => lastPage.nextPage }
  );

  const ObservationComponent = (): ReactElement => {
    const [ref, inView] = useInView();

    useEffect(() => {
      if (!data) return;

      const pageLastIdx = data.pages.length - 1;
      const isLast = data?.pages[pageLastIdx].isLast;

      if (!isLast && inView) fetchNextPage();
    }, [inView]);

    return <div ref={ref} />;
  };

  return {
    data: data?.pages.reduce(
      (result, value) => ({ ...result, ...value.result }),
      new Map<String, MetadataWithName>()
    ),
    error,
    isFetching,
    ObservationComponent,
  };
}

export function useMetadata(
  name: string | undefined
): UseQueryResult<Metadata | undefined, AxiosError> {
  const client = useAxiosClient();
  return useQuery(["metadata", name], async () => {
    if (!name) {
      return undefined;
    }
    const resp = await client.get<Metadata>(`/asset/metadata/${name}`);
    return resp.data;
  });
}

export function useMetadatasByTagInfinite(
  tag: string | undefined
): UseInfiniteQueryWithScrollRet<MetadataWithName[]> {
  const client = useAxiosClient();

  const { data, error, isFetching, fetchNextPage } = useInfiniteQuery(
    ["metadatas-by-tag", tag],
    async ({ pageParam = 0 }) => {
      if (!tag) {
        return { result: [], nextPage: undefined, isLast: true };
      }
      const resp = await client.get<MetadataWithName[]>(
        "/api/metadatas-by-tag",
        { params: { tag, page: pageParam } }
      );
      const nextPage = resp.data.length > 0 ? pageParam + 1 : undefined;
      return { result: resp.data, nextPage, isLast: !nextPage };
    },
    { getNextPageParam: (lastPage) => lastPage.nextPage }
  );

  const ObservationComponent = (): ReactElement => {
    const [ref, inView] = useInView();

    useEffect(() => {
      if (!data) return;

      const pageLastIdx = data.pages.length - 1;
      const isLast = data?.pages[pageLastIdx].isLast;

      if (!isLast && inView) fetchNextPage();
    }, [inView]);

    return <div ref={ref} />;
  };

  return {
    data: data?.pages.reduce(
      (result, value) => result.concat(value.result),
      new Array<MetadataWithName>()
    ),
    error,
    isFetching,
    ObservationComponent,
  };
}
