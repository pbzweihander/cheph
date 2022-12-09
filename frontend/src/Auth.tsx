import { isAxiosError } from "axios";
import { createContext, ReactNode, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { User } from "./HttpTypes";
import { useUserFromQuery } from "./QueryHooks";
import Spinner from "./Spinner";

const UserContext = createContext<User>(undefined!);
export const useUser = (): User => useContext(UserContext);

export function AuthRequired({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data: user, isLoading, error } = useUserFromQuery();

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        window.location.replace(`/auth/github?redirect=${location.pathname}`);
        return <div>Authorizing...</div>;
      } else if (status === 403) {
        return <div>Forbidden</div>;
      }
    }
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
