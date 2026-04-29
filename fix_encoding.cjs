const fs = require('fs');

const map = {
    "Ã¡": "á",
    "Ã©": "é",
    "Ã­": "í",
    "Ã³": "ó",
    "Ãº": "ú",
    "Ã±": "ñ",
    "Â¡": "¡",
    "Â¿": "¿",
    "Ã": "í", // Handle cases where í is just Ã
    "âœ•": "✕",
    "âš”": "⚔",
    "ðŸ“": "📍",
    "ðŸ“ž": "📞",
    "ðŸ•": "🕒"
};

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    for (const [k, v] of Object.entries(map)) {
        content = content.split(k).join(v);
    }
    // Also fix the menuToggle character if it was broken
    content = content.replace(/Abrir men./g, 'Abrir menú');
    content = content.replace(/Iniciar sesi.n/g, 'Iniciar sesión');
    content = content.replace(/Quieres trabajar para nosotros\?/g, '¿Quieres trabajar para nosotros?');
    content = content.replace(/LOCALIZACI.N/g, 'LOCALIZACIÓN');
    content = content.replace(/A.os/g, 'Años');
    content = content.replace(/t.cnicas/g, 'técnicas');
    content = content.replace(/Cont.ctanos/g, 'Contáctanos');
    
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Fixed ${f}`);
});
