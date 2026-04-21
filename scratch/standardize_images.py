from PIL import Image
import os

TARGET_SIZE = (400, 400)

def standardize_images():
    img_dir = 'img'
    for filename in os.listdir(img_dir):
        if 'Itadori sprite' in filename and filename.endswith('.png'):
            filepath = os.path.join(img_dir, filename)
            img = Image.open(filepath)
            
            # Create a transparent background
            new_img = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
            
            # Center the original image
            offset = ((TARGET_SIZE[0] - img.size[0]) // 2, (TARGET_SIZE[1] - img.size[1]) // 2)
            new_img.paste(img, offset)
            
            new_img.save(filepath)
            print(f"Standardized {filename} to {TARGET_SIZE}")

if __name__ == "__main__":
    standardize_images()
