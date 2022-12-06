import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useUser } from "./Auth";
import { MetadataCreationRequest, UploadReq } from "./HttpTypes";
import { useUploadMutation } from "./MutationHooks";

function UploadPhoto() {
  const navigate = useNavigate();

  const user = useUser();

  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);

  const { mutate: upload, isLoading } = useUploadMutation({
    onSuccess: () => {
      if (file) {
        navigate(`/photo/${file.name}`);
      } else {
        navigate(`/tag`);
      }
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    const metadata: MetadataCreationRequest = {
      creatorEmail: user.primaryEmail,
      tags,
      description,
    };

    const req: UploadReq = {
      file,
      metadata,
    };
    upload(req);
  };

  return (
    <form onSubmit={onSubmit}>
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
      <div className="mb-2">
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0])}
        />
      </div>
      <div>
        <input
          className="rounded-full px-2 py-1 bg-white"
          type="submit"
          value="Submit"
          disabled={isLoading}
        />
      </div>
    </form>
  );
}

export default UploadPhoto;