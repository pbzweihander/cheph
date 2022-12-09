import { AxiosError, AxiosInstance, isAxiosError } from "axios";
import { ReactElement, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
  UseQueryResult,
} from "react-query";
import { useLocation } from "react-router-dom";

import { useAxiosClient } from "./AxiosContext";
import { Metadata, MetadataWithName, TagsWithSample, User } from "./HttpTypes";

async function get<T>(
  client: AxiosInstance,
  url: string,
  currentPath: string,
  params?: any
): Promise<T | undefined> {
  try {
    const resp = await client.get<T>(url, {
      params,
    });
    return resp.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        return undefined;
      } else if (error.response?.status === 401) {
        window.location.replace(`/auth/github?redirect=${currentPath}`);
        return undefined;
      }
    }
    throw error;
  }
}

function makeObservationComponent<T>(
  data: InfiniteData<{ result: T; isLast: boolean }> | undefined,
  fetchNextPage: Function
): () => ReactElement {
  return (): ReactElement => {
    const [ref, inView] = useInView();

    useEffect(() => {
      if (!data) return;

      const pageLastIdx = data.pages.length - 1;
      const isLast = data?.pages[pageLastIdx].isLast;

      if (!isLast && inView) fetchNextPage();
    }, [inView]);

    return <div ref={ref} />;
  };
}

interface UseInfiniteQueryWithScrollRet<T> {
  data: T | undefined;
  error: string | undefined | unknown;
  isFetching: boolean;
  ObservationComponent: () => ReactElement;
}

export function useUserFromQuery(): UseQueryResult<User, AxiosError> {
  const location = useLocation();
  const client = useAxiosClient();
  return useQuery(
    ["user"],
    async () => {
      const resp = await get<User>(client, "/api/user", location.pathname);
      return resp;
    },
    {
      retry: false,
    }
  );
}

export function useTagsWithSampleInfinite(): UseInfiniteQueryWithScrollRet<TagsWithSample> {
  const location = useLocation();
  const client = useAxiosClient();

  const { data, error, isFetching, fetchNextPage } = useInfiniteQuery(
    ["tags-with-sample"],
    async ({ pageParam = 0 }) => {
      const resp =
        (await get<TagsWithSample>(
          client,
          "/api/tags-with-sample",
          location.pathname,
          { page: pageParam }
        )) || {};
      const nextPage =
        Object.entries(resp).length > 0 ? pageParam + 1 : undefined;
      return { result: resp, nextPage, isLast: !nextPage };
    },
    { getNextPageParam: (lastPage) => lastPage.nextPage }
  );

  const ObservationComponent = makeObservationComponent(data, fetchNextPage);

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
  const location = useLocation();
  const client = useAxiosClient();

  return useQuery(["metadata", name], async () => {
    if (!name) {
      return undefined;
    }
    const resp = await get<Metadata>(
      client,
      `/asset/metadata/${name}`,
      location.pathname
    );
    return resp;
  });
}

export function useMetadatasInfinite(): UseInfiniteQueryWithScrollRet<
  MetadataWithName[]
> {
  const location = useLocation();
  const client = useAxiosClient();

  const { data, error, isFetching, fetchNextPage } = useInfiniteQuery(
    ["metadatas"],
    async ({ pageParam = 0 }) => {
      const resp =
        (await get<MetadataWithName[]>(
          client,
          "/api/metadatas",
          location.pathname,
          { page: pageParam }
        )) || [];
      const nextPage = resp.length > 0 ? pageParam + 1 : undefined;
      return { result: resp, nextPage, isLast: !nextPage };
    },
    { getNextPageParam: (lastPage) => lastPage.nextPage }
  );

  const ObservationComponent = makeObservationComponent(data, fetchNextPage);

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

export function useMetadatasByTagInfinite(
  tag: string | undefined
): UseInfiniteQueryWithScrollRet<MetadataWithName[]> {
  const location = useLocation();
  const client = useAxiosClient();

  const { data, error, isFetching, fetchNextPage } = useInfiniteQuery(
    ["metadatas-by-tag", tag],
    async ({ pageParam = 0 }) => {
      if (!tag) {
        return { result: [], nextPage: undefined, isLast: true };
      }
      const resp =
        (await get<MetadataWithName[]>(
          client,
          "/api/metadatas-by-tag",
          location.pathname,
          { tag, page: pageParam }
        )) || [];
      const nextPage = resp.length > 0 ? pageParam + 1 : undefined;
      return { result: resp, nextPage, isLast: !nextPage };
    },
    { getNextPageParam: (lastPage) => lastPage.nextPage }
  );

  const ObservationComponent = makeObservationComponent(data, fetchNextPage);

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
