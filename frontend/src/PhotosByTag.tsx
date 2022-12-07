import { LazyLoadImage } from "react-lazy-load-image-component";
import { Link, useParams } from "react-router-dom";

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
        <Link key={metadata.name} to={`/photo/${metadata.name}`}>
          <div className="max-w-sm rounded shadow-lg overflow-hidden max-h-[300px] flex items-center">
            <LazyLoadImage
              src={`/asset/photo/${metadata.name}`}
              alt={metadata.description}
              className="w-full"
            />
          </div>
        </Link>
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
