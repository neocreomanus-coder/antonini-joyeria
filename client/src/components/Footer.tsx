import { Link } from "wouter";
import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { catalogPath } from "@/lib/navigation";

const LOGO = "/manus-storage/antonini-logo-v3_d35b56de.png";

const SOCIAL = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/antoninijoyeriacol?igsh=MXJkcjgzNjMxM216MA==",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1EgtXWUNXF/?mibextid=wwXIfr",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@antonini.joyeria?_r=1&_t=ZS-98JNe1fbbBE",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
  },
];

const FOOTER_CATEGORIES = [
  { label: "Cadenas", slug: "cadenas" },
  { label: "Topos", slug: "topos" },
  { label: "Anillos", slug: "anillos" },
  { label: "Dijes", slug: "dijes" },
  { label: "Pulseras", slug: "pulseras" },
  { label: "Argollas", slug: "argollas" },
  { label: "Perfumería", slug: "perfumeria" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-green text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand + Social */}
          <div className="md:col-span-1">
            <img src={LOGO} alt="Antonini Joyería" className="h-14 w-auto object-contain mb-4" />
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Fabricantes y exportadores de joyería en oro 18k. Más de 20 años de experiencia. Calidad garantizada y diseños únicos para cada ocasión especial.
            </p>

            {/* Social icons */}
            <div>
              <p className="text-brand-gold text-[10px] font-bold uppercase tracking-widest mb-3">Síguenos</p>
              <div className="flex gap-3">
                {SOCIAL.map(({ name, href, icon }) => (
                  <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name}
                    className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold/10 transition-all duration-200">
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="text-brand-gold font-semibold text-xs tracking-widest uppercase mb-4">Categorías</h3>
            <ul className="space-y-2">
              {FOOTER_CATEGORIES.map(({ label, slug }) => (
                <li key={slug}>
                  <Link href={catalogPath(slug)}
                    className="text-white/70 text-sm hover:text-brand-gold transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Información */}
          <div>
            <h3 className="text-brand-gold font-semibold text-xs tracking-widest uppercase mb-4">Información</h3>
            <ul className="space-y-2">
              <li><Link href="/catalogo" className="text-white/70 text-sm hover:text-brand-gold transition-colors">Catálogo</Link></li>
              <li><Link href="/quienes-somos" className="text-white/70 text-sm hover:text-brand-gold transition-colors">Quiénes somos</Link></li>
              <li><Link href="/terminos-y-condiciones" className="text-white/70 text-sm hover:text-brand-gold transition-colors">Términos y condiciones</Link></li>
              <li><Link href="/cambios-y-devoluciones" className="text-white/70 text-sm hover:text-brand-gold transition-colors">Cambios y devoluciones</Link></li>
              <li><Link href="/politica-de-envios" className="text-white/70 text-sm hover:text-brand-gold transition-colors">Política de envíos</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-brand-gold font-semibold text-xs tracking-widest uppercase mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-white/70 text-sm">
                <MapPin size={15} className="text-brand-gold mt-0.5 flex-shrink-0" />
                <span>Colombia · Envíos nacionales</span>
              </li>
              <li className="flex items-center gap-2.5 text-white/70 text-sm">
                <Mail size={15} className="text-brand-gold flex-shrink-0" />
                <a href="mailto:gerenciacomercial@antoninijoyeria.com" className="hover:text-brand-gold transition-colors">gerenciacomercial@antoninijoyeria.com</a>
              </li>
              <li className="flex items-center gap-2.5 text-white/70 text-sm">
                <Phone size={15} className="text-brand-gold flex-shrink-0" />
                <a href="https://wa.me/573169308533" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors">WhatsApp: +57 316 930 8533</a>
              </li>
              <li className="flex items-start gap-2.5 text-white/70 text-sm">
                <Clock size={15} className="text-brand-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p>Lun–Vie: 9:00 am – 6:00 pm</p>
                  <p>Sáb: 9:00 am – 2:00 pm</p>
                  <p className="text-brand-gold font-medium">Tienda online: 24/7</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border-t border-white/10">
        <div className="container py-6 flex items-center justify-center">
          <img src="/manus-storage/payment-methods-professional_a6bdec4f.png" alt="Métodos de Pago Seguros" className="w-full max-w-2xl h-auto object-contain" />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col items-center justify-center gap-4 text-white/50 text-xs">
          <p>© {new Date().getFullYear()} Antonini Joyería. Todos los derechos reservados.</p>
          <p className="text-white/60 text-xs mt-2">
            Tienda Diseñada por <a href="https://wa.me/573244317594" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:text-white transition-colors font-semibold">NeoBusinessAgency</a> · <a href="https://www.instagram.com/neobusinessagency" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-brand-gold transition-colors">@neobusinessagency</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
