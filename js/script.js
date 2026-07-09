"use strict";

// ---------- Estado de la aplicación ----------

// Arreglo de objetos: aquí se guardan todas las mascotas registradas
let mascotas = [];

// Contador simple para generar un id único por registro
let siguienteId = 1;

// Estado de la interfaz: filtro de estado activo y texto de búsqueda
let filtroActivo = "todos"; // "todos" | "pendiente" | "atendido"
let terminoBusqueda = "";
let ordenAlfabetico = false;

// ---------- Referencias al DOM ----------

const formMascota = document.getElementById("formMascota");
const inputNombre = document.getElementById("nombre");
const selectEspecie = document.getElementById("especie");
const inputPropietario = document.getElementById("propietario");
const inputEdad = document.getElementById("edad");

const mensajeValidacion = document.getElementById("mensajeValidacion");

const listaMascotasEl = document.getElementById("listaMascotas");
const estadoVacioEl = document.getElementById("estadoVacio");

const statTotalEl = document.getElementById("statTotal");
const statPendientesEl = document.getElementById("statPendientes");
const statAtendidosEl = document.getElementById("statAtendidos");

const inputBuscador = document.getElementById("buscador");
const contenedorChips = document.getElementById("filtroEstado");
const btnOrdenar = document.getElementById("btnOrdenar");

const relojActualEl = document.getElementById("relojActual");

// 1. REGISTRO DE MASCOTA

/**
 * Maneja el envío del formulario: valida los datos y, si son válidos,
 * crea el objeto mascota, lo agrega al arreglo y refresca la interfaz.
 */
function registrarMascota(evento) {
  evento.preventDefault();

  // Obtenemos los valores "en crudo" desde el formulario
  const datosCrudos = {
    nombre: inputNombre.value,
    especie: selectEspecie.value,
    propietario: inputPropietario.value,
    edad: inputEdad.value,
  };

  const resultado = validarFormulario(datosCrudos);

  if (!resultado.esValido) {
    mostrarErrores(resultado.errores);
    return;
  }

  ocultarErrores();

  // Creamos el objeto mascota (arreglo de objetos, tal como pide la pauta)
  const nuevaMascota = {
    id: siguienteId++,
    nombre: resultado.datos.nombre,
    especie: resultado.datos.especie,
    propietario: resultado.datos.propietario,
    edad: resultado.datos.edad,
    atendido: false,
  };

  mascotas.push(nuevaMascota);

  formMascota.reset();
  inputNombre.focus();

  mostrarMascotas();
  actualizarEstadisticas();
}

// 2. VALIDACIÓN DEL FORMULARIO

/**
 * Valida los datos ingresados según las reglas de la pauta:
 *  - ningún campo vacío
 *  - edad numérica positiva
 *  - sin espacios en blanco al inicio/fin (trim)
 *  - nombre de al menos 2 caracteres
 * Devuelve { esValido, errores, datos } sin usar alert().
 */
function validarFormulario(datos) {
  const errores = [];

  const nombre = datos.nombre.trim();
  const especie = datos.especie.trim();
  const propietario = datos.propietario.trim();
  const edadTexto = String(datos.edad).trim();
  const edad = Number(edadTexto);

  if (nombre === "") {
    errores.push("El nombre de la mascota es obligatorio.");
  } else if (nombre.length < 2) {
    errores.push("El nombre de la mascota debe tener al menos 2 caracteres.");
  }

  if (especie === "") {
    errores.push("Debes seleccionar una especie.");
  }

  if (propietario === "") {
    errores.push("El nombre del propietario es obligatorio.");
  } else if (propietario.length < 2) {
    errores.push("El nombre del propietario debe tener al menos 2 caracteres.");
  }

  if (edadTexto === "") {
    errores.push("La edad es obligatoria.");
  } else if (Number.isNaN(edad) || edad <= 0) {
    errores.push("La edad debe ser un número positivo.");
  }

  return {
    esValido: errores.length === 0,
    errores,
    datos: { nombre, especie, propietario, edad },
  };
}

/** Muestra los mensajes de error en pantalla, sin alert(). */
function mostrarErrores(errores) {
  mensajeValidacion.innerHTML = "";

  const titulo = document.createElement("p");
  titulo.textContent = "Revisa los siguientes datos antes de continuar:";
  titulo.style.margin = "0 0 4px";
  mensajeValidacion.appendChild(titulo);

  const lista = document.createElement("ul");
  errores.forEach((textoError) => {
    const item = document.createElement("li");
    item.textContent = textoError;
    lista.appendChild(item);
  });
  mensajeValidacion.appendChild(lista);

  mensajeValidacion.hidden = false;
  marcarCamposInvalidos();
}

/** Oculta el bloque de errores y limpia los estilos de campo inválido. */
function ocultarErrores() {
  mensajeValidacion.hidden = true;
  mensajeValidacion.innerHTML = "";
  [inputNombre, selectEspecie, inputPropietario, inputEdad].forEach((campo) =>
    campo.classList.remove("campo--error"),
  );
}

/** Resalta visualmente los campos vacíos o inválidos. */
function marcarCamposInvalidos() {
  const campos = [
    { el: inputNombre, valor: inputNombre.value.trim(), minLen: 2 },
    { el: selectEspecie, valor: selectEspecie.value.trim(), minLen: 1 },
    { el: inputPropietario, valor: inputPropietario.value.trim(), minLen: 2 },
  ];

  campos.forEach(({ el, valor, minLen }) => {
    el.classList.toggle("campo--error", valor.length < minLen);
  });

  const edad = Number(inputEdad.value.trim());
  const edadInvalida =
    inputEdad.value.trim() === "" || Number.isNaN(edad) || edad <= 0;
  inputEdad.classList.toggle("campo--error", edadInvalida);
}

// 3. MOSTRAR REGISTROS (manipulación dinámica del DOM)

/**
 * Renderiza en pantalla la lista de mascotas, aplicando el filtro de
 * estado y el término de búsqueda actualmente activos.
 */
function mostrarMascotas() {
  // Limpiamos el contenedor antes de volver a pintar
  listaMascotasEl.textContent = "";

  const mascotasVisibles = obtenerMascotasFiltradas();

  if (mascotasVisibles.length === 0) {
    estadoVacioEl.hidden = false;
    estadoVacioEl.textContent =
      mascotas.length === 0
        ? "Aún no hay pacientes registrados. Completa el formulario para comenzar."
        : "No se encontraron mascotas con ese criterio de búsqueda o filtro.";
    return;
  }

  estadoVacioEl.hidden = true;

  for (const mascota of mascotasVisibles) {
    const tarjeta = crearTarjetaMascota(mascota);
    listaMascotasEl.appendChild(tarjeta);
  }
}

/** Aplica búsqueda, filtro de estado y orden alfabético sobre el arreglo. */
function obtenerMascotasFiltradas() {
  let resultado = mascotas.filter((mascota) => {
    const coincideBusqueda = mascota.nombre
      .toLowerCase()
      .includes(terminoBusqueda.toLowerCase());

    const coincideFiltro =
      filtroActivo === "todos" ||
      (filtroActivo === "pendiente" && !mascota.atendido) ||
      (filtroActivo === "atendido" && mascota.atendido);

    return coincideBusqueda && coincideFiltro;
  });

  if (ordenAlfabetico) {
    // copia para no mutar el arreglo original al ordenar
    resultado = [...resultado].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return resultado;
}

/** Construye el elemento HTML (tarjeta) para una mascota, usando el DOM. */
function crearTarjetaMascota(mascota) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta-mascota";
  tarjeta.classList.toggle("is-atendido", mascota.atendido);
  tarjeta.dataset.id = mascota.id;

  const info = document.createElement("div");
  info.className = "tarjeta-mascota__info";

  const nombreEl = document.createElement("p");
  nombreEl.className = "tarjeta-mascota__nombre";
  nombreEl.textContent = mascota.nombre;

  const metaEl = document.createElement("p");
  metaEl.className = "tarjeta-mascota__meta";
  metaEl.textContent =
    `${mascota.especie} · ${mascota.edad} ${mascota.edad === 1 ? "año" : "años"} · ` +
    `Propietario: ${mascota.propietario}`;

  info.appendChild(nombreEl);
  info.appendChild(metaEl);

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.classList.toggle("is-atendido", mascota.atendido);
  badge.textContent = mascota.atendido ? "Atendido" : "Pendiente";

  const acciones = document.createElement("div");
  acciones.className = "tarjeta-mascota__acciones";

  const btnAtender = document.createElement("button");
  btnAtender.type = "button";
  btnAtender.className = "boton boton--atender";
  btnAtender.textContent = mascota.atendido ? "Atendido" : "Atender";
  btnAtender.disabled = mascota.atendido;
  btnAtender.addEventListener("click", () => cambiarEstado(mascota.id));

  const btnEliminar = document.createElement("button");
  btnEliminar.type = "button";
  btnEliminar.className = "boton boton--eliminar";
  btnEliminar.textContent = "Eliminar";
  btnEliminar.setAttribute(
    "aria-label",
    `Eliminar registro de ${mascota.nombre}`,
  );
  btnEliminar.addEventListener("click", () => eliminarMascota(mascota.id));

  acciones.appendChild(badge);
  acciones.appendChild(btnAtender);
  acciones.appendChild(btnEliminar);

  tarjeta.appendChild(info);
  tarjeta.appendChild(acciones);

  return tarjeta;
}

// 4. CAMBIAR ESTADO

/** Cambia el estado de una mascota (pendiente -> atendido) según su id. */
function cambiarEstado(id) {
  const mascota = mascotas.find((m) => m.id === id);
  if (!mascota || mascota.atendido) return;

  mascota.atendido = true;

  mostrarMascotas();
  actualizarEstadisticas();
}

/** Elimina un registro del arreglo (mejora opcional). */
function eliminarMascota(id) {
  mascotas = mascotas.filter((m) => m.id !== id);
  mostrarMascotas();
  actualizarEstadisticas();
}

// 5. ESTADÍSTICAS

/** Recalcula y pinta el total de pacientes, pendientes y atendidos. */
function actualizarEstadisticas() {
  const total = mascotas.length;
  let pendientes = 0;
  let atendidos = 0;

  for (const mascota of mascotas) {
    if (mascota.atendido) {
      atendidos++;
    } else {
      pendientes++;
    }
  }

  statTotalEl.textContent = total;
  statPendientesEl.textContent = pendientes;
  statAtendidosEl.textContent = atendidos;
}

// Herramientas (búsqueda, filtro, orden) — desafío adicional

inputBuscador.addEventListener("input", (evento) => {
  terminoBusqueda = evento.target.value;
  mostrarMascotas();
});

contenedorChips.addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip");
  if (!chip) return;

  filtroActivo = chip.dataset.filtro;

  document
    .querySelectorAll(".chip")
    .forEach((c) => c.classList.toggle("is-activo", c === chip));

  mostrarMascotas();
});

btnOrdenar.addEventListener("click", () => {
  ordenAlfabetico = !ordenAlfabetico;
  btnOrdenar.textContent = ordenAlfabetico
    ? "Orden de registro"
    : "Ordenar A–Z";
  mostrarMascotas();
});

// Reloj de cabecera (detalle visual, no forma parte de la pauta)

function actualizarReloj() {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hora = ahora.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  relojActualEl.textContent = `${fecha} · ${hora}`;
}

// Inicialización

formMascota.addEventListener("submit", registrarMascota);

actualizarReloj();
setInterval(actualizarReloj, 30000);

mostrarMascotas();
actualizarEstadisticas();
