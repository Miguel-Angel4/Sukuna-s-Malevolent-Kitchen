import os
from PIL import Image

def standardize_todo():
    sprites = [
        "Todo sprite base.png",
        "Todo sprite preparandose.png",
        "Todo sprite levantandose.png",
        "Todo sprite palmada.png"
    ]
    
    target_size = (400, 400)
    img_dir = r"e:\DAM 2\Proyecto\img"
    
    for sprite in sprites:
        path = os.path.join(img_dir, sprite)
        if os.path.exists(path):
            with Image.open(path) as img:
                img = img.convert("RGBA")
                
                # Crear lienzo transparente
                new_img = Image.new("RGBA", target_size, (0, 0, 0, 0))
                
                # Redimensionar manteniendo proporción si es necesario
                if img.width > target_size[0] or img.height > target_size[1]:
                    img.thumbnail(target_size, Image.Resampling.LANCZOS)
                
                # Calcular posición centrada
                x = (target_size[0] - img.width) // 2
                y = (target_size[1] - img.height) // 2
                
                new_img.paste(img, (x, y), img)
                new_img.save(path)
                print(f"Standardized {sprite} to {target_size}")

if __name__ == "__main__":
    standardize_todo()
