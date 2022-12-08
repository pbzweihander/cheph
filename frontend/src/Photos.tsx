import PhotoCard from "./PhotoCard";
import { useMetadatasInfinite } from "./QueryHooks";
import Spinner from "./Spinner";

function Photos() {
  const {
    data: metadatas,
    isFetching,
    ObservationComponent,
  } = useMetadatasInfinite();

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

export default Photos;
