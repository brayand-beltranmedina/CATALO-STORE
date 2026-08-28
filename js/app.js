let carrito = [];
let filtroActivoGlobal = "todos";
let indiceSlideActual = 0;
let intervaloCarrusel = null;
let db = null;

function abrirBaseDeDatos() {
    return new Promise((resolve) => {
        const request = indexedDB.open("ThomyStoreDB_Hibrida_Definitiva", 1);
        request.onerror = () => resolve(null);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains("datosTienda")) {
                database.createObjectStore("datosTienda", { keyPath: "clave" });
            }
        };
    });
}

async function guardarEnDB(clave, valor) {
    try {
        if (!db) db = await abrirBaseDeDatos();
        if (!db) return;
        const transaction = db.transaction(["datosTienda"], "readwrite");
        transaction.objectStore("datosTienda").put({ clave, valor });
    } catch (e) { console.error(e); }
}

async function leerDeDB(clave) {
    try {
        if (!db) db = await abrirBaseDeDatos();
        if (!db) return null;
        return new Promise((resolve) => {
            const transaction = db.transaction(["datosTienda"], "readonly");
            const request = transaction.objectStore("datosTienda").get(clave);
            request.onsuccess = (event) => resolve(event.target.result ? event.target.result.valor : null);
            request.onerror = () => resolve(null);
        });
    } catch (e) { return null; }
}

document.addEventListener("DOMContentLoaded", async () => {
    db = await abrirBaseDeDatos();
    
    // Si ya existen productos guardados en la BD del navegador, los respetamos. Si no, cargamos los de productos.js
    const prodsDB = await leerDeDB("productos");
    window.productos = (prodsDB && prodsDB.length > 0) ? prodsDB : (typeof productosDB !== 'undefined' ? productosDB : []);

    const outfitsDB = await leerDeDB("outfits");
    window.outfits = (outfitsDB && outfitsDB.length > 0) ? outfitsDB : [];

    const slidesDB = await leerDeDB("carouselSlides");
    window.carouselSlides = (slidesDB && slidesDB.length > 0) ? slidesDB : [
        { title: "THOMY STORE", desc: "Luxury Streetwear 2026", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200" }
    ];

    const catsDB = await leerDeDB("categoriasPersonalizadas");
    window.categoriasPersonalizadas = (catsDB && catsDB.length > 0) ? catsDB : [
        { nombre: "Ropa", imagen: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800" },
        { nombre: "Zapatos", imagen: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
        { nombre: "Perfumes", imagen: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800" },
        { nombre: "Accesorios", imagen: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800" }
    ];

    if (localStorage.getItem("thomy_admin_sesion_activa") === "true") {
        const loginSec = document.getElementById("admin-login-section");
        const dashSec = document.getElementById("admin-dashboard-content");
        if (loginSec) loginSec.style.display = "none";
        if (dashSec) dashSec.style.display = "block";
    }

    window.inicializarCarrusel();
    window.renderizarMenuCategoriasDinamico();
    window.renderizarGridCategorias();
    window.renderizarCatalogoOrdenado();
    window.renderizarOutfits();
    window.renderizarOfertas();
    window.renderizarSelectCategoriasAdmin();
    window.renderizarTablaCategoriasAdmin();
    window.renderizarTablaAdmin();
    window.renderizarTablaCarruselAdmin();
    window.renderizarTablaOutfitsAdmin();
    window.renderizarInventarioReporte();
    
    if (intervaloCarrusel) clearInterval(intervaloCarrusel);
    intervaloCarrusel = setInterval(() => { window.moverCarrusel(1); }, 6000);
});

async function sincronizarDB() {
    await guardarEnDB("productos", window.productos);
    await guardarEnDB("outfits", window.outfits);
    await guardarEnDB("carouselSlides", window.carouselSlides);
    await guardarEnDB("categoriasPersonalizadas", window.categoriasPersonalizadas);
}

// ==========================================
// CARRUSEL
// ==========================================
window.inicializarCarrusel = function() {
    const contenedor = document.getElementById("carrusel-galeria-container");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    const slidesUsar = (window.carouselSlides && window.carouselSlides.length > 0) ? window.carouselSlides : [{ title: "THOMY STORE", desc: "Luxury Streetwear 2026", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200" }];
    slidesUsar.forEach((slide, idx) => {
        contenedor.innerHTML += `
            <div class="carousel-slide ${idx === 0 ? 'active' : ''}" style="background: linear-gradient(0deg, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.2) 60%), url('${slide.img}') center/cover;">
                <div style="max-width: 700px; padding: 40px;">
                    <span style="font-size: 10px; font-weight: 800; letter-spacing: 5px; color: var(--gold); text-transform: uppercase; display: block; margin-bottom: 15px;">NUEVA COLECCIÓN</span>
                    <h1 style="font-size: 48px; font-weight: 300; letter-spacing: 3px; color: #fff; margin-bottom: 15px;">${slide.title}</h1>
                    <p style="font-size: 13px; color: var(--muted);">${slide.desc}</p>
                </div>
            </div>`;
    });
};

window.moverCarrusel = function(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;
    slides[indiceSlideActual].classList.remove('active');
    indiceSlideActual = (indiceSlideActual + n + slides.length) % slides.length;
    slides[indiceSlideActual].classList.add('active');
};

// ==========================================
// MENÚ Y GRID DE CATEGORÍAS DINÁMICAS
// ==========================================
window.renderizarMenuCategoriasDinamico = function() {
    const dropdown = document.getElementById("menu-dropdown-categorias-dinamico");
    if (!dropdown) return;
    let html = `<a href="#catalogo-section" onclick="mostrarTodoCatalogo()" style="color: var(--gold); font-weight: 800; background: var(--bg);">— Ver Todo el Catálogo —</a>`;
    
    (window.categoriasPersonalizadas || []).forEach(cat => {
        html += `<a href="#catalogo-section" onclick="filtrarCategoriaDirecta('${cat.nombre}')">${cat.nombre}</a>`;
    });
    dropdown.innerHTML = html;
};

window.renderizarGridCategorias = function() {
    const contenedor = document.getElementById("grid-2x2-container");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    (window.categoriasPersonalizadas || []).forEach(cat => {
        contenedor.innerHTML += `
            <div class="grid-card-item" onclick="window.filtrarCategoriaDirecta('${cat.nombre}')" style="cursor:pointer;">
                <img src="${cat.imagen || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'}" alt="${cat.nombre}">
                <div class="grid-card-info"><h3>${cat.nombre.toUpperCase()}</h3><p>Colección Exclusiva</p></div>
            </div>`;
    });
};

window.renderizarSelectCategoriasAdmin = function() {
    const select = document.getElementById("prod-category");
    if (!select) return;
    select.innerHTML = "";
    (window.categoriasPersonalizadas || []).forEach(cat => {
        select.innerHTML += `<option value="${cat.nombre}">${cat.nombre}</option>`;
    });
};

window.filtrarCategoriaDirecta = function(cat) {
    filtroActivoGlobal = cat;
    const btnVerTodo = document.getElementById("btn-ver-todo");
    if (btnVerTodo) btnVerTodo.style.display = "inline-block";
    window.renderizarCatalogoOrdenado();
    const sec = document.getElementById("catalogo-section");
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
};

window.mostrarTodoCatalogo = function() {
    filtroActivoGlobal = "todos";
    const btnVerTodo = document.getElementById("btn-ver-todo");
    if (btnVerTodo) btnVerTodo.style.display = "none";
    window.renderizarCatalogoOrdenado();
};

window.filtrarPorBusqueda = function(termino) {
    const q = termino.toLowerCase().trim();
    if (!q) { window.mostrarTodoCatalogo(); return; }
    const filtrados = (window.productos || []).filter(p => p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
    window.renderizarProductosFiltradosDirecto(filtrados);
};

window.renderizarCatalogoOrdenado = function() {
    const contenedor = document.getElementById("categorias-ordenadas-container");
    if (!contenedor) return;
    let prods = (window.productos || []).filter(p => p.seccion !== "oferta");
    if (filtroActivoGlobal !== "todos") {
        prods = prods.filter(p => p.categoria && p.categoria.toLowerCase() === filtroActivoGlobal.toLowerCase());
    }

    let html = `<div class="editorial-product-grid">`;
    prods.forEach((p) => {
        const originalIdx = (window.productos || []).indexOf(p);
        html += `
            <div class="product-card">
                <div style="position: relative;">
                    <img src="${p.imagen}" alt="${p.nombre}" class="product-img" onclick="window.abrirLightbox('${p.imagen}')" loading="lazy">
                    <span style="position: absolute; top: 15px; right: 15px; background: rgba(5,5,7,0.85); color: var(--gold); font-size: 9px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px;">Ref #${p.id || '00'}</span>
                </div>
                <div class="product-info">
                    <div class="product-category">${p.categoria}</div>
                    <div class="product-name">${p.nombre}</div>
                    <div class="product-price">$${Number(p.precio).toLocaleString()}</div>
                </div>
                <button class="btn-add-cart" onclick="window.agregarAlCarrito(${originalIdx})">Añadir al Carrito</button>
            </div>`;
    });
    html += `</div>`;
    contenedor.innerHTML = html;
};

window.renderizarProductosFiltradosDirecto = function(lista) {
    const contenedor = document.getElementById("categorias-ordenadas-container");
    if (!contenedor) return;
    let html = `<div class="editorial-product-grid">`;
    lista.forEach((p) => {
        const originalIdx = (window.productos || []).indexOf(p);
        html += `
            <div class="product-card">
                <div style="position: relative;">
                    <img src="${p.imagen}" alt="${p.nombre}" class="product-img" onclick="window.abrirLightbox('${p.imagen}')" loading="lazy">
                    <span style="position: absolute; top: 15px; right: 15px; background: rgba(5,5,7,0.85); color: var(--gold); font-size: 9px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px;">Ref #${p.id || '00'}</span>
                </div>
                <div class="product-info">
                    <div class="product-category">${p.categoria}</div>
                    <div class="product-name">${p.nombre}</div>
                    <div class="product-price">$${Number(p.precio).toLocaleString()}</div>
                </div>
                <button class="btn-add-cart" onclick="window.agregarAlCarrito(${originalIdx})">Añadir al Carrito</button>
            </div>`;
    });
    html += `</div>`;
    contenedor.innerHTML = html;
};

window.renderizarOfertas = function() {
    const contenedor = document.getElementById("ofertas-container");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    const ofertas = (window.productos || []).filter(p => p.seccion === "oferta");
    if (ofertas.length === 0) { contenedor.innerHTML = `<p style="color: var(--muted); font-size: 13px;">No hay ofertas flash activas.</p>`; return; }
    ofertas.forEach((p) => {
        const originalIdx = (window.productos || []).indexOf(p);
        contenedor.innerHTML += `
            <div class="product-card">
                <img src="${p.imagen}" alt="${p.nombre}" class="product-img" onclick="window.abrirLightbox('${p.imagen}')" loading="lazy">
                <div class="product-info">
                    <div class="product-category" style="color: #ff4757;">Oferta Flash</div>
                    <div class="product-name">${p.nombre}</div>
                    <div class="product-price">$${Number(p.precio).toLocaleString()}</div>
                </div>
                <button class="btn-add-cart" onclick="window.agregarAlCarrito(${originalIdx})">Añadir al Carrito</button>
            </div>`;
    });
};

window.renderizarOutfits = function() {
    const contenedor = document.getElementById("outfit-container");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    (window.outfits || []).forEach((o, index) => {
        contenedor.innerHTML += `
            <div class="outfit-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">
                <div class="outfit-img-container" onclick="window.abrirLightbox('${o.img}')" style="position: relative; width: 100%; height: 280px; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer;">
                    <img src="${o.img}" alt="${o.name}" style="width: 100%; height: 100%; object-fit: contain;" loading="lazy">
                </div>
                <div class="outfit-details" style="padding: 20px; display: flex; flex-direction: column; gap: 8px; flex: 1; border-top: 1px solid var(--border);">
                    <span class="sub-title" style="margin-bottom: 0; font-size: 9px;">LOOK RECOMENDADO</span>
                    <h3 style="font-size: 16px; font-weight: 500; color: #fff; letter-spacing: 1px;">${o.name}</h3>
                    <p style="font-size: 12px; color: var(--muted); line-height: 1.4; margin: 0;">${o.desc || 'Outfit exclusivo seleccionado para destacar tu estilo.'}</p>
                    <div style="font-size: 16px; font-weight: 700; color: var(--gold); margin-top: 2px;">$${Number(o.price || 0).toLocaleString()} COP</div>
                    <button class="checkout-btn" onclick="window.agregarOutfitAlCarrito(${index})" style="margin-top: 6px; padding: 10px; font-size: 10px;">Añadir Outfit al Carrito</button>
                </div>
            </div>`;
    });
};

// ==========================================
// CARRITO Y WHATSAPP
// ==========================================
window.toggleCart = function() { 
    const drawer = document.getElementById("cart-drawer");
    if (drawer) drawer.classList.toggle("open"); 
};

window.agregarAlCarrito = function(index) {
    const producto = window.productos[index];
    if (!producto) return;
    carrito.push({
        name: producto.nombre,
        price: producto.precio,
        img: producto.imagen,
        category: producto.categoria
    });
    window.actualizarCarritoUI();
    window.toggleCart();
};

window.agregarOutfitAlCarrito = function(index) {
    const out = window.outfits[index];
    if (!out) return;
    carrito.push({ name: out.name, price: out.price || 0, img: out.img, category: 'Outfit' });
    window.actualizarCarritoUI();
    window.toggleCart();
};

window.actualizarCarritoUI = function() {
    const countEl = document.getElementById("cart-count");
    if (countEl) countEl.innerText = carrito.length;
    const container = document.getElementById("cart-items-container");
    if (!container) return;
    container.innerHTML = "";
    let total = 0;
    carrito.forEach((item, idx) => {
        total += Number(item.price || 0);
        container.innerHTML += `
            <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg); border: 1px solid var(--border); padding: 12px; border-radius: 4px; margin-bottom: 10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${item.img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" loading="lazy">
                    <div><div style="font-size:12px; color:#fff; font-weight:500;">${item.name}</div><div style="font-size:11px; color:var(--gold);">$${Number(item.price).toLocaleString()}</div></div>
                </div>
                <button onclick="window.eliminarDelCarrito(${idx})" style="background:none; border:none; color:#ff4757; cursor:pointer; font-size:14px;"><i class="fas fa-times"></i></button>
            </div>`;
    });
    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.innerText = "$" + total.toLocaleString();
};

window.eliminarDelCarrito = function(index) { 
    carrito.splice(index, 1); 
    window.actualizarCarritoUI(); 
};

window.enviarPedidoWhatsApp = function() {
    if (carrito.length === 0) return alert("Tu carrito está vacío.");
    let msg = "🔥 *NUEVO PEDIDO - THOMY STORE* 🔥\n\n";
    let total = 0;
    carrito.forEach((i, idx) => {
        msg += `*${idx + 1}. ${i.name}*\n📂 Categoría: ${i.category}\n💰 Precio: $${Number(i.price).toLocaleString()} COP\n🖼️ Imagen: ${i.img}\n----------------------------------------\n`;
        total += Number(i.price);
    });
    msg += `\n*TOTAL: $${total.toLocaleString()} COP*\n\n¡Quedo atento a la confirmación!`;
    window.open(`https://wa.me/573246359369?text=${encodeURIComponent(msg)}`, '_blank');
};

window.enviarMensajeContactoWhatsApp = function() {
    const nombre = document.getElementById("contacto-nombre").value;
    const mensaje = document.getElementById("contacto-mensaje").value;
    if (!nombre || !mensaje) return alert("Completa tu nombre y mensaje.");
    window.open(`https://wa.me/573246359369?text=${encodeURIComponent('Hola Thomy Store, mi nombre es ' + nombre + '. ' + mensaje)}`, '_blank');
};

// ==========================================
// ADMINISTRACIÓN Y GESTIÓN DE CATEGORÍAS
// ==========================================
window.abrirAdminModal = function() { 
    const modal = document.getElementById("admin-modal");
    if (modal) modal.style.display = "block"; 
};

window.cerrarAdminModal = function() { 
    const modal = document.getElementById("admin-modal");
    if (modal) modal.style.display = "none"; 
};

window.loginAdmin = function() {
    const email = document.getElementById("admin-email").value;
    const pass = document.getElementById("admin-pass").value;
    if (email === "barcelona.brayanbeltran11@gmail.com" && pass === "123456") {
        localStorage.setItem("thomy_admin_sesion_activa", "true");
        const loginSec = document.getElementById("admin-login-section");
        const dashSec = document.getElementById("admin-dashboard-content");
        if (loginSec) loginSec.style.display = "none";
        if (dashSec) dashSec.style.display = "block";
        window.renderizarTablaAdmin();
        window.renderizarTablaCategoriasAdmin();
        window.renderizarTablaCarruselAdmin();
        window.renderizarTablaOutfitsAdmin();
        window.renderizarInventarioReporte();
    } else { alert("Credenciales incorrectas."); }
};

window.cerrarSesionAdmin = function() {
    localStorage.removeItem("thomy_admin_sesion_activa");
    const loginSec = document.getElementById("admin-login-section");
    const dashSec = document.getElementById("admin-dashboard-content");
    if (dashSec) dashSec.style.display = "none";
    if (loginSec) loginSec.style.display = "flex";
};

window.cambiarTabAdmin = function(tabName, btnElement) {
    document.querySelectorAll(".admin-tab-pane, .tab-content").forEach(p => { p.style.display = "none"; p.classList.remove("active"); });
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    const pane = document.getElementById(`tab-${tabName}`);
    if (pane) { pane.style.display = "block"; pane.classList.add("active"); }
    if (btnElement) btnElement.classList.add("active");
    if (tabName === 'inventario') {
        window.renderizarTablaAdmin();
        window.renderizarInventarioReporte();
    }
    if (tabName === 'categorias') window.renderizarTablaCategoriasAdmin();
    if (tabName === 'carrusel') window.renderizarTablaCarruselAdmin();
    if (tabName === 'outfits') window.renderizarTablaOutfitsAdmin();
};

window.abrirLightbox = function(url) { 
    const img = document.getElementById("lightbox-img");
    const lb = document.getElementById("lightbox");
    if (img) img.src = url; 
    if (lb) lb.style.display = "flex"; 
};

window.cerrarLightbox = function() { 
    const lb = document.getElementById("lightbox");
    if (lb) lb.style.display = "none"; 
};

// ==========================================
// CARGA DE IMÁGENES Y GESTIÓN ADMIN
// ==========================================
let imagenesMasaTemporales = [];

window.cargarCarpetaMasivaOptimizada = function(event) {
    const files = event.target.files;
    const progressEl = document.getElementById("progreso-carga");
    if (!files || files.length === 0) return;

    imagenesMasaTemporales = [];
    let procesados = 0;
    if (progressEl) progressEl.innerText = `Cargando 0 de ${files.length} imágenes...`;

    Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) {
            procesados++;
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            imagenesMasaTemporales.push({
                nombreArchivo: file.name,
                pathRelativo: file.webkitRelativePath || file.name,
                url: e.target.result
            });
            procesados++;
            if (progressEl) progressEl.innerText = `Procesadas ${procesados} de ${files.length} imágenes.`;
        };
        reader.readAsDataURL(file);
    });
};

window.cargarImgUnicaOptimizada = function(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const input = document.getElementById(targetInputId);
        if (input) input.value = e.target.result;
    };
    reader.readAsDataURL(file);
};

// GESTIÓN DE CATEGORÍAS (CREAR Y ELIMINAR CON FOTO)
window.guardarCategoriaAdmin = async function() {
    const nombre = document.getElementById("admin-cat-nombre").value.trim();
    const imagen = document.getElementById("admin-cat-img").value.trim();

    if (!nombre) return alert("Ingresa el nombre de la categoría.");

    const catExistente = window.categoriasPersonalizadas.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (catExistente) {
        catExistente.imagen = imagen || catExistente.imagen;
        alert(`¡Categoría "${nombre}" actualizada con éxito!`);
    } else {
        window.categoriasPersonalizadas.push({
            nombre: nombre,
            imagen: imagen || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
        });
        alert(`¡Categoría "${nombre}" creada con éxito!`);
    }

    document.getElementById("admin-cat-nombre").value = "";
    document.getElementById("admin-cat-img").value = "";
    const fileInp = document.getElementById("admin-cat-file");
    if (fileInp) fileInp.value = "";

    await sincronizarDB();
    window.renderizarMenuCategoriasDinamico();
    window.renderizarGridCategorias();
    window.renderizarSelectCategoriasAdmin();
    window.renderizarTablaCategoriasAdmin();
};

window.renderizarTablaCategoriasAdmin = function() {
    const tbody = document.getElementById("admin-categorias-list");
    if (!tbody) return;
    tbody.innerHTML = "";
    (window.categoriasPersonalizadas || []).forEach((cat, index) => {
        tbody.innerHTML += `
            <tr style="font-size: 12px;">
                <td style="padding: 8px;"><img src="${cat.imagen}" style="width: 45px; height: 35px; object-fit: cover; border-radius: 4px;" loading="lazy"></td>
                <td style="padding: 8px; font-weight: 600; color: #fff;">${cat.nombre}</td>
                <td style="padding: 8px;"><button onclick="window.eliminarCategoriaAdmin(${index})" style="background:none; border:none; color:#ff4757; cursor:pointer; font-size:15px;"><i class="fas fa-trash"></i></button></td>
            </tr>`;
    });
};

window.eliminarCategoriaAdmin = async function(index) {
    const cat = window.categoriasPersonalizadas[index];
    if (!confirm(`¿Estás seguro de eliminar la categoría "${cat.nombre}"?`)) return;
    window.categoriasPersonalizadas.splice(index, 1);
    await sincronizarDB();
    window.renderizarMenuCategoriasDinamico();
    window.renderizarGridCategorias();
    window.renderizarSelectCategoriasAdmin();
    window.renderizarTablaCategoriasAdmin();
    alert("¡Categoría eliminada con éxito!");
};

window.guardarProductoAdmin = async function() {
    const nombre = document.getElementById("prod-name").value;
    const categoria = document.getElementById("prod-category").value;
    const precio = document.getElementById("prod-price").value;
    const urlInput = document.getElementById("prod-img-url").value;

    if (!nombre || !precio) return alert("Completa al menos el nombre y el precio.");

    let maxId = (window.productos || []).reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);

    if (imagenesMasaTemporales.length > 0) {
        imagenesMasaTemporales.forEach((imgObj, idx) => {
            maxId++;
            window.productos.unshift({
                id: maxId,
                nombre: `${nombre} #${idx + 1}`,
                precio: Number(precio),
                categoria: categoria,
                seccion: "catalogo",
                imagen: imgObj.url
            });
        });
        imagenesMasaTemporales = [];
        document.getElementById("progreso-carga").innerText = "¡Carga masiva completada con éxito!";
    } else {
        maxId++;
        const imagenFinal = urlInput.trim() !== "" ? urlInput.trim() : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800";
        window.productos.unshift({
            id: maxId,
            nombre: nombre,
            precio: Number(precio),
            categoria: categoria,
            seccion: "catalogo",
            imagen: imagenFinal
        });
    }

    await sincronizarDB();
    window.renderizarCatalogoOrdenado();
    window.renderizarTablaAdmin();
    window.renderizarInventarioReporte();

    document.getElementById("prod-name").value = "";
    document.getElementById("prod-price").value = "";
    document.getElementById("prod-img-url").value = "";
    const fileInp = document.getElementById("prod-file");
    if (fileInp) fileInp.value = "";

    alert("¡Producto(s) publicado(s) con éxito!");
};

window.guardarOfertaAdmin = async function() {
    const name = document.getElementById("oferta-name").value;
    const cat = document.getElementById("oferta-cat").value;
    const price = document.getElementById("oferta-price").value;
    const img = document.getElementById("oferta-img").value;

    if (!name || !price || !img) return alert("Completa los datos de la oferta.");

    let maxId = (window.productos || []).reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
    window.productos.unshift({
        id: maxId,
        nombre: name,
        precio: Number(price),
        categoria: cat,
        seccion: "oferta",
        imagen: img
    });

    await sincronizarDB();
    window.renderizarOfertas();
    window.renderizarTablaAdmin();
    alert("¡Oferta Flash publicada!");
};

window.guardarOutfitAdmin = async function() {
    const name = document.getElementById("outfit-name").value;
    const price = document.getElementById("outfit-price").value;
    const desc = document.getElementById("outfit-desc").value;
    const img = document.getElementById("outfit-img").value;

    if (!name || !price || !img) return alert("Completa los datos del outfit.");

    if (!window.outfits) window.outfits = [];
    window.outfits.unshift({ name, price: Number(price), desc, img });

    await sincronizarDB();
    window.renderizarOutfits();
    window.renderizarTablaOutfitsAdmin();
    alert("¡Outfit publicado!");
};

window.guardarSlideAdmin = async function() {
    const title = document.getElementById("slide-title").value;
    const desc = document.getElementById("slide-desc").value;
    const img = document.getElementById("slide-img").value;

    if (!title || !img) return alert("Ingresa título e imagen para el banner.");

    if (!window.carouselSlides) window.carouselSlides = [];
    window.carouselSlides.push({ title, desc, img });

    await sincronizarDB();
    window.inicializarCarrusel();
    window.renderizarTablaCarruselAdmin();
    alert("¡Banner añadido al carrusel!");
};

window.renderizarTablaCarruselAdmin = function() {
    let contenedorTab = document.getElementById("tab-carrusel");
    if (!contenedorTab) return;
    
    let tablaContainer = document.getElementById("admin-carrusel-lista-container");
    if (!tablaContainer) {
        tablaContainer = document.createElement("div");
        tablaContainer.id = "admin-carrusel-lista-container";
        tablaContainer.style.marginTop = "30px";
        tablaContainer.innerHTML = `
            <h4 style="color: var(--gold); margin-bottom: 10px; font-size: 12px;">Banners Actuales en el Carrusel</h4>
            <div style="overflow-x: auto; max-height: 250px;">
                <table class="editorial-table">
                    <thead>
                        <tr>
                            <th style="padding: 8px;">Imagen</th>
                            <th style="padding: 8px;">Título</th>
                            <th style="padding: 8px;">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="admin-carousel-list"></tbody>
                </table>
            </div>`;
        contenedorTab.appendChild(tablaContainer);
    }

    const tbody = document.getElementById("admin-carousel-list");
    if (!tbody) return;
    tbody.innerHTML = "";
    (window.carouselSlides || []).forEach((slide, index) => {
        tbody.innerHTML += `
            <tr style="font-size: 12px;">
                <td style="padding: 8px;"><img src="${slide.img}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" loading="lazy"></td>
                <td style="padding: 8px;">${slide.title}</td>
                <td style="padding: 8px;"><button onclick="window.eliminarSlideAdmin(${index})" style="background:none; border:none; color:#ff4757; cursor:pointer; font-size:14px;"><i class="fas fa-trash"></i></button></td>
            </tr>`;
    });
};

window.eliminarSlideAdmin = async function(index) {
    if (!confirm("¿Eliminar este banner?")) return;
    window.carouselSlides.splice(index, 1);
    await sincronizarDB();
    window.inicializarCarrusel();
    window.renderizarTablaCarruselAdmin();
};

window.renderizarTablaOutfitsAdmin = function() {
    let contenedorTab = document.getElementById("tab-outfits");
    if (!contenedorTab) return;

    let tablaContainer = document.getElementById("admin-outfits-lista-container");
    if (!tablaContainer) {
        tablaContainer = document.createElement("div");
        tablaContainer.id = "admin-outfits-lista-container";
        tablaContainer.style.marginTop = "30px";
        tablaContainer.innerHTML = `
            <h4 style="color: var(--gold); margin-bottom: 10px; font-size: 12px;">Outfits Actuales Publicados</h4>
            <div style="overflow-x: auto; max-height: 250px;">
                <table class="editorial-table">
                    <thead>
                        <tr>
                            <th style="padding: 8px;">Imagen</th>
                            <th style="padding: 8px;">Nombre</th>
                            <th style="padding: 8px;">Precio</th>
                            <th style="padding: 8px;">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="admin-outfits-list"></tbody>
                </table>
            </div>`;
        contenedorTab.appendChild(tablaContainer);
    }

    const tbody = document.getElementById("admin-outfits-list");
    if (!tbody) return;
    tbody.innerHTML = "";
    (window.outfits || []).forEach((out, index) => {
        tbody.innerHTML += `
            <tr style="font-size: 12px;">
                <td style="padding: 8px;"><img src="${out.img}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" loading="lazy"></td>
                <td style="padding: 8px;">${out.name}</td>
                <td style="padding: 8px; color: var(--gold);">$${Number(out.price).toLocaleString()}</td>
                <td style="padding: 8px;"><button onclick="window.eliminarOutfitAdmin(${index})" style="background:none; border:none; color:#ff4757; cursor:pointer; font-size:14px;"><i class="fas fa-trash"></i></button></td>
            </tr>`;
    });
};

window.eliminarOutfitAdmin = async function(index) {
    if (!confirm("¿Eliminar este outfit?")) return;
    window.outfits.splice(index, 1);
    await sincronizarDB();
    window.renderizarOutfits();
    window.renderizarTablaOutfitsAdmin();
};

window.renderizarInventarioReporte = function() {
    const contenedor = document.getElementById("admin-inventario-reporte");
    if (!contenedor) return;
    const totalProds = (window.productos || []).length;
    const ofertas = (window.productos || []).filter(p => p.seccion === "oferta").length;
    contenedor.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--muted);">
            <div>📦 Total Referencias: <strong style="color: var(--gold);">${totalProds}</strong></div>
            <div>⚡ Ofertas Flash: <strong style="color: var(--gold);">${ofertas}</strong></div>
            <div>👔 Outfits: <strong style="color: var(--gold);">${(window.outfits || []).length}</strong></div>
        </div>`;
};

window.renderizarTablaAdmin = function(filtro = "") {
    const tbody = document.getElementById("admin-product-list");
    if (!tbody) return;
    tbody.innerHTML = "";
    const lista = window.productos || [];
    const q = filtro.toLowerCase().trim();
    let mostrados = 0;

    for (let index = 0; index < lista.length; index++) {
        const p = lista[index];
        if (q && !p.nombre.toLowerCase().includes(q) && !String(p.id).includes(q) && !p.categoria.toLowerCase().includes(q)) continue;
        if (mostrados >= 120 && !q) continue;

        tbody.innerHTML += `
            <tr>
                <td style="text-align: center;"><input type="checkbox" class="prod-checkbox" value="${index}"></td>
                <td><img src="${p.imagen}" style="width:38px; height:38px; object-fit:cover; border-radius:4px;" loading="lazy"></td>
                <td><strong>Ref #${p.id || index}</strong> - ${p.nombre}</td>
                <td>${p.categoria}</td>
                <td><input type="number" id="input-precio-${index}" value="${p.precio}" style="width: 100px; background: var(--bg); border: 1px solid var(--border); color: var(--gold); padding: 6px; border-radius: 4px; font-weight: 700;"></td>
                <td><button onclick="window.eliminarProductoAdmin(${index})" style="background:none; border:none; color:#ff4757; cursor:pointer; font-size:15px;"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        mostrados++;
    }
};

window.guardarCambiosInventarioManual = async function() {
    (window.productos || []).forEach((_, idx) => {
        const inp = document.getElementById(`input-precio-${idx}`);
        if (inp) window.productos[idx].precio = Number(inp.value);
    });
    await sincronizarDB();
    window.renderizarCatalogoOrdenado();
    window.renderizarTablaAdmin();
    alert("¡Inventario actualizado con éxito!");
};

window.eliminarProductoAdmin = async function(index) {
    if (!confirm("¿Eliminar este producto?")) return;
    window.productos.splice(index, 1);
    await sincronizarDB();
    window.renderizarCatalogoOrdenado();
    window.renderizarTablaAdmin();
    window.renderizarInventarioReporte();
};

window.eliminarSeleccionadosAdmin = async function() {
    const checked = document.querySelectorAll('.prod-checkbox:checked');
    if (checked.length === 0) return alert("Selecciona productos.");
    if (!confirm(`¿Eliminar ${checked.length} productos seleccionados?`)) return;
    Array.from(checked).map(cb => parseInt(cb.value)).sort((a,b)=>b-a).forEach(idx => window.productos.splice(idx,1));
    await sincronizarDB();
    window.renderizarCatalogoOrdenado();
    window.renderizarTablaAdmin();
    window.renderizarInventarioReporte();
    alert("¡Eliminados con éxito!");
};

window.detectarYLimpiarRepetidos = async function() {
    const unicos = [];
    const idsVistos = new Set();
    (window.productos || []).forEach(p => {
        const clave = `${p.nombre.toLowerCase().trim()}_${p.precio}`;
        if (!idsVistos.has(clave)) {
            idsVistos.add(clave);
            unicos.push(p);
        }
    });
    const eliminados = window.productos.length - unicos.length;
    window.productos = unicos;
    await sincronizarDB();
    window.renderizarCatalogoOrdenado();
    window.renderizarTablaAdmin();
    window.renderizarInventarioReporte();
    alert(`¡Se eliminaron ${eliminados} productos duplicados!`);
};

window.filtrarInventarioAdmin = function(val) { window.renderizarTablaAdmin(val); };

window.seleccionarTodosAdmin = function() {
    const st = document.getElementById('check-master');
    if (!st) return;
    document.querySelectorAll('.prod-checkbox').forEach(cb => cb.checked = st.checked);
};