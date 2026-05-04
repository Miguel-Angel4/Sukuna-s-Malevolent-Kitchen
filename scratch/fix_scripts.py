import os

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # The pattern I accidentally created
            bad_pattern = '<script src="js/music.js"></script>`n  <script src="js/main.js"></script>'
            # The correct pattern
            good_pattern = '<script src="js/music.js"></script>\n  <script src="js/main.js"></script>'
            
            if bad_pattern in content:
                new_content = content.replace(bad_pattern, good_pattern)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {path}")
