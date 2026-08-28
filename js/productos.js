const repositorioRemotoBase = "https://raw.githubusercontent.com/brayand-beltranmedina/CATALO-STORE/principal/";

// Generación automatizada de referencias visuales para el catálogo de Thomy Store
function sincronizarCatalogoRemoto() {
    const contenedorPrincipal = document.getElementById("catalogo-container") || document.getElementById("admin-product-list");
    if (!contenedorPrincipal) return;

    let bufferHTML = "";
    // Iteración optimizada para la cantidad de recursos gráficos alojados en GitHub
    for (let indice = 1; indice <= 15; indice++) {
        const enlaceRecurso = `${repositorioRemotoBase}${indice}.jpeg`;
        bufferHTML += `
            <div class="editorial-card-item" style="border: 1px solid var(--border); background: var(--surface); padding: 15px; border-radius: 6px; text-align: center;">
                <img src="${enlaceRecurso}" alt="Referencia Exclusiva ${indice}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;" onerror="this.parentElement.style.display='none'">
                <h4 style="color: #fff; font-size: 13px; letter-spacing: 1px; margin-bottom: 5px;">Ref. Exclusiva // ${indice}</h4>
                <p style="color: var(--gold); font-size: 12px; font-weight: 700;">Stock Verificado GitHub</p>
            </div>
        `;
    }
    contenedorPrincipal.innerHTML = bufferHTML;
}

document.addEventListener("DOMContentLoaded", sincronizarCatalogoRemoto);