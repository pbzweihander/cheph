import { Link, useParams } from "react-router-dom";

import { useMetadata } from "./QueryHooks";
import Spinner from "./Spinner";

function Photo() {
  const { name } = useParams();
  const { data: metadata, isLoading } = useMetadata(name);

  if (isLoading) {
    return <Spinner />;
  }

  if (!name || !metadata) {
    return <p>Error</p>;
  }

  return (
    <div className="flex">
      <div className="w-2/3 p-5 flex justify-center">
        <img src={`/asset/photo/${name}`} alt={metadata.description} />
      </div>
      <div className="w-1/3 p-5">
        <div className="mb-2 whitespace-pre-line">{metadata.description}</div>
        <div className="mb-5">
          {metadata.tags.map((tag) => (
            <Link
              key={tag}
              className="inline-block bg-gray-300 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2"
              to={`/photos-by-tag/${tag}`}
            >
              #{tag}
            </Link>
          ))}
        </div>
        <Link
          className="rounded-full px-5 py-2 bg-white"
          to={`/photo/${name}/edit`}
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

export default Photo;
