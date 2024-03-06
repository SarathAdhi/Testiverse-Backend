import {
  UploadMetadata,
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import { storage } from "./firebase";

type FileUploadProps = {
  fileName: string;
  file: File | any;
};

export const fileUpload = async (
  fileName: FileUploadProps["fileName"],
  file: FileUploadProps["file"],
  metadata?: UploadMetadata
) => {
  const storageRef = ref(storage, fileName);

  return await uploadBytes(storageRef, file, metadata);
};

export const deleteFile = async (filePath: string) => {
  const storageRef = ref(storage, filePath);

  try {
    await deleteObject(storageRef);

    console.log("File deleted");
  } catch (error) {
    console.log({ error });
  }
};

export const getFile = async (filePath: string) => {
  const fileref = ref(storage, filePath);
  return await getDownloadURL(fileref).then((url) => url);
};

export const getFilesInFolder = async (filePath: string, blob = false) => {
  const folderRef = ref(storage, filePath);

  const folder = await listAll(folderRef);

  let files;

  // if (blob) files = folder.items.map((itemRef) => getBlob(itemRef));
  // else files = folder.items.map((itemRef) => getDownloadURL(itemRef));
  files = folder.items.map((itemRef) => getDownloadURL(itemRef));

  return Promise.all(files);
};
