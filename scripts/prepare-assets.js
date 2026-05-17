import fs from 'fs';
import path from 'path';

// This script prepares the assets folder for capacitor-assets
const assetsDir = path.join(process.cwd(), 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
}

const sourceImage = path.join(process.cwd(), 'assets/image_refined_visual.png');
const targetIconOnly = path.join(assetsDir, 'icon-only.png');
const targetIcon = path.join(assetsDir, 'icon.png');
const targetSplash = path.join(assetsDir, 'splash.png');
const targetSplashDark = path.join(assetsDir, 'splash-dark.png');
const targetLogo = path.join(assetsDir, 'logo.png');

if (fs.existsSync(sourceImage)) {
    fs.copyFileSync(sourceImage, targetIconOnly);
    fs.copyFileSync(sourceImage, targetIcon);
    fs.copyFileSync(sourceImage, targetSplash);
    fs.copyFileSync(sourceImage, targetSplashDark);
    fs.copyFileSync(sourceImage, targetLogo);
    console.log('Assets prepared from', sourceImage);
} else {
    console.error('Source image not found at', sourceImage);
    // If source not found, we use a fallback if possible or just fail
}
