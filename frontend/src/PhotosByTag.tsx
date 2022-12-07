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
  );
}

export default PhotosByTag;
