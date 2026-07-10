/* empty css                                 */
import { c as createComponent, d as renderComponent, r as renderTemplate, b as createAstro, m as maybeRenderHead, a as addAttribute } from '../chunks/astro/server_CglUIAEX.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_BA9-qfNE.mjs';
import { q as query } from '../chunks/db_DHr_SbWc.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Admin = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Admin;
  let errorMsg = "";
  let successMsg = "";
  if (Astro2.request.method === "POST") {
    try {
      const data = await Astro2.request.formData();
      const action = data.get("action");
      const id = data.get("id") ? parseInt(data.get("id").toString()) : null;
      const nombre = data.get("nombre")?.toString().trim();
      const descripcion = data.get("descripcion")?.toString().trim();
      const precio_minorista = parseFloat(data.get("precio_minorista")?.toString() || "0");
      const precio_mayorista = parseFloat(data.get("precio_mayorista")?.toString() || "0");
      const categoria = data.get("categoria")?.toString();
      const stock = parseInt(data.get("stock")?.toString() || "0");
      const codigo_foto = data.get("codigo_foto")?.toString().trim();
      if (action === "guardar") {
        if (!nombre || !codigo_foto || isNaN(precio_minorista) || isNaN(precio_mayorista)) {
          errorMsg = "Por favor, completa todos los campos requeridos correctamente.";
        } else {
          if (id) {
            await query(
              "UPDATE camisetas SET codigo_foto=?, nombre=?, descripcion=?, precio_minorista=?, precio_mayorista=?, categoria=?, stock=? WHERE id=?",
              [codigo_foto, nombre, descripcion, precio_minorista, precio_mayorista, categoria, stock, id]
            );
            successMsg = "Camiseta actualizada correctamente.";
          } else {
            await query(
              "INSERT INTO camisetas (codigo_foto, nombre, descripcion, precio_minorista, precio_mayorista, categoria, stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [codigo_foto, nombre, descripcion, precio_minorista, precio_mayorista, categoria, stock]
            );
            successMsg = "Nueva camiseta a\xF1adida con \xE9xito.";
          }
        }
      } else if (action === "eliminar") {
        if (id) {
          await query("DELETE FROM camisetas WHERE id = ?", [id]);
          successMsg = "Camiseta eliminada correctamente.";
        }
      }
    } catch (err) {
      console.error("Error procesando ABM:", err);
      errorMsg = `Error al procesar la solicitud: ${err.message}`;
    }
  }
  let camisetasList = [];
  try {
    camisetasList = await query("SELECT * FROM camisetas ORDER BY id DESC");
  } catch (e) {
    console.error("Error cargando lista de camisetas para admin:", e);
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard Admin ABM - El Para\xEDso del F\xFAtbol" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"> <!-- Cabecera Admin --> <div class="border-b border-neutral-900 pb-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"> <div> <div class="flex items-center gap-2 text-gold-500 font-bold text-xs uppercase tracking-widest"> <span>Panel de Gestión Privado</span> <span>★★★</span> </div> <h1 class="text-3xl font-extrabold uppercase mt-2">Administración de Camisetas</h1> </div> <div class="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-xs text-neutral-400">
Base de Datos: <strong class="text-celeste-400">Conectada / Mock Activo</strong> </div> </div> <!-- Mensajes de Feedback --> ${successMsg && renderTemplate`<div class="mb-8 p-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg flex items-center gap-2"> <span>✓</span> ${successMsg} </div>`} ${errorMsg && renderTemplate`<div class="mb-8 p-4 bg-red-950/60 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-2"> <span>⚠</span> ${errorMsg} </div>`} <div class="grid grid-cols-1 lg:grid-cols-3 gap-12"> <!-- COLUMNA 1: Formulario Alta/Modificación --> <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl h-fit"> <h2 id="form-title" class="text-lg font-bold uppercase text-neutral-100 border-b border-neutral-800 pb-3 mb-6">
Añadir Camiseta
</h2> <form method="POST" class="space-y-4" id="abm-form"> <!-- Campo oculto para ID si es una modificación --> <input type="hidden" name="id" id="jersey-id" value=""> <input type="hidden" name="action" id="form-action" value="guardar"> <div> <label class="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Nombre del Producto *</label> <input type="text" name="nombre" id="jersey-nombre" required placeholder="Ej: Camiseta Selección Argentina - 3 Estrellas" class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-celeste-500"> </div> <div> <label class="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Descripción del Producto</label> <textarea name="descripcion" id="jersey-descripcion" rows="3" placeholder="Detalles sobre la tela, escudo, parches..." class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-celeste-500"></textarea> </div> <div class="grid grid-cols-2 gap-4"> <div> <label class="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">P. Minorista ($) *</label> <input type="number" name="precio_minorista" id="jersey-precio-minorista" required step="0.01" placeholder="45000" class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-celeste-500"> </div> <div> <label class="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">P. Mayorista ($) *</label> <input type="number" name="precio_mayorista" id="jersey-precio-mayorista" required step="0.01" placeholder="32000" class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-celeste-500"> </div> </div> <div class="grid grid-cols-2 gap-4"> <div> <label class="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Categoría *</label> <select name="categoria" id="jersey-categoria" required class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-celeste-500"> <option value="Clubes">Clubes</option> <option value="Selecciones">Selecciones</option> <option value="Nacionales">Nacionales</option> <option value="Internacionales">Internacionales</option> </select> </div> <div> <label class="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Stock disponible</label> <input type="number" name="stock" id="jersey-stock" value="0" class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-celeste-500"> </div> </div> <div> <label class="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Código de Foto *</label> <input type="text" name="codigo_foto" id="jersey-codigo-foto" required placeholder="Ej: arg_home_3stars (sin extensión)" class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-celeste-500"> <p class="text-[10px] text-neutral-500 mt-1">Nombre exacto de la foto dentro de la carpeta /public/Imagenes/ (.webp)</p> </div> <!-- Botones Formulario --> <div class="pt-4 flex gap-2"> <button type="submit" class="flex-grow bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-all duration-300" id="submit-btn">
Guardar Camiseta
</button> <button type="button" id="cancel-edit-btn" class="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-all duration-300 hidden">
Cancelar
</button> </div> </form> </div> <!-- COLUMNA 2-3: Tabla Listado de Camisetas --> <div class="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl overflow-hidden flex flex-col"> <h2 class="text-lg font-bold uppercase text-neutral-100 border-b border-neutral-800 pb-3 mb-6">
Camisetas en Sistema (${camisetasList.length})
</h2> <!-- Tabla Responsive --> <div class="overflow-x-auto"> <table class="w-full text-left border-collapse text-xs"> <thead> <tr class="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider"> <th class="py-3 px-2">Foto / Código</th> <th class="py-3 px-2">Nombre</th> <th class="py-3 px-2">Precios</th> <th class="py-3 px-2 text-center">Stock</th> <th class="py-3 px-2 text-right">Acciones</th> </tr> </thead> <tbody class="divide-y divide-neutral-800/50"> ${camisetasList.map((camiseta) => renderTemplate`<tr class="hover:bg-neutral-850/50 transition-colors"> <!-- Foto Código --> <td class="py-4 px-2 flex items-center space-x-3"> <div class="h-10 w-10 bg-neutral-950 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border border-neutral-800"> <img${addAttribute(`/Imagenes/${camiseta.codigo_foto}.webp`, "src")}${addAttribute(camiseta.nombre, "alt")} class="h-full w-full object-cover" onerror="this.onerror=null; this.src='https://placehold.co/100x100/0a0a0a/74ACDF?text=Jersey';"> </div> <code class="text-[10px] text-celeste-400 font-mono">${camiseta.codigo_foto}</code> </td> <!-- Nombre / Categoria --> <td class="py-4 px-2"> <p class="font-bold text-neutral-200">${camiseta.nombre}</p> <span class="inline-block mt-0.5 text-[9px] font-bold text-neutral-500 uppercase bg-neutral-950 px-1.5 py-0.5 rounded"> ${camiseta.categoria} </span> </td> <!-- Precios minorista / mayorista --> <td class="py-4 px-2 space-y-0.5"> <p class="text-neutral-300">Min: <strong class="text-neutral-100">$${Number(camiseta.precio_minorista)}</strong></p> <p class="text-gold-500">May: <strong class="text-gold-400">$${Number(camiseta.precio_mayorista)}</strong></p> </td> <!-- Stock --> <td class="py-4 px-2 text-center"> <span${addAttribute(`font-bold px-2 py-0.5 rounded text-[10px] ${camiseta.stock > 10 ? "text-emerald-400 bg-emerald-950/20" : camiseta.stock > 0 ? "text-amber-400 bg-amber-950/20" : "text-red-400 bg-red-950/20"}`, "class")}> ${camiseta.stock} u.
</span> </td> <!-- Acciones (Editar / Eliminar) --> <td class="py-4 px-2 text-right"> <div class="inline-flex gap-2"> <button class="bg-neutral-800 hover:bg-celeste-500 hover:text-neutral-950 text-neutral-300 p-1.5 rounded transition-all duration-200 edit-btn"${addAttribute(camiseta.id, "data-id")}${addAttribute(camiseta.nombre, "data-nombre")}${addAttribute(camiseta.descripcion, "data-descripcion")}${addAttribute(camiseta.precio_minorista, "data-precio-minorista")}${addAttribute(camiseta.precio_mayorista, "data-precio-mayorista")}${addAttribute(camiseta.categoria, "data-categoria")}${addAttribute(camiseta.stock, "data-stock")}${addAttribute(camiseta.codigo_foto, "data-codigo-foto")} title="Editar camiseta"> <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path> </svg> </button> <form method="POST" class="inline" onsubmit="return confirm('¿Estás seguro de que deseas eliminar esta camiseta? Esta acción es irreversible.');"> <input type="hidden" name="id"${addAttribute(camiseta.id, "value")}> <input type="hidden" name="action" value="eliminar"> <button type="submit" class="bg-neutral-800 hover:bg-red-600 hover:text-white text-neutral-400 p-1.5 rounded transition-all duration-200" title="Eliminar camiseta"> <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path> </svg> </button> </form> </div> </td> </tr>`)} </tbody> </table> </div> ${camisetasList.length === 0 && renderTemplate`<p class="text-center py-8 text-neutral-500">No hay camisetas cargadas en la base de datos.</p>`} </div> </div> </section> ` })} `;
}, "C:/Users/milla/Documents/personal/code/paraisodelfutbol/src/pages/admin.astro", void 0);

const $$file = "C:/Users/milla/Documents/personal/code/paraisodelfutbol/src/pages/admin.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Admin,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
