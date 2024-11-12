import sharp from 'sharp';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fetchObjekts } from '../utils/objekt'
import { ofetch } from 'ofetch';

export async function execute() {
    const result = await generateProofshot();

    // Save the result to a file in a 'test_output' directory
    await writeFile(path.join(__dirname, 'proofshot_test.png'), result);
}

async function generateProofshot(): Promise<Buffer> {
    const objekts = await fetchObjekts({
        member: 'JiWoo',
        collectionNo: '337Z',
    })

    const objekt = objekts[0]
    const objektImageUrl = objekt.frontImage
    const objektImage = await ofetch(objektImageUrl, {
        responseType: 'arrayBuffer'
    });

    const userImagePath = path.join(__dirname, './assets/1.jpg');
    const userImage = await readFile(userImagePath);

    const sleeveOverlayPath = path.join(__dirname, './assets/img_proofshot_sleeve.png');
    const sleeveOverlay = await readFile(sleeveOverlayPath);

    // Rotate the sleeve overlay by 10 degrees and ensure transparency
    const rotatedOverlay = await sharp(sleeveOverlay)
        .rotate(-10, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

    // Get the dimensions of the user image
    const { width: userImageWidth, height: userImageHeight } = await sharp(userImage).metadata();

    // Crop the user image to 1:1 aspect ratio
    const size = Math.min(userImageWidth, userImageHeight);
    const croppedUserImage = await sharp(userImage)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .toBuffer();

    // Use the cropped image size as the output size
    const outputSize = size;

    // Resize the rotated overlay to a fixed percentage of the output size
    const overlayPercentage = 0.7; // 70% of the output size
    const resizedOverlay = await sharp(rotatedOverlay)
        .resize({ height: Math.round(outputSize * overlayPercentage) })
        .toBuffer();

    // Get the dimensions of the resized overlay
    const { width: overlayWidth, height: overlayHeight } = await sharp(resizedOverlay).metadata();

    // Calculate the position for bottom right placement of the overlay
    const overlayLeft = outputSize - overlayWidth + Math.round(outputSize * 0.059);
    const overlayTop = outputSize - overlayHeight - Math.round(outputSize * 0.081);

    // Resize and rotate the objekt image to fit within the overlay
    const resizedObjektImage = await sharp(objektImage)
        .resize(Math.round(overlayWidth * 0.8), Math.round(overlayHeight * 0.8), { fit: 'inside' })
        .rotate(-10, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

    // Get the dimensions of the resized and rotated objekt image
    const { width: objektWidth, height: objektHeight } = await sharp(resizedObjektImage).metadata();

    // Calculate the position for centering the objekt image on the overlay
    const objektLeft = outputSize - objektWidth + Math.round(outputSize * 0.03);
    const objektTop = outputSize - objektHeight - Math.round(outputSize * 0.14);

    return await sharp(croppedUserImage)
        .composite([
            {
                input: resizedObjektImage,
                top: objektTop,
                left: objektLeft,
            },
            {
                input: resizedOverlay,
                top: overlayTop,
                left: overlayLeft,
            },
        ])
        .png()
        .toBuffer();
}

execute();