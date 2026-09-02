import { useState } from "react";
import { FiImage, FiUploadCloud } from "react-icons/fi";
import { userService } from "../services/userService";

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const cropDataUrl = (dataUrl, aspect) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const outputWidth = aspect === "cover" ? 1200 : 520;
      const outputHeight = aspect === "cover" ? 460 : 520;
      const sourceRatio = image.width / image.height;
      const targetRatio = outputWidth / outputHeight;
      let sourceWidth = image.width;
      let sourceHeight = image.height;
      let sourceX = 0;
      let sourceY = 0;

      if (sourceRatio > targetRatio) {
        sourceWidth = image.height * targetRatio;
        sourceX = (image.width - sourceWidth) / 2;
      } else {
        sourceHeight = image.width / targetRatio;
        sourceY = (image.height - sourceHeight) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      canvas
        .getContext("2d")
        .drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          outputWidth,
          outputHeight
        );
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    image.onerror = reject;
    image.src = dataUrl;
  });

const AvatarUploader = ({ label, value, onChange, aspect = "avatar" }) => {
  const [preview, setPreview] = useState(value);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus("Cropping image...");

    try {
      const dataUrl = await readFile(file);
      const cropped = await cropDataUrl(dataUrl, aspect);
      setPreview(cropped);
      setStatus("Uploading image...");

      const finalUrl = await userService.uploadImage(null, cropped);
      onChange(finalUrl);
      setPreview(finalUrl);
      setStatus("Image ready.");
    } catch (error) {
      setStatus(error.message || "Could not process image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <label className={`avatar-uploader ${aspect}`}>
      <span>{label}</span>
      <div className="avatar-preview">
        {preview?.trim() ? <img src={preview} alt="" /> : <FiImage />}
      </div>
      <input
        accept="image/*"
        type="file"
        aria-label={`Upload ${label.toLowerCase()}`}
        onChange={handleFile}
      />
      <strong>
        <FiUploadCloud />
        {isUploading ? "Working..." : "Upload"}
      </strong>
      {status && <small>{status}</small>}
    </label>
  );
};

export default AvatarUploader;
