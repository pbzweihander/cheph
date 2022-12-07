import { LazyLoadImage } from "react-lazy-load-image-component";
import { Link } from "react-router-dom";

import { MetadataWithName } from "./HttpTypes";

function PhotoCard({ metadata }: { metadata: MetadataWithName }) {
  return (
    <Link to={`/photo/${metadata.name}`}>
      <div className="max-w-sm rounded shadow-lg overflow-hidden max-h-[300px] flex items-center">
        <LazyLoadImage
          src={`/asset/photo/${metadata.name}`}
          alt={metadata.description}
          className="w-full"
        />
      </div>
    </Link>
  );
}

export default PhotoCard;
