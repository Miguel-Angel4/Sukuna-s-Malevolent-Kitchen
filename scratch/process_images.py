from PIL import Image
import os

# Define the crop box (left, top, right, bottom)
# Based on union of bboxes: (624, 168, 1056, 796)
# Center: (840, 482)
# Crop size: 600x800
CROP_BOX = (540, 82, 1140, 882)

def process_images():
    img_dir = 'img'
    for filename in os.listdir(img_dir):
        if 'Itadori sprite' in filename and filename.endswith('.png'):
            filepath = os.path.join(img_dir, filename)
            print(f"Processing {filename}...")
            img = Image.open(filepath)
            
            # Crop
            cropped = img.crop(CROP_BOX)
            
            # Save back
            cropped.save(filepath)
            print(f"Saved {filename} (New size: {cropped.size})")

if __name__ == "__main__":
    process_images()
