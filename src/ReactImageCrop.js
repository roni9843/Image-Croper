import React, {useCallback, useEffect, useRef, useState} from 'react';

import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {Button} from "react-bootstrap";


const ReactImageCrop = () => {

    const [upImg, setUpImg] = useState(null);
    const imgRef = useRef(null);
    const previewCanvasRef = useRef(null);

    const [crop, setCrop] = useState({unit: '%', width: 30, aspect: 16 / 9});
    const [completedCrop, setCompletedCrop] = useState(null);

    const onSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => setUpImg(reader.result));
            reader.readAsDataURL(e.target.files[0]);
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
        const ctx = canvas.getContext('2d');
        const pixelRatio = window.devicePixelRatio;

        canvas.width = crop.width * pixelRatio * scaleX;
        canvas.height = crop.height * pixelRatio * scaleY;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

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

    return (
        <div className="App">

            <div>
                <input type="file" accept="image/*" onChange={onSelectFile}/>
            </div>

            <ReactCrop
                src={upImg}
                onImageLoaded={onLoad}
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
            />

            <div>
                <canvas
                    ref={previewCanvasRef}
                    // Rounding is important so the canvas width and height matches/is a multiple for sharpness.
                    style={{
                        width: Math.round(completedCrop?.width ?? 0),
                        height: Math.round(completedCrop?.height ?? 0)
                    }}
                />
            </div>

            <Button
                variant="outline-primary"
                disabled={!completedCrop?.width || !completedCrop?.height}
                onClick={() =>
                    generateDownload(previewCanvasRef.current, completedCrop)
                }
            >
                Download cropped image
            </Button>

            <Button
                variant="primary"
                disabled={!completedCrop?.width || !completedCrop?.height}
                onClick={async () => {

                    const blobImg = await new Promise((resolve, reject) => {
                        previewCanvasRef.current.toBlob(
                            (blob) => {
                                if (!blob) reject("Can not load image from crop data.");
                                blob.name = "cropped_image";
                                resolve(blob);
                            },
                            "image/jpeg",
                            1
                        );
                    });

                    console.log(blobImg, new File([blobImg], blobImg.name, {type: blobImg.type}))
                }}
            >
                Ok
            </Button>

        </div>
    );

}

export default ReactImageCrop;


function generateDownload(canvas, crop) {

    if (!crop || !canvas) {
        return;
    }

    canvas.toBlob(
        (blob) => {
            const previewUrl = URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.download = 'cropPreview.png';
            anchor.href = previewUrl;
            anchor.click();

            URL.revokeObjectURL(previewUrl);
        },
        'image/png',
        1
    );
}