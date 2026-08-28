document.addEventListener("DOMContentLoaded", () => {
    // Creamos un contenedor exclusivo para el catálogo de GitHub y lo añadimos al body
    const seccionCatalogo = document.createElement("section");
    seccionCatalogo.style.cssText = "width: 100%; min-height: 100vh; background: #0f0f0f; padding: 30px 20px; box-sizing: border-box; display: block; z-index: 99999; position: relative;";
    
    seccionCatalogo.innerHTML = `
        <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-family: sans-serif; letter-spacing: 2px;">CATÁLOGO OFICIAL GITHUB</h2>
        <div id="grid-productos-github" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; width: 100%; max-width: 1200px; margin: 0 auto;"></div>
    `;

    document.body.appendChild(seccionCatalogo);

    const grid = document.getElementById("grid-productos-github");
    const baseGitHub = "https://raw.githubusercontent.com/brayand-beltranmedina/CATALO-STORE/principal/";

    // Lista de tus archivos alojados en GitHub
    const listaImagenes = [
        "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg", "7.jpeg", "8.jpeg"
        // Agrega aquí los nombres largos de WhatsApp si los tienes, ej: "Imagen de WhatsApp...jpeg"
    ];

    listaImagenes.forEach((nombreArchivo) => {
        const urlFinal = `${baseGitHub}${encodeURIComponent(nombreArchivo)}`;
        const tarjeta = document.createElement("div");
        tarjeta.style.cssText = "border: 1px solid #333; background: #181818; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);";
        
        tarjeta.innerHTML = `
            <img src="${urlFinal}" alt="${nombreArchivo}" style="width: 100%; height: 210px; object-fit: cover; border-radius: 6px; margin-bottom: 12px;" onerror="this.parentElement.style.display='none'">
            <h4 style="color: #fff; font-size: 12px; margin: 5px 0; word-break: break-all; font-family: sans-serif;">${nombreArchivo}</h4>
            <p style="color: #d4af37; font-size: 11px; font-weight: bold; margin: 5px 0 0 0;">Stock Sincronizado</p>
        `;
        
        grid.appendChild(tarjeta);
    });
});