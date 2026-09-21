// script.js

// === FUNCIONES AUXILIARES ===

// Escapar HTML para prevenir XSS
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Validar que una URL sea segura (solo http/https)
function isValidImageUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url, window.location.href);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Manejo de imágenes con fallback
function handleImageError(img) {
  img.onerror = function () {
    this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 250' fill='%23F8FAFC'%3E%3Crect width='100%25' height='100%25' fill='%23E2E8F0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Poppins, sans-serif' font-size='20' fill='%23B91C1C'%3EMaría Goretti%3C/text%3E%3C/svg%3E";
    this.alt = 'Imagen no disponible';
  };
}

// Fetch con reintentos
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[INFO] URL solicitada: ${url}`);
      const response = await fetch(url);
      console.log(`[INFO] Estado de la respuesta: ${response.status}`);

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        if (response.status === 401) {
          errorMsg = 'Error de autenticación: El token de Airtable podría haber expirado.';
        } else {
          try {
            const errorData = await response.json();
            errorMsg += ` - ${JSON.stringify(errorData)}`;
          } catch (e) {
            errorMsg += ` - ${response.statusText}`;
          }
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      console.log('[INFO] Datos recibidos:', data);
      return data;
    } catch (error) {
      console.warn(`[WARN] Reintentando ${url} (${i + 1}/${retries})...`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error(`[ERROR] Error final al cargar ${url}:`, error);
      throw error;
    }
  }
}


async function cargarNoticias() {

  const contenedor = document.getElementById("contenedor-noticias1");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>Cargando...</p>";

  try {

    const res = await fetch("admin/obtener_publicaciones.php?tipo=1");
    const noticias = await res.json();

    contenedor.innerHTML = "";

    noticias.slice(0,3).forEach(noticia => {

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-md-6 col-lg-4";

      tarjeta.innerHTML = `
        <div class="card card-modern h-100 shadow-sm">

<img src="${noticia.imagen || 'imagenes/logo-iem.png'}" 
class="card-img-top" 
alt="${noticia.titulo}">

          <div class="card-body d-flex flex-column">

            <h5>${noticia.titulo}</h5>
            <p>${noticia.descripcion}</p>

            <a href="noticia.html?id=${noticia.id}" 
               class="btn btn-primary btn-sm mt-auto">
              Leer más
            </a>

          </div>
        </div>
      `;

      contenedor.appendChild(tarjeta);
    });

  } catch (err) {
    contenedor.innerHTML = "Error cargando noticias";
  }
}

// EJECUTAR CUANDO CARGUE LA PAGINA
document.addEventListener("DOMContentLoaded", function () {

  if (document.getElementById("detalle-noticia")) {
    cargarDetalleNoticia();
  }

  else if (document.getElementById("contenedor-noticias") && window.location.pathname.includes("listado")) {
    cargarListadoNoticias();
  }

  else if (document.getElementById("contenedor-noticias1")) {
    cargarNoticias(); // 👈 index
  }

});

//detalle//
async function cargarDetalleNoticia() {

  const contenedor = document.getElementById("detalle-noticia");
  if (!contenedor) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  contenedor.innerHTML = "<p>Cargando...</p>";

  try {

    const res = await fetch(`admin/obtener_publicaciones.php?id=${id}`);
    const noticia = await res.json();

    if (!noticia || noticia.error) {
      contenedor.innerHTML = "<p>Noticia no encontrada</p>";
      return;
    }

    let galeria = "";

    if (noticia.imagenes && noticia.imagenes.length > 0) {
      noticia.imagenes.forEach(img => {
        galeria += `
          <div class="col-md-4 mb-3">
            <img src="${img}" class="img-fluid rounded shadow">
          </div>
        `;
      });
    }

    contenedor.innerHTML = `
      <h1 class="mb-4">${noticia.titulo}</h1>
      <img src="${noticia.imagen}" class="img-fluid mb-4">
      <p>${noticia.contenido}</p>

      ${galeria ? `<h4 class="mt-5">Galería</h4><div class="row">${galeria}</div>` : ""}
    `;

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando la noticia</p>";
    console.error(error);
  }
}
// LISTAR TODAS LAS NOTICIAS EN listado_noticias.html
async function cargarListadoNoticias() {

  const contenedor = document.getElementById("contenedor-noticias");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>Cargando noticias...</p>";

  try {

    const res = await fetch("admin/obtener_publicaciones.php?tipo=1");
    const noticias = await res.json();

    contenedor.innerHTML = "";

    noticias.forEach(noticia => {

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-md-6 col-lg-4";

      tarjeta.innerHTML = `
        <div class="card card-modern h-100 shadow-sm">

          <img src="${noticia.imagen || 'https://via.placeholder.com/400x250'}" 
               class="card-img-top" 
               alt="${noticia.titulo}">

          <div class="card-body d-flex flex-column">

            <h5 class="card-title">${noticia.titulo}</h5>

            <p class="card-text">${noticia.descripcion}</p>

            <a href="noticia.html?id=${noticia.id}" 
               class="btn btn-primary btn-sm mt-auto">
              Leer más
            </a>

          </div>

        </div>
      `;

      contenedor.appendChild(tarjeta);

    });

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando noticias</p>";
    console.error(error);
  }
}

// MOSTRAR ACTIVIDADES EN INDEX (SOLO 3 MÁS RECIENTES)
async function cargarCurriculares() {

  const contenedor = document.getElementById("contenedor-curriculares");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>Cargando comunicados...</p>";

  try {

    const res = await fetch("admin/obtener_publicaciones.php?tipo=2");
    const curriculares = await res.json();

    contenedor.innerHTML = "";

    curriculares.slice(0, 3).forEach(item => {

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-md-6 col-lg-4";

      tarjeta.innerHTML = `
        <div class="card card-modern h-100 shadow-sm">

          <img src="${item.imagen || 'imagenes/logo-iem.png'}"
               class="card-img-top"
               alt="${item.titulo}">

          <div class="card-body d-flex flex-column">

            <h5>${item.titulo}</h5>
            <p>${item.descripcion}</p>

            <a href="curiculares.html?id=${item.id}" 
               class="btn btn-primary btn-sm mt-auto">
              Ver comunicado
            </a>

          </div>
        </div>
      `;

      contenedor.appendChild(tarjeta);
    });

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando comunicados</p>";
    console.error(error);
  }
}


// EJECUTAR SEGÚN LA PÁGINA 
document.addEventListener("DOMContentLoaded", function () {

  if (document.getElementById("detalle-curricular")) {
    cargarDetalleCurricular();
  }

  else if (document.getElementById("contenedor-curriculares-listado") && window.location.pathname.includes("listado")) {
    cargarListadoCurriculares();
  }

  else if (document.getElementById("contenedor-curriculares")) {
    cargarCurriculares(); // 👈 index
  }

});


// DETALLE DE ACTIVIDAD
async function cargarDetalleCurricular() {

  const contenedor = document.getElementById("detalle-curricular");
  if (!contenedor) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  contenedor.innerHTML = "<p>Cargando...</p>";

  try {

    const res = await fetch(`admin/obtener_publicaciones.php?id=${id}`);
    const item = await res.json();

    if (!item || item.error) {
      contenedor.innerHTML = "<p>Comunicado no encontrado</p>";
      return;
    }

    let galeria = "";

    if (item.imagenes && item.imagenes.length > 0) {
      item.imagenes.forEach(img => {
        galeria += `
          <div class="col-md-4 mb-3">
            <img src="${img}" class="img-fluid rounded shadow">
          </div>
        `;
      });
    }

    contenedor.innerHTML = `
      <h1 class="mb-4">${item.titulo}</h1>

      <img src="${item.imagen}" class="img-fluid mb-4">

      <p>${item.contenido}</p>

      ${galeria ? `<h4 class="mt-5">Galería</h4><div class="row">${galeria}</div>` : ""}
    `;

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando el comunicado</p>";
    console.error(error);
  }
}

// LISTAR TODAS LAS ACTIVIDADES (PÁGINA LISTADO)
async function cargarListadoCurriculares() {

  const contenedor = document.getElementById("contenedor-curriculares-listado");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>Cargando comunicados...</p>";

  try {

    const res = await fetch("admin/obtener_publicaciones.php?tipo=2");
    const curriculares = await res.json();

    contenedor.innerHTML = "";

    curriculares.forEach(item => {

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-md-6 col-lg-4";

      tarjeta.innerHTML = `
        <div class="card card-modern h-100 shadow-sm">

          <img src="${item.imagen || 'https://via.placeholder.com/400x250'}" 
               class="card-img-top">

          <div class="card-body d-flex flex-column">

            <h5>${item.titulo}</h5>

            <p>${item.descripcion}</p>

            <a href="curiculares.html?id=${item.id}" 
               class="btn btn-primary btn-sm mt-auto">
              Ver comunicado
            </a>

          </div>

        </div>
      `;

      contenedor.appendChild(tarjeta);

    });

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando comunicados</p>";
    console.error(error);
  }
}



// MOSTRAR CELEBRACIONES EN INDEX
async function cargarConvocatorias() {

  const contenedor = document.getElementById("contenedor-convocatorias1");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>Cargando convocatorias...</p>";

  try {

    const res = await fetch("admin/obtener_publicaciones.php?tipo=3");
    const convocatorias = await res.json();

    contenedor.innerHTML = "";

    convocatorias.slice(0, 3).forEach(item => {

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-md-6 col-lg-4";

      tarjeta.innerHTML = `
        <div class="card card-modern h-100 shadow-sm">

          <img src="${item.imagen || 'imagenes/logo-iem.png'}"
              class="card-img-top"
              alt="${item.titulo}">

          <div class="card-body d-flex flex-column">

            <h5>${item.titulo}</h5>
            <p>${item.descripcion}</p>

            <a href="convocatorias.html?id=${item.id}"
               class="btn btn-primary btn-sm mt-auto">
              Ver convocatoria
            </a>

          </div>
        </div>
      `;

      contenedor.appendChild(tarjeta);
    });

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando convocatorias</p>";
    console.error(error);
  }
}


// EJECUTAR
document.addEventListener("DOMContentLoaded", function () {

  if (document.getElementById("detalle-convocatoria")) {
    cargarDetalleConvocatoria();
  }

  else if (document.getElementById("contenedor-convocatorias") && window.location.pathname.includes("listado")) {
    cargarListadoConvocatorias();
  }

  else if (document.getElementById("contenedor-convocatorias1")) {
    cargarConvocatorias();
  }

});


// DETALLE DE CELEBRACIÓN
async function cargarDetalleConvocatoria() {

  const contenedor = document.getElementById("detalle-convocatoria");
  if (!contenedor) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  contenedor.innerHTML = "<p>Cargando...</p>";

  try {

    const res = await fetch(`admin/obtener_publicaciones.php?id=${id}`);
    const item = await res.json();

    if (!item || item.error) {
      contenedor.innerHTML = "<p>Convocatoria no encontrada</p>";
      return;
    }

    let galeria = "";

    if (item.imagenes && item.imagenes.length > 0) {
      item.imagenes.forEach(img => {
        galeria += `
          <div class="col-md-4 mb-3">
            <img src="${img}" class="img-fluid rounded shadow">
          </div>
        `;
      });
    }

    contenedor.innerHTML = `
      <h1 class="mb-4">${item.titulo}</h1>

      <img src="${item.imagen}" class="img-fluid mb-4">

      <p>${item.contenido}</p>

      ${galeria ? `<h4 class="mt-5">Galería</h4><div class="row">${galeria}</div>` : ""}
    `;

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando la convocatoria</p>";
    console.error(error);
  }
}
async function cargarListadoConvocatorias() {

  const contenedor = document.getElementById("contenedor-convocatorias");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>Cargando convocatorias...</p>";

  try {

    const res = await fetch("admin/obtener_publicaciones.php?tipo=3");
    const convocatorias = await res.json();

    contenedor.innerHTML = "";

    convocatorias.forEach(item => {

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-md-6 col-lg-4";

      tarjeta.innerHTML = `
        <div class="card card-modern h-100 shadow-sm">

          <img src="${item.imagen || 'https://via.placeholder.com/400x250'}" 
               class="card-img-top" 
               alt="${item.titulo}">

          <div class="card-body d-flex flex-column">

            <h5 class="card-title">${item.titulo}</h5>

            <p class="card-text">${item.descripcion}</p>

            <a href="convocatoria.html?id=${item.id}" 
               class="btn btn-primary btn-sm mt-auto">
              Ver convocatoria
            </a>

          </div>

        </div>
      `;

      contenedor.appendChild(tarjeta);

    });

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando convocatorias</p>";
    console.error(error);
  }
}


//  LISTADO DE CONVOCATORIAS

async function cargarCelebraciones() {

  const contenedor = document.getElementById("contenedor-celebraciones");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>Cargando celebraciones...</p>";

  try {

    const res = await fetch("admin/obtener_publicaciones.php?tipo=4");
    const celebraciones = await res.json();

    contenedor.innerHTML = "";

    celebraciones.slice(0, 3).forEach(item => {

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-md-6 col-lg-4 d-flex";

      tarjeta.innerHTML = `
        <div class="card card-modern w-100 shadow-sm">

          <img src="${item.imagen || 'imagenes/logo-iem.png'}"
               class="card-img-top"
               alt="${item.titulo}">

          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${item.titulo}</h5>
            <p class="card-text">${item.descripcion}</p>

            <a href="celebraciones.html?id=${item.id}" 
               class="btn btn-primary btn-sm mt-auto">
              Ver celebración
            </a>
          </div>

        </div>
      `;

      contenedor.appendChild(tarjeta);

    });

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando celebraciones</p>";
    console.error(error);
  }
}
// DETALLE DE CONVOCATORIA

async function cargarDetalleCelebracion() {

  const contenedor = document.getElementById("detalle-celebracion");
  if (!contenedor) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  contenedor.innerHTML = "<p>Cargando...</p>";

  try {

    const res = await fetch(`admin/obtener_publicaciones.php?id=${id}`);
    const item = await res.json();

    if (!item || item.error) {
      contenedor.innerHTML = "<p>Celebración no encontrada</p>";
      return;
    }

    let galeria = "";

    if (item.imagenes && item.imagenes.length > 0) {
      item.imagenes.forEach(img => {
        galeria += `
          <div class="col-md-4 mb-3">
            <img src="${img}" class="img-fluid rounded shadow">
          </div>
        `;
      });
    }

    contenedor.innerHTML = `
      <h1 class="mb-4">${item.titulo}</h1>

      <img src="${item.imagen}" class="img-fluid mb-4">

      <p>${item.contenido}</p>

      ${galeria ? `<h4 class="mt-5">Galería</h4><div class="row">${galeria}</div>` : ""}
    `;

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando la celebración</p>";
    console.error(error);
  }
}

async function cargarListadoCelebraciones() {

  const contenedor = document.getElementById("contenedor-celebraciones-listado");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>Cargando celebraciones...</p>";

  try {

    const res = await fetch("admin/obtener_publicaciones.php?tipo=4");
    const celebraciones = await res.json();

    contenedor.innerHTML = "";

    celebraciones.forEach(item => {

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-md-6 col-lg-4 d-flex";

      tarjeta.innerHTML = `
        <div class="card card-modern w-100 shadow-sm">

          <img src="${item.imagen || 'https://via.placeholder.com/400x250'}" 
               class="card-img-top">

          <div class="card-body d-flex flex-column">
            <h5>${item.titulo}</h5>
            <p>${item.descripcion}</p>

            <a href="celebraciones.html?id=${item.id}" 
               class="btn btn-primary btn-sm mt-auto">
              Ver celebración
            </a>
          </div>

        </div>
      `;

      contenedor.appendChild(tarjeta);

    });

  } catch (error) {
    contenedor.innerHTML = "<p>Error cargando celebraciones</p>";
    console.error(error);
  }
}
document.addEventListener("DOMContentLoaded", function () {

  if (document.getElementById("detalle-celebracion")) {
    cargarDetalleCelebracion();
  }

  else if (document.getElementById("contenedor-celebraciones-listado") && window.location.pathname.includes("listado")) {
    cargarListadoCelebraciones();
  }

  else if (document.getElementById("contenedor-celebraciones")) {
    cargarCelebraciones();
  }

});

// === INICIALIZACIÓN PRINCIPAL ===

document.addEventListener('DOMContentLoaded', function () {
  console.log('🎓 I.E.M. María Goretti - Sistema cargado correctamente');

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
      offset: 100
    });
    console.log('✨ Animaciones AOS inicializadas');
  }

  let lastScrollTop = 0;
  const navbar = document.getElementById('mainNavbar');
  const scrollTopBtn = document.getElementById('scrollTop');

  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (navbar) {
      if (currentScroll > 100) {
        navbar.classList.add('scrolled');
        if (currentScroll > lastScrollTop && currentScroll > 200) {
          navbar.style.transform = 'translateY(-100%)';
        } else {
          navbar.style.transform = 'translateY(0)';
        }
      } else {
        navbar.classList.remove('scrolled');
        navbar.style.transform = 'translateY(0)';
      }
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }

    if (scrollTopBtn && currentScroll > 400) {
      scrollTopBtn.classList.toggle('visible', currentScroll > 400);
    }
  }, { passive: true });

  document.querySelectorAll('.navbar a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = target.offsetTop - navbarHeight - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  const particlesContainer = document.getElementById('particlesContainer');
  if (particlesContainer) {
    function createParticles() {
      particlesContainer.innerHTML = '';
      for (let i = 0; i < 25; i++) {
        setTimeout(() => {
          const particle = document.createElement('div');
          particle.classList.add('particle');
          particle.style.left = Math.random() * 100 + '%';
          particle.style.animationDelay = Math.random() * 8 + 's';
          particle.style.animationDuration = (Math.random() * 12 + 8) + 's';
          const colors = [
            'rgba(220, 38, 39, 0.7)',
            'rgba(255, 255, 255, 0.9)',
            'rgba(30, 64, 175, 0.6)',
            'rgba(248, 113, 113, 0.5)',
            'rgba(59, 130, 246, 0.6)'
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];
          particle.style.background = color;
          particle.style.boxShadow = `0 0 15px ${color}`;
          const size = Math.random() * 6 + 4;
          particle.style.width = size + 'px';
          particle.style.height = size + 'px';
          particlesContainer.appendChild(particle);
          setTimeout(() => particle.parentNode?.removeChild(particle), 12000);
        }, i * 200);
      }
    }
    createParticles();
    setInterval(createParticles, 18000);
  }

  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    heroTitle.style.opacity = '0';
    setTimeout(() => {
      heroTitle.style.opacity = '1';
      heroTitle.style.animation = 'fadeInUp 1.5s ease-out';
    }, 500);
  }

  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      if (scrolled < hero.offsetHeight) {
        hero.style.transform = `translateY(${-scrolled * 0.3}px)`;
      }
    }, { passive: true });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('animate');
    });
  });
  document.querySelectorAll('.section').forEach(section => observer.observe(section));

  document.querySelectorAll('img').forEach(handleImageError);
  console.log('🌟 Todos los efectos visuales y contenido dinámico están activos');
});

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}