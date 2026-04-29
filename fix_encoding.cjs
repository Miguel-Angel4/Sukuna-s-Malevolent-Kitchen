const fs = require('fs');

const map = {
    "Ã¡": "á", "Ã©": "é", "Ã­": "í", "Ã³": "ó", "Ãº": "ú", "Ã±": "ñ",
    "Â¡": "¡", "Â¿": "¿", "Ã ": "á", "Ã³": "ó", "Ã±": "ñ", "Í\"": "Ó",
    "GESTIÍ\"N": "GESTIÓN", "DIRECCIÍ\"N": "DIRECCIÓN", "tǸcnicas": "técnicas",
    "Contǭctanos": "Contáctanos", "sesiÃ³n": "sesión", "sesin": "sesión",
    "Quieres": "¿Quieres", "¿¿Quieres": "¿Quieres", "AÃ±os": "Años", "Aos": "Años"
};

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    for (const [k, v] of Object.entries(map)) {
        content = content.split(k).join(v);
    }
    // Specific fixes for common corrupted strings
    content = content.replace(/GESTIÍ.N/g, 'GESTIÓN');
    content = content.replace(/DIRECCIÍ.N/g, 'DIRECCIÓN');
    content = content.replace(/A.os/g, 'Años');
    content = content.replace(/t.cnicas/g, 'técnicas');
    content = content.replace(/Cont.ctanos/g, 'Contáctanos');
    content = content.replace(/sesi.n/g, 'sesión');
    
    fs.writeFileSync(f, content, 'utf8');
});
console.log('Encoding fixed.');
