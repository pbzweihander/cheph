import { ReactElement } from "react";
import { Link } from "react-router-dom";

import { useTagsWithSample } from "./QueryHooks";
import Spinner from "./Spinner";

function Tags() {
  const { data: tagsMap, isLoading } = useTagsWithSample();

  if (isLoading) {
    return <Spinner />;
  }

  const tagCards: ReactElement[] = [];
  for (const [tag, metadata] of Object.entries(tagsMap || {})) {
    tagCards.push(
      <div
        style={{ backgroundImage: `url(/asset/photo/${metadata.name})` }}
        className="max-w-sm rounded shadow-lg bg-cover bg-center bg-no-repeat"
      >
        <Link to={`/photos-by-tag/${tag}`}>
          <div className="w-full h-full px-10 py-20 flex flex-col justify-center items-center backdrop-blur-sm">
            <div className="p-1 text-center text-2xl font-semibold bg-white">
              {tag}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return <div className="grid grid-cols-3 gap-4">{tagCards}</div>;
}

export default Tags;
