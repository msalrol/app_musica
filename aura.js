//GenerarColoresId's
export function generarGradientDesdeIds(ids) {
    const colores = [];
  
    // Convertimos los ids en colores usando hash
    for (let i = 0; i < ids.length && colores.length < 5; i++) {
      const id = String(ids[i]);
      const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const r = (hash * 47) % 256;
      const g = (hash * 97) % 256;
      const b = (hash * 193) % 256;
  
      // Generamos colores más suaves (poca saturación)
      colores.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
    }
  
    // Si hay pocos colores, completamos
    while (colores.length < 5) {
      const r = Math.floor(Math.random() * 150);
      const g = Math.floor(Math.random() * 150);
      const b = Math.floor(Math.random() * 150);
      colores.push(`rgba(${r}, ${g}, ${b}, 0.5)`);
    }
  
    // Detectar si estamos en modo oscuro (prefers-color-scheme o clase 'dark-mode')
    const isDarkMode =
      window.matchMedia('(prefers-color-scheme: dark)').matches ||
      document.body.classList.contains('dark-mode');
  
    const fondo = isDarkMode ? '#ffffff' : '#000000';
    colores.unshift(fondo); // Insertar el blanco o negro como base
  
    return `linear-gradient(135deg, ${colores.join(', ')})`;
  }