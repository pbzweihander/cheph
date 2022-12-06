import { useUser } from "./Auth";

function Hello() {
  const user = useUser();

  return <p>Hello, {user.primaryEmail}!</p>;
}

export default Hello;
