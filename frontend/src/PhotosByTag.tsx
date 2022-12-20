import { useParams } from "react-router-dom";

import PhotoCard from "./PhotoCard";
import { useMetadatasByTagInfinite } from "./QueryHooks";
import Spinner from "./Spinner";

function PhotosByTag() {
  const { tag } = useParams();
  const {
    data: metadatas,
    isFetching,
    ObservationComponent,
  } = useMetadatasByTagInfinite(tag);

  if (!tag) {
    return <p>Error</p>;
  }

  return (
    <div>
      <h2 className="mb-5 inline-block bg-gray-300 rounded-full px-6 py-2 text-2xl font-semibold text-gray-700 break-keep">
        #{tag}
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 items-center">
        {metadatas?.map((metadata) => (
          <PhotoCard key={metadata.name} metadata={metadata} />
        ))}
        {isFetching && (
          <div className="max-w-sm flex justify-center items-center">
            <Spinner />
          </div>
        )}
        <ObservationComponent />
      </div>
    </div>
  );
}

export default PhotosByTag;
