import { AxiosError } from "axios";
import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "react-query";

import { useAxiosClient } from "./AxiosContext";
import { UploadReq } from "./HttpTypes";

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
  options?: MutationOption<UploadReq>
): MutationRet<UploadReq> {
  const client = useAxiosClient();
  return useMutation(async (payload: UploadReq) => {
    await client.post(`/api/photo/${payload.file.name}`, payload.file, {
      params: payload.metadata,
    });
  }, options);
}
