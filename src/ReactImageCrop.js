import { saveAs } from "file-saver";
import JSZip from "jszip";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const ReactImageCrop = () => {
  const [upImgs, setUpImgs] = useState([]);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [croppedImages, setCroppedImages] = useState([]);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const [crop, setCrop] = useState({ unit: "%", width: 30, aspect: 16 / 9 });
  const [completedCrop, setCompletedCrop] = useState(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const imagesArray = filesArray.map((file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagesArray).then((images) => {
        setUpImgs(images);
        setCurrentImgIndex(0); // Reset to the first image
        setCroppedImages([]); // Clear any previously cropped images
        setCompletedCrop(null); // Reset completed crop state
      });
    }
  };

  const onLoad = useCallback((img) => {
    imgRef.current = img;
  }, []);

  useEffect(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
  }, [completedCrop]);

  const handleSaveCroppedImage = async () => {
    const blobImg = await new Promise((resolve, reject) => {
      previewCanvasRef.current.toBlob(
        (blob) => {
          if (!blob) reject("Cannot load image from crop data.");
          resolve(blob);
        },
        "image/jpeg",
        1
      );
    });

    setCroppedImages((prev) => [
      ...prev,
      { blob: blobImg, name: `cropped_image_${currentImgIndex + 1}.jpeg` },
    ]);

    handleNextImage();
  };

  const handleNextImage = () => {
    if (currentImgIndex < upImgs.length - 1) {
      setCurrentImgIndex(currentImgIndex + 1);
      setCompletedCrop(null);
      setCrop({ unit: "%", width: 30, aspect: 16 / 9 });
    }
  };

  const handlePreviousImage = () => {
    if (currentImgIndex > 0) {
      setCurrentImgIndex(currentImgIndex - 1);
      setCompletedCrop(null);
      setCrop({ unit: "%", width: 30, aspect: 16 / 9 });
    }
  };

  const downloadAllCroppedImages = () => {
    const zip = new JSZip();
    croppedImages.forEach(({ blob, name }) => {
      zip.file(name, blob);
    });
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "cropped_images.zip");
    });
  };

  return (
    <div className="App">
      <div>
        <input type="file" accept="image/*" onChange={onSelectFile} multiple />
      </div>

      {upImgs.length > 0 && (
        <ReactCrop
          src={upImgs[currentImgIndex]}
          onImageLoaded={onLoad}
          crop={crop}
          onChange={(newCrop) => setCrop(newCrop)}
          onComplete={(c) => setCompletedCrop(c)}
        />
      )}

      {completedCrop && (
        <div>
          <canvas
            ref={previewCanvasRef}
            style={{
              width: Math.round(completedCrop?.width ?? 0),
              height: Math.round(completedCrop?.height ?? 0),
            }}
          />
        </div>
      )}

      <Button
        variant="outline-primary"
        disabled={!completedCrop?.width || !completedCrop?.height}
        onClick={handleSaveCroppedImage}
      >
        Save Cropped Image
      </Button>

      <Button
        variant="secondary"
        onClick={handlePreviousImage}
        disabled={currentImgIndex === 0}
      >
        Previous
      </Button>
      <Button
        variant="secondary"
        onClick={handleNextImage}
        disabled={currentImgIndex === upImgs.length - 1}
      >
        Next
      </Button>

      <Button
        variant="success"
        onClick={downloadAllCroppedImages}
        disabled={croppedImages.length === 0}
      >
        Download All Cropped Images as ZIP ♥️
      </Button>
    </div>
  );
};

export default ReactImageCrop;
