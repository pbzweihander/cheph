import { ReactElement } from "react";
import { Link } from "react-router-dom";

import { useTagsWithSampleInfinite } from "./QueryHooks";
import Spinner from "./Spinner";

function Tags() {
  const {
    data: tagsMap,
    isFetching,
    ObservationComponent,
  } = useTagsWithSampleInfinite();

  const tagCards: ReactElement[] = [];
  for (const [tag, metadata] of Object.entries(tagsMap || {})) {
    tagCards.push(
      <div
        key={tag}
        style={{ backgroundImage: `url(/asset/photo/${metadata.name})` }}
        className="max-w-sm rounded shadow-lg bg-cover bg-center bg-no-repeat"
      >
        <Link to={`/photos-by-tag/${tag}`}>
          <div className="w-full h-full px-10 py-20 flex justify-center items-center backdrop-blur-sm">
            <div className="p-1 text-center text-2xl text-[4vw] md:text-[2vw] break-keep font-semibold bg-gray-300 rounded-full px-3 py-1 md:px-6 md:py-2 text-gray-700">
              #{tag}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {tagCards}
      {isFetching && (
        <div className="max-w-sm flex justify-center items-center">
          <Spinner />
        </div>
      )}
      <ObservationComponent />
    </div>
  );
}

export default Tags;
