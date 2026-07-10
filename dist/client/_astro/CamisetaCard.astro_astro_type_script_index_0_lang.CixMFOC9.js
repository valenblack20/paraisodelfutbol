document.addEventListener("astro:page-load",()=>{document.querySelectorAll(".product-card").forEach(e=>{const t=e.querySelector(".add-to-cart-btn");t&&t.addEventListener("click",()=>{const o=e.getAttribute("data-id"),n=e.getAttribute("data-nombre"),a=parseFloat(e.getAttribute("data-precio-minorista")||"0"),r=parseFloat(e.getAttribute("data-precio-mayorista")||"0"),s=e.getAttribute("data-codigo-foto"),i={id:o,nombre:n,precioMinorista:a,precioMayorista:r,codigoFoto:s,cantidad:1};document.dispatchEvent(new CustomEvent("add-to-cart",{detail:i}));const c=t.innerHTML;t.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          ¡Agregado!
        `,t.classList.remove("bg-neutral-800","text-neutral-200"),t.classList.add("bg-celeste-500","text-neutral-950"),setTimeout(()=>{t.innerHTML=c,t.classList.remove("bg-celeste-500","text-neutral-950"),t.classList.add("bg-neutral-800","text-neutral-200")},1200)})})});
