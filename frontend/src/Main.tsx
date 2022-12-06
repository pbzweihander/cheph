import { Navigate } from "react-router-dom";

import { useUserFromQuery } from "./QueryHooks";
import Spinner from "./Spinner";

function Main() {
  const { data: user, isLoading } = useUserFromQuery();

  if (isLoading) {
    return <Spinner />;
  }

  if (user) {
    return <Navigate to="/hello" />;
  }

  return <div></div>;
}

export default Main;
