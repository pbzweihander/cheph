import { Link, useNavigate, useParams } from "react-router-dom";

import { useDeletePhotoMutation } from "./MutationHooks";
import { useMetadata } from "./QueryHooks";
import Spinner from "./Spinner";

function Photo() {
  const navigate = useNavigate();
  const { name } = useParams();
  const { data: metadata, isLoading } = useMetadata(name);
  const { mutate: deletePhoto, isLoading: isDeleteLoading } =
    useDeletePhotoMutation(name, {
      onSuccess: () => {
        navigate(-1);
      },
    });

  const onDeleteClick = () => {
    if (window.confirm(`Delete photo ${name}\nAre you sure?`)) {
      deletePhoto();
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (!name || !metadata) {
    return <p>Error</p>;
  }

  return (
    <div className="flex flex-col-reverse md:flex-row">
      <div className="w-full md:w-2/3 p-5 flex justify-center items-center">
        <img src={`/asset/photo/${name}`} alt={metadata.description} />
      </div>
      <div className="w-full md:w-1/3 p-5">
        <div className="mb-2 break-all">{metadata.createdAt}</div>
        <div className="mb-2 whitespace-pre-line break-keep">
          {metadata.description}
        </div>
        <div className="mb-5">
          {metadata.tags.map((tag) => (
            <Link
              key={tag}
              className="inline-block bg-gray-300 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 break-keep"
              to={`/photos-by-tag/${tag}`}
            >
              #{tag}
            </Link>
          ))}
        </div>
        <div>
          <Link
            className="rounded-full px-5 py-2 bg-white inline-block mr-3 mb-1"
            to={`/photo/${name}/edit`}
          >
            Edit
          </Link>
          <button
            className="rounded-full px-5 py-2 bg-red-400 inline-block"
            onClick={onDeleteClick}
            disabled={isDeleteLoading}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default Photo;
