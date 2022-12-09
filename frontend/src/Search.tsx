import { FormEvent, useState } from "react";

import { MetadataWithName } from "./HttpTypes";
import { useSearchMutation } from "./MutationHooks";
import PhotoCard from "./PhotoCard";

function Search() {
  const [token, setToken] = useState("");
  const [metadatas, setMetadatas] = useState<MetadataWithName[]>([]);
  const { mutate: search, isLoading } = useSearchMutation({
    onSuccess: (mds) => {
      setMetadatas(mds);
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    search({ token });
  };

  return (
    <div>
      <form className="p-2 mb-5" onSubmit={onSubmit}>
        <input
          className="mr-2 mb-1"
          type="text"
          onChange={(event) => setToken(event.target.value)}
        />
        <input
          className="rounded-full px-5 py-2 bg-white inline-block"
          type="submit"
          value="Search"
          disabled={isLoading}
        />
      </form>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 items-center">
        {metadatas?.map((metadata) => (
          <PhotoCard key={metadata.name} metadata={metadata} />
        ))}
      </div>
    </div>
  );
}

export default Search;
