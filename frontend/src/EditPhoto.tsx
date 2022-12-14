import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useEditPhotoMutation } from "./MutationHooks";
import { useMetadata } from "./QueryHooks";
import Spinner from "./Spinner";

function EditPhoto() {
  const navigate = useNavigate();
  const { name } = useParams();
  const { data: metadata, isLoading: isMetadataLoading } = useMetadata(name);

  const [description, setDescription] = useState(metadata?.description || "");
  const [tags, setTags] = useState(metadata?.tags?.join(",") || "");

  const { mutate: edit, isLoading: isEditLoading } = useEditPhotoMutation(
    name,
    {
      onSuccess: () => {
        if (name) {
          navigate(`/photo/${name}`);
        } else {
          navigate(`/tag`);
        }
      },
    }
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    edit({ tags, description });
  };

  if (isMetadataLoading) {
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
      <form className="w-1/3 p-5" onSubmit={onSubmit}>
        <div className="mb-2">
          <label>Description: </label>
          <textarea
            className="w-full h-[200px]"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="mb-2">
          <label>Tags (separated by comma): </label>
          <input
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </div>
        <div>
          {isEditLoading ? (
            <Spinner />
          ) : (
            <input
              className="rounded-full px-5 py-2 bg-white"
              type="submit"
              value="Edit"
            />
          )}
        </div>
      </form>
    </div>
  );
}

export default EditPhoto;
