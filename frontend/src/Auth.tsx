import { createContext, ReactNode, useContext } from "react";
import { Navigate } from "react-router-dom";

import { User } from "./HttpTypes";
import { useUserFromQuery } from "./QueryHooks";
import Spinner from "./Spinner";

const UserContext = createContext<User>(undefined!);
export const useUser = (): User => useContext(UserContext);

export function AuthRequired({ children }: { children: ReactNode }) {
  let { data: user, isLoading } = useUserFromQuery();

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
