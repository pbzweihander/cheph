import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { MetadataCreationRequest, UploadReq } from "./HttpTypes";
import { useUploadMutation } from "./MutationHooks";

function UploadPhoto() {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const { mutate: upload, isLoading } = useUploadMutation({
    onSuccess: () => {
      if (file) {
        navigate(`/photo/${file.name}`);
      } else {
        navigate(`/tag`);
      }
    },
  });

  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    const metadata: MetadataCreationRequest = {
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
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0])}
        />
      </div>
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
          className="rounded-full px-5 py-2 bg-white inline-block"
          type="submit"
          value="Submit"
          disabled={isLoading}
        />
      </div>
      <div>{file && preview && <img src={preview} alt={description} />}</div>
    </form>
  );
}

export default UploadPhoto;
