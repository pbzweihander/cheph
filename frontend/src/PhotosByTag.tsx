import { Link, useParams } from "react-router-dom";

import { useMetadatasByTag } from "./QueryHooks";
import Spinner from "./Spinner";

function PhotosByTag() {
  const { tag } = useParams();
  const { data: metadatas, isLoading } = useMetadatasByTag(tag);

  if (isLoading) {
    return <Spinner />;
  }

  if (!tag || !metadatas) {
    return <p>Error</p>;
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 items-center">
      {metadatas.map((metadata) => (
        <Link to={`/photo/${metadata.name}`}>
          <div className="max-w-sm rounded shadow-lg overflow-hidden">
            <img
              src={`/asset/photo/${metadata.name}`}
              alt={metadata.description}
              className="w-full"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default PhotosByTag;
