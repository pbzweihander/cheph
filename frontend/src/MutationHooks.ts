import { AxiosError } from "axios";
import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "react-query";

import { useAxiosClient } from "./AxiosContext";
import {
  MetadataUpdateRequest,
  MetadataWithName,
  SearchReq,
  UploadReq,
} from "./HttpTypes";

type MutationRet<T, Ret = void> = UseMutationResult<
  Ret,
  AxiosError,
  T,
  undefined
>;
type MutationOption<T, Ret = void> = Omit<
  UseMutationOptions<Ret, AxiosError, T, undefined>,
  "mutationFn"
>;

export function useUploadMutation(
  options?: MutationOption<UploadReq, string>
): MutationRet<UploadReq, string> {
  const client = useAxiosClient();
  return useMutation(async (payload: UploadReq) => {
    await client.post(`/api/photo/${payload.name}`, payload.file, {
      params: payload.metadata,
    });
    return payload.name;
  }, options);
}

export function useSearchMutation(
  options?: MutationOption<SearchReq, MetadataWithName[]>
): MutationRet<SearchReq, MetadataWithName[]> {
  const client = useAxiosClient();
  return useMutation(async (payload: SearchReq) => {
    const resp = await client.post<MetadataWithName[]>("/api/search", payload);
    return resp.data;
  }, options);
}

export function useEditPhotoMutation(
  name: string | undefined,
  options?: MutationOption<MetadataUpdateRequest>
): MutationRet<MetadataUpdateRequest> {
  const client = useAxiosClient();
  return useMutation(async (payload: MetadataUpdateRequest) => {
    if (!name) {
      return;
    }
    await client.put(`/api/photo/${name}`, payload);
  }, options);
}

export function useDeletePhotoMutation(
  name: string | undefined,
  options?: MutationOption<void>
): MutationRet<void> {
  const client = useAxiosClient();
  return useMutation(async () => {
    if (!name) {
      return;
    }
    await client.delete(`/api/photo/${name}`);
  }, options);
}
