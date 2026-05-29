/* ============================================================
   para-ella — scripts principales
   ============================================================ */

/* ============================================================
   AVIÓN — vuelo diagonal fijo en bucle (13 s vuelo + 5 s pausa)
   · NO sigue el mouse ni el touch: la posición depende solo del
     tiempo (requestAnimationFrame), nunca del cursor.
   · Trayectoria fija: entra por la izquierda al 25% del alto y
     sale por la derecha al 45% del alto.
   · Usa el MISMO dibujo detallado del avión (crema/coral/dorado).
   Lógica autocontenida con estilos inline: no depende de CSS.
   ============================================================ */
(function () {
  'use strict';

  /* ── Parámetros de tiempo y tamaño ───────────────────────── */
  var DUR_VUELO_MS = 13000;  /* tarda 13 s en cruzar la pantalla   */
  var DUR_PAUSA_MS = 5000;   /* 5 s de espera entre vuelos         */
  var CICLO_MS     = DUR_VUELO_MS + DUR_PAUSA_MS;  /* 18000 ms      */
  var TRAIL_MS     = 250;    /* intervalo entre círculos de estela */
  var ASPECTO      = 56 / 120; /* alto/ancho del viewBox del SVG    */

  /* Ancho del avión: 60 px en desktop, 35 px en mobile (< 768 px) */
  function anchoAvion() { return window.innerWidth < 768 ? 35 : 60; }

  /* SVG detallado (mismo dibujo que el avión decorativo): fuselaje
     crema, alas coral, cola naranja/dorada. Nariz apunta a la derecha,
     por lo que la cola (la parte de atrás) queda a la izquierda. */
  var SVG_AVION =
    '<svg viewBox="0 0 120 56" xmlns="http://www.w3.org/2000/svg" ' +
    'aria-hidden="true" style="display:block;width:100%;height:auto">' +
      '<path d="M14 28 C20 21 46 19 85 23 C96 24.5 106 26.5 110 28 ' +
              'C106 29.5 96 31.5 85 33 C46 37 20 35 14 28Z" ' +
              'fill="#FFF8F0" stroke="#E8D0B8" stroke-width="0.6"/>' +
      '<path d="M43 32 L29 51 L71 47 L66 32Z" fill="#F28B70"/>' +
      '<path d="M43 32 L66 32 L64 28 L45 27Z" fill="#F8B09A" opacity="0.7"/>' +
      '<path d="M16 27 L10 11 L25 22Z" fill="#E8621A"/>' +
      '<path d="M17 29 L9 41 L28 35Z" fill="#F5C842"/>' +
      '<path d="M85 23 C97 23 110 27 111 28 C110 29 97 33 85 33Z" fill="#E8621A"/>' +
      '<ellipse cx="69" cy="27" rx="4" ry="3.5" fill="#1A1A3E" opacity="0.52"/>' +
      '<ellipse cx="80" cy="27" rx="4" ry="3.5" fill="#1A1A3E" opacity="0.52"/>' +
      '<circle cx="70.5" cy="25.5" r="1.2" fill="#FFF8F0" opacity="0.6"/>' +
      '<circle cx="81.5" cy="25.5" r="1.2" fill="#FFF8F0" opacity="0.6"/>' +
      '<rect x="49" y="36" width="20" height="8" rx="4" fill="#C44E10" opacity="0.9"/>' +
      '<rect x="49" y="37" width="5" height="6" rx="2.5" fill="#E8621A" opacity="0.8"/>' +
      '<line x1="60" y1="20" x2="60" y2="34" stroke="#E8D0B8" stroke-width="0.5" opacity="0.5"/>' +
    '</svg>';

  /* ── 1) Contenedor a pantalla completa ───────────────────── */
  var contenedor = document.createElement('div');
  contenedor.id = 'avion-contenedor';
  var cs = contenedor.style;
  cs.position      = 'fixed';
  cs.zIndex        = '9999';
  cs.pointerEvents = 'none';
  cs.top           = '0';
  cs.left          = '0';
  cs.width         = '100%';
  cs.height        = '100%';
  cs.overflow      = 'hidden';
  document.body.appendChild(contenedor);

  /* ── 2) El avión ─────────────────────────────────────────── */
  var avion = document.createElement('div');
  avion.id = 'avion';
  avion.innerHTML = SVG_AVION;
  var as = avion.style;
  as.position        = 'absolute';
  as.width           = anchoAvion() + 'px';  /* se recalcula en cada frame */
  as.height          = 'auto';
  as.top             = '0';
  as.left            = '0';
  as.cursor          = 'pointer';
  as.pointerEvents   = 'auto';   /* clickeable aunque el contenedor no lo sea */
  as.transformOrigin = 'center center';
  as.filter          = 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))';
  as.willChange      = 'transform';
  avion.setAttribute('role', 'button');
  avion.setAttribute('aria-label', 'Avión — toca para soltar corazones');
  contenedor.appendChild(avion);

  /* ── 3) Bucle de vuelo con requestAnimationFrame ─────────── */
  var inicioCiclo = null;
  var lastTrail   = 0;

  /* Easing suave (easeInOutSine) para que la diagonal no sea robótica */
  function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  function frame(ts) {
    if (inicioCiclo === null) inicioCiclo = ts;
    var elapsed = (ts - inicioCiclo) % CICLO_MS;

    var vw = window.innerWidth;
    var vh = window.innerHeight;

    /* Tamaño dinámico (responde a resize): 60 px desktop / 35 px mobile */
    var ancho = anchoAvion();
    avion.style.width = ancho + 'px';
    var alto = ancho * ASPECTO;

    /* Trayectoria diagonal fija:
       entra por la izquierda al 25% del alto → sale por la derecha al 45% */
    var x0 = -(ancho + 30),  y0 = vh * 0.25;
    var x1 = vw + ancho + 30, y1 = vh * 0.45;

    if (elapsed <= DUR_VUELO_MS) {
      /* Fase de vuelo */
      var t  = easeInOutSine(elapsed / DUR_VUELO_MS);
      var x  = x0 + (x1 - x0) * t;
      var y  = y0 + (y1 - y0) * t;

      /* Inclinación según el ángulo de la trayectoria (suave) */
      var ang = Math.atan2(y1 - y0, x1 - x0) * (180 / Math.PI);

      avion.style.transform =
        'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) ' +
        'rotate(' + (ang * 0.7).toFixed(2) + 'deg)';
      avion.style.opacity = '1';

      /* 4) Estela DETRÁS del avión: como vuela hacia la derecha (nariz a
         la derecha), "detrás" es la cola = borde izquierdo. La soltamos
         junto a la cola, a la altura del centro vertical del avión. */
      if (ts - lastTrail > TRAIL_MS) {
        lastTrail = ts;
        soltarEstela(x + ancho * 0.10, y + alto / 2);
      }
    } else {
      /* Fase de pausa: el avión queda fuera de pantalla (a la derecha) */
      avion.style.opacity = '0';
    }

    requestAnimationFrame(frame);
  }

  /* ── 4) Estela: círculos blancos que se desvanecen ───────── */
  /*
     Cada llamada crea un círculo que vive ~600 ms. Como se generan
     cada 250 ms, hay ~2-3 círculos visibles a la vez detrás del avión.
     La coordenada recibida ya apunta a la cola (detrás del avión).
  */
  function soltarEstela(x, y) {
    var c = document.createElement('div');
    var s = c.style;
    s.position      = 'absolute';
    s.left          = x + 'px';
    s.top           = (y) + 'px';
    s.width         = '10px';
    s.height        = '10px';
    s.borderRadius  = '50%';
    s.background    = 'rgba(255,255,255,0.7)';
    s.pointerEvents = 'none';
    s.transform     = 'translate(-50%,-50%) scale(1)';
    contenedor.appendChild(c);

    /* Desvanecer + crecer con la Web Animations API y autolimpiar */
    var anim = c.animate(
      [
        { opacity: 0.7, transform: 'translate(-50%,-50%) scale(1)'   },
        { opacity: 0,   transform: 'translate(-50%,-50%) scale(2.4)' }
      ],
      { duration: 600, easing: 'ease-out', fill: 'forwards' }
    );
    anim.onfinish = function () { c.remove(); };
  }

  /* ── 5) Click en el avión → 8 corazones que suben ────────── */
  avion.addEventListener('click', function () {
    var rect = avion.getBoundingClientRect();
    var cx = rect.left + rect.width  / 2;
    var cy = rect.top  + rect.height / 2;

    for (var i = 0; i < 8; i++) {
      soltarCorazon(cx, cy, i);
    }
  });

  function soltarCorazon(cx, cy, idx) {
    var h = document.createElement('span');
    h.textContent = '❤️';
    var s = h.style;
    s.position      = 'absolute';
    s.left          = cx + 'px';
    s.top           = cy + 'px';
    s.fontSize      = (16 + Math.random() * 16) + 'px';
    s.pointerEvents = 'none';
    s.userSelect    = 'none';
    s.transform     = 'translate(-50%,-50%)';
    contenedor.appendChild(h);

    /* Dispersión horizontal y altura de subida aleatorias */
    var dx   = (Math.random() - 0.5) * 120;
    var rise = 120 + Math.random() * 90;
    var rot  = (Math.random() - 0.5) * 60;

    var anim = h.animate(
      [
        { opacity: 1, transform: 'translate(-50%,-50%) translate(0,0) rotate(0deg)' },
        { opacity: 1, offset: 0.15 },
        { opacity: 0, transform:
            'translate(-50%,-50%) translate(' + dx + 'px,' + (-rise) + 'px) rotate(' + rot + 'deg)' }
      ],
      { duration: 1400, delay: idx * 60, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
    );
    anim.onfinish = function () { h.remove(); };
  }

  /* ── Arrancar ────────────────────────────────────────────── */
  requestAnimationFrame(frame);

})();


/* ============================================================
   Animación staggered de postales — IntersectionObserver
   ============================================================ */
(function () {
  'use strict';

  var postales = document.querySelectorAll('[data-animada]');
  if (!postales.length) return;

  /* Fallback para navegadores muy antiguos sin IntersectionObserver */
  if (!window.IntersectionObserver) {
    postales.forEach(function (el) { el.classList.add('en-vista'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      var el  = entry.target;
      var idx = parseInt(el.getAttribute('data-idx') || '0', 10);

      /*
         Stagger de 4 en 4: cada grupo de 4 tarjetas que entran al viewport
         a la vez (layout de 4 columnas en desktop) recibe delays 0/100/200/300 ms.
         En 2 columnas (tablet) o 1 columna (móvil) el efecto sigue siendo
         agradable porque las tarjetas se ven entrar de a dos o de a una.
      */
      var delay = (idx % 4) * 110;
      el.style.transitionDelay = delay + 'ms';
      el.classList.add('en-vista');

      /* Limpiar el delay una vez terminada la transición de entrada
         para que :hover y futuras transiciones no hereden el retraso */
      var limpiar = delay + 750;
      setTimeout(function () {
        el.style.transitionDelay = '';
      }, limpiar);

      observer.unobserve(el);
    });
  }, {
    threshold:  0.10,           /* 10% visible basta para disparar */
    rootMargin: '0px 0px -40px 0px'   /* margen interno inferior */
  });

  /* Asignar índice secuencial y registrar cada postal */
  postales.forEach(function (el, i) {
    el.setAttribute('data-idx', i);
    observer.observe(el);
  });

})();


/* ============================================================
   Galería de fotos — polaroids con revelado tipo cuarto oscuro
   ============================================================ */
(function () {
  'use strict';

  /* ── Configuración ────────────────────────────────────────── */
  var TOTAL    = 21;
  var CARPETA  = 'fotos/';
  var KEY_PREF = 'caption-para-francis-';   /* prefijo localStorage */

  /* ── Iconos SVG inline (no dependencias externas) ─────────── */
  var ICO_CAMARA = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"',
    ' fill="none" stroke="currentColor" stroke-width="1.5"',
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8',
    ' a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>',
    '<circle cx="12" cy="13" r="4"/>',
    '</svg>'
  ].join('');

  var ICO_CERRAR = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"',
    ' viewBox="0 0 24 24" fill="none" stroke="currentColor"',
    ' stroke-width="2.5" stroke-linecap="round" aria-hidden="true">',
    '<line x1="18" y1="6" x2="6" y2="18"/>',
    '<line x1="6" y1="6" x2="18" y2="18"/>',
    '</svg>'
  ].join('');

  /* ── Estado del modal ─────────────────────────────────────── */
  var modalEl  = null;
  var modalImg = null;
  var modalCap = null;

  /* ── Placeholder para imagen no encontrada ────────────────── */
  function crearPlaceholder(num) {
    var ph = document.createElement('div');
    ph.className = 'foto-placeholder';
    ph.setAttribute('role', 'img');
    ph.setAttribute('aria-label', 'Espacio para foto ' + num);

    var ico = document.createElement('div');
    ico.className = 'foto-ph-icono';
    ico.innerHTML = ICO_CAMARA;

    var txt = document.createElement('span');
    txt.className = 'foto-ph-texto';
    txt.textContent = 'Agrega tu foto aquí';

    var nom = document.createElement('span');
    nom.className = 'foto-ph-nombre';
    nom.textContent = 'foto' + num + '.jpg';

    ph.appendChild(ico);
    ph.appendChild(txt);
    ph.appendChild(nom);
    return ph;
  }

  /* ── Crear un polaroid ────────────────────────────────────── */
  function crearItem(num) {
    /* Rotación leve: alternamos signo para un efecto natural */
    var signo = (num % 2 === 0) ? 1 : -1;
    var rot   = (signo * (Math.random() * 3.2 + 0.4)).toFixed(2);

    /* Contenedor polaroid */
    var item = document.createElement('div');
    item.className = 'foto-polaroid';
    item.style.setProperty('--rot', rot + 'deg');
    item.setAttribute('data-revelar', '');
    item.setAttribute('role', 'listitem');

    /* Marco (la hoja fotográfica con padding polaroid) */
    var marco = document.createElement('div');
    marco.className = 'foto-marco';

    /* Imagen */
    var img = document.createElement('img');
    img.className = 'foto-imagen';
    img.alt = 'Foto ' + num + ' de Francis';
    img.loading = 'lazy';
    img.decoding = 'async';

    /* Caption editable */
    var caption = document.createElement('div');
    caption.className = 'foto-caption';
    caption.contentEditable = 'true';
    caption.setAttribute('data-placeholder', 'Escribe algo aquí...');
    caption.spellcheck = false;
    caption.setAttribute('aria-label', 'Descripción editable de la foto ' + num);

    /* Cargar texto guardado */
    var storageKey = KEY_PREF + num;
    try {
      var guardado = localStorage.getItem(storageKey);
      if (guardado) caption.textContent = guardado;
    } catch (e) { /* localStorage no disponible (modo privado, etc.) */ }

    /* Guardar al perder el foco */
    caption.addEventListener('blur', function () {
      try { localStorage.setItem(storageKey, caption.textContent.trim()); } catch (e) {}
    });

    /* Enter confirma el caption sin insertar salto de línea */
    caption.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); caption.blur(); }
    });

    /* Evitar que el clic en el caption propague al marco (no abre modal) */
    caption.addEventListener('click',    function (e) { e.stopPropagation(); });
    caption.addEventListener('touchend', function (e) { e.stopPropagation(); });

    /* ── Error de carga → mostrar placeholder ── */
    img.addEventListener('error', function () {
      marco.classList.add('foto-marco--placeholder');
      if (img.parentNode === marco) marco.removeChild(img);
      marco.insertBefore(crearPlaceholder(num), marco.firstChild);
      item.style.cursor = 'default';
    });

    /* ── Clic en el marco → abrir modal (solo si hay imagen real) ── */
    marco.addEventListener('click', function () {
      if (marco.classList.contains('foto-marco--placeholder')) return;
      if (!img.complete || img.naturalWidth === 0) return;
      abrirModal(img.src, caption.textContent.trim());
    });

    /* Asignar src después de registrar listeners */
    img.src = CARPETA + 'foto' + num + '.jpg';

    marco.appendChild(img);
    item.appendChild(marco);
    item.appendChild(caption);
    return item;
  }

  /* ── Modal fullscreen ─────────────────────────────────────── */
  function crearModal() {
    modalEl = document.createElement('div');
    modalEl.className = 'foto-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-label', 'Foto ampliada');

    /* Overlay — clic para cerrar */
    var overlay = document.createElement('div');
    overlay.className = 'foto-modal-overlay';
    overlay.addEventListener('click', cerrarModal);

    /* Imagen + caption */
    var contenido = document.createElement('div');
    contenido.className = 'foto-modal-contenido';

    modalImg = document.createElement('img');
    modalImg.className = 'foto-modal-img';
    modalImg.alt = 'Foto ampliada';

    modalCap = document.createElement('p');
    modalCap.className = 'foto-modal-caption';

    contenido.appendChild(modalImg);
    contenido.appendChild(modalCap);

    /* Botón cerrar */
    var btnCerrar = document.createElement('button');
    btnCerrar.className = 'foto-modal-cerrar';
    btnCerrar.setAttribute('aria-label', 'Cerrar foto');
    btnCerrar.innerHTML = ICO_CERRAR;
    btnCerrar.addEventListener('click', cerrarModal);

    modalEl.appendChild(overlay);
    modalEl.appendChild(contenido);
    modalEl.appendChild(btnCerrar);
    document.body.appendChild(modalEl);

    /* Escape para cerrar */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarModal();
    });

    /* Swipe hacia abajo en móvil para cerrar */
    var touchStartY = 0;
    modalEl.addEventListener('touchstart', function (e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    modalEl.addEventListener('touchend', function (e) {
      if (e.changedTouches[0].clientY - touchStartY > 80) cerrarModal();
    }, { passive: true });
  }

  function abrirModal(src, captionText) {
    if (!modalEl) crearModal();
    modalImg.src = src;
    modalCap.textContent = captionText || '';
    modalCap.style.display = captionText ? '' : 'none';
    modalEl.classList.add('activo');
    document.body.style.overflow = 'hidden';
    /* Focus accesible al botón de cierre */
    setTimeout(function () {
      var btn = modalEl.querySelector('.foto-modal-cerrar');
      if (btn) btn.focus();
    }, 50);
  }

  function cerrarModal() {
    if (!modalEl) return;
    modalEl.classList.remove('activo');
    document.body.style.overflow = '';
  }

  /* ── IntersectionObserver — efecto de revelado ────────────── */
  function initRevelado(items) {
    if (!window.IntersectionObserver) {
      /* Fallback: revelar todo inmediatamente sin animación */
      items.forEach(function (el) {
        var img = el.querySelector('.foto-imagen');
        if (img) img.style.filter = 'none';
        el.classList.add('revelado');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el  = entry.target;
        var idx = parseInt(el.getAttribute('data-revelar-idx') || '0', 10);

        /* Stagger de la tarjeta (entrada al viewport) */
        var cardDelay = (idx % 4) * 90;   /* 0 / 90 / 180 / 270 ms */
        el.style.transitionDelay = cardDelay + 'ms';

        /* Stagger del revelado de la imagen
           (empieza DESPUÉS de que la tarjeta ya apareció) */
        var fotoImg = el.querySelector('.foto-imagen');
        if (fotoImg) {
          fotoImg.style.animationDelay = (cardDelay + 310) + 'ms';
        }

        el.classList.add('revelado');

        /* Limpiar el transitionDelay para no afectar :hover */
        setTimeout(function () {
          el.style.transitionDelay = '';
        }, cardDelay + 750);

        observer.unobserve(el);
      });
    }, {
      threshold:  0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    items.forEach(function (el, i) {
      el.setAttribute('data-revelar-idx', i);
      observer.observe(el);
    });
  }

  /* ── Inicializar ──────────────────────────────────────────── */
  var grid = document.getElementById('galeria-grid');
  if (!grid) return;

  var items = [];
  for (var n = 1; n <= TOTAL; n++) {
    var it = crearItem(n);
    grid.appendChild(it);
    items.push(it);
  }

  initRevelado(items);

})();


/* ============================================================
   Sección UNET — contador de días + animación del timeline
   ============================================================ */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     📅  FECHA DE PARTIDA — cambia este valor cuando quieras:
         Formato: 'AAAA-MM-DD'  (año-mes-día)
     ────────────────────────────────────────────────────────── */
  var FECHA_PARTIDA = new Date('2026-05-28');

  /* ── Utilidades de fecha ──────────────────────────────────── */

  /** Días completos desde FECHA_PARTIDA hasta hoy */
  function diasDesde(fecha) {
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    var dif = hoy.getTime() - fecha.getTime();
    return Math.max(0, Math.floor(dif / 86400000));
  }

  /** "desde el 15 de marzo de 2025" */
  function formatearFecha(fecha) {
    var meses = [
      'enero','febrero','marzo','abril','mayo','junio',
      'julio','agosto','septiembre','octubre','noviembre','diciembre'
    ];
    return 'desde el ' + fecha.getDate() +
           ' de ' + meses[fecha.getMonth()] +
           ' de ' + fecha.getFullYear();
  }

  /* ── Rellenar la etiqueta de fecha ───────────────────────── */
  var elFecha = document.getElementById('contador-fecha-texto');
  if (elFecha) elFecha.textContent = formatearFecha(FECHA_PARTIDA);

  /* ── Animación de conteo del número ──────────────────────── */
  function animarContador(objetivo) {
    var elNum = document.getElementById('contador-dias');
    if (!elNum) return;

    /* Duración proporcional al número, capped a 2.4 s */
    var duracion = Math.min(2400, 600 + objetivo * 1.8);
    var inicio   = null;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function paso(ts) {
      if (!inicio) inicio = ts;
      var progreso = Math.min((ts - inicio) / duracion, 1);
      var valor    = Math.round(easeOutCubic(progreso) * objetivo);
      /* Separador de miles en español (punto) */
      elNum.textContent = valor.toLocaleString('es');
      if (progreso < 1) requestAnimationFrame(paso);
    }

    requestAnimationFrame(paso);
  }

  /* ── Disparar el contador al entrar en viewport ──────────── */
  var cardContador = document.getElementById('contador-card');
  if (cardContador) {
    var totalDias = diasDesde(FECHA_PARTIDA);

    if (!window.IntersectionObserver) {
      /* Fallback sin IO: mostrar directamente */
      var elNum = document.getElementById('contador-dias');
      if (elNum) elNum.textContent = totalDias.toLocaleString('es');
    } else {
      var obsContador = new IntersectionObserver(function (entradas) {
        if (!entradas[0].isIntersecting) return;
        animarContador(totalDias);
        obsContador.disconnect();
      }, { threshold: 0.45 });

      obsContador.observe(cardContador);
    }
  }

  /* ── Animación staggered del timeline ────────────────────── */
  var tlItems = document.querySelectorAll('[data-tl]');
  if (!tlItems.length) return;

  if (!window.IntersectionObserver) {
    tlItems.forEach(function (el) { el.classList.add('tl-visible'); });
    return;
  }

  var obsTl = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;

      var el  = entrada.target;
      var idx = parseInt(el.getAttribute('data-tl-idx') || '0', 10);

      /*
         En desktop (horizontal) todos los items entran juntos:
         stagger de 120 ms por posición (0 / 120 / 240 / 360 / 480 ms).
         En mobile (vertical) aparecen de uno en uno → el delay
         apenas se nota pero sigue siendo agradable.
      */
      var delay = idx * 120;
      el.style.transitionDelay = delay + 'ms';
      el.classList.add('tl-visible');

      /* Limpiar delay para no afectar futuras transiciones hover */
      setTimeout(function () {
        el.style.transitionDelay = '';
      }, delay + 800);

      obsTl.unobserve(el);
    });
  }, {
    threshold:  0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  tlItems.forEach(function (el, i) {
    el.setAttribute('data-tl-idx', i);
    obsTl.observe(el);
  });

})();


/* ============================================================
   Toques finales — carta de entrada, reproductor, confeti
   ============================================================ */
(function () {
  'use strict';

  /* ── 1. CARTA DE ENTRADA ──────────────────────────────────── */
  var cartaEl = document.getElementById('carta-overlay');

  function cerrarCarta() {
    if (!cartaEl) return;
    cartaEl.classList.add('saliendo');
    /* Eliminar del DOM cuando termina la transición (0.75 s) */
    setTimeout(function () {
      if (cartaEl.parentNode) cartaEl.remove();
      document.body.style.overflow = '';
    }, 820);
  }

  if (cartaEl) {
    /* Bloquear scroll durante la animación introductoria */
    document.body.style.overflow = 'hidden';

    /* Cierre automático a los 2.3 s */
    var timerCarta = setTimeout(cerrarCarta, 2300);

    /* Clic / toque para saltar */
    cartaEl.addEventListener('click', function () {
      clearTimeout(timerCarta);
      cerrarCarta();
    }, { once: true });

    /* Teclado: Enter / Espacio / Escape para saltar */
    document.addEventListener('keydown', function skip(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        clearTimeout(timerCarta);
        cerrarCarta();
        document.removeEventListener('keydown', skip);
      }
    });
  }

  /* ── 2. REPRODUCTOR MINIMALISTA ───────────────────────────── */
  var repEl  = document.getElementById('reproductor');
  var repBtn = document.getElementById('rep-btn');

  if (repEl && repBtn) {
    var audio = new Audio('musica.mp3');
    audio.loop    = true;
    audio.preload = 'none';

    var icoPlay  = repBtn.querySelector('.ico-play');
    var icoPause = repBtn.querySelector('.ico-pause');

    function setReproduciendo(si) {
      repEl.classList.toggle('tocando', si);
      if (icoPlay)  icoPlay.style.display  = si ? 'none' : '';
      if (icoPause) icoPause.style.display = si ? ''     : 'none';
      repBtn.setAttribute('aria-label', si ? 'Pausar música' : 'Reproducir música');
    }

    repBtn.addEventListener('click', function () {
      if (audio.paused) {
        audio.play().then(function () {
          setReproduciendo(true);
        }).catch(function () {
          /* Autoplay bloqueado o archivo no encontrado */
          repEl.title = 'No se pudo reproducir musica.mp3';
        });
      } else {
        audio.pause();
        setReproduciendo(false);
      }
    });

    /* Si el loop falla, resetear icono */
    audio.addEventListener('ended', function () { setReproduciendo(false); });

    /* Archivo no encontrado → desactivar visualmente */
    audio.addEventListener('error', function () {
      repEl.style.opacity      = '0.45';
      repEl.style.cursor       = 'not-allowed';
      repBtn.disabled          = true;
      repEl.title              = 'Agrega musica.mp3 en la carpeta raíz del proyecto';
    });
  }

  /* ── 3. BOTÓN "💌 ENVIAR AMOR" — confeti + corazones ─────── */
  var btnAmor       = document.getElementById('btn-amor');
  var confettiActivo = false;

  if (btnAmor) {
    btnAmor.addEventListener('click', function () {
      if (confettiActivo) return;   /* debounce durante 3.3 s */
      confettiActivo = true;
      setTimeout(function () { confettiActivo = false; }, 3300);
      lanzarConfeti(btnAmor);
    });
  }

  /* ── Constantes del confeti ── */
  var SIMBOLOS = ['❤️','💛','🧡','💕','💫','✨','🌟','❤️','💛','❤️','🤍'];
  var COLORES  = ['#E8621A','#F28B70','#F5C842','#FFF8F0','#FAD96A','#F8B09A','#E06040'];

  function rfloat(a, b) { return a + Math.random() * (b - a); }

  function nuevaParticula(x, y, vx, vy, esEmoji) {
    var el = document.createElement('div');
    el.className = 'confeti-p';

    if (esEmoji) {
      el.textContent  = SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];
      el.style.fontSize   = rfloat(1.0, 2.2) + 'rem';
      el.style.lineHeight = '1';
    } else {
      el.style.width        = rfloat(5, 14) + 'px';
      el.style.height       = rfloat(4, 9)  + 'px';
      el.style.background   = COLORES[Math.floor(Math.random() * COLORES.length)];
      el.style.borderRadius = Math.random() > 0.55 ? '50%' : '2px';
    }

    document.body.appendChild(el);
    return {
      el,
      x: x, y: y,
      vx: vx, vy: vy,
      vr:  rfloat(-14, 14),
      rot: rfloat(0, 360),
      op:  1.0
    };
  }

  function lanzarConfeti(origen) {
    var rect = origen.getBoundingClientRect();
    var cx   = rect.left + rect.width  / 2;
    var cy   = rect.top  + rect.height / 2;
    var vw   = window.innerWidth;
    var pArr = [];

    /* — Explosión radial desde el botón (28 partículas) — */
    for (var i = 0; i < 28; i++) {
      /* Sesgo hacia arriba: rango -160° a +20° en lugar de -180° a 0° */
      var ang = rfloat(-Math.PI * 1.1, Math.PI * 0.2);
      var vel = rfloat(5, 16);
      pArr.push(nuevaParticula(
        cx, cy,
        Math.cos(ang) * vel,
        Math.sin(ang) * vel,
        Math.random() > 0.30
      ));
    }

    /* — Lluvia desde la parte superior (58 partículas) — */
    for (var j = 0; j < 58; j++) {
      pArr.push(nuevaParticula(
        rfloat(0, vw),
        rfloat(-60, -220),
        rfloat(-3, 3),
        rfloat(1.5, 5),
        Math.random() > 0.42
      ));
    }

    var DURACION   = 3000;
    var FADE_DESDE = DURACION * 0.68;
    var inicio     = performance.now();

    function frame(ts) {
      var elapsed = ts - inicio;

      if (elapsed >= DURACION) {
        pArr.forEach(function (p) { p.el.remove(); });
        return;
      }

      var fade = elapsed > FADE_DESDE
        ? 1 - (elapsed - FADE_DESDE) / (DURACION - FADE_DESDE)
        : 1;

      pArr = pArr.filter(function (p) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.14;    /* gravedad */
        p.vx *= 0.984;   /* resistencia del aire */
        p.rot += p.vr;
        p.op   = fade;

        if (p.y > window.innerHeight + 100) {
          p.el.remove();
          return false;
        }

        p.el.style.opacity   = p.op;
        p.el.style.transform =
          'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.rot + 'deg)';
        return true;
      });

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

})();
