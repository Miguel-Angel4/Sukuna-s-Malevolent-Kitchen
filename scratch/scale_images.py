from PIL import Image
import os

def scale_images():
    img_dir = 'img'
    for filename in os.listdir(img_dir):
        if 'Itadori sprite' in filename and filename.endswith('.png'):
            filepath = os.path.join(img_dir, filename)
            img = Image.open(filepath)
            # Scale up 2x from current size
            new_size = (img.size[0] * 2, img.size[1] * 2)
            scaled = img.resize(new_size, Image.NEAREST)
            scaled.save(filepath)
            print(f"Scaled {filename} to {new_size}")

if __name__ == "__main__":
    scale_images()
