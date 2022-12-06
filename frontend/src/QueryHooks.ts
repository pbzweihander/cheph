import { AxiosError } from "axios";
import { useQuery, UseQueryResult } from "react-query";

import { useAxiosClient } from "./AxiosContext";
import { User } from "./HttpTypes";

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
