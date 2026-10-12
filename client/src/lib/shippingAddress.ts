export const OTHER_CITY_VALUE = "__other_city__";

export const WORLD_COUNTRIES = [
  "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán",
  "Bahamas", "Baréin", "Bangladés", "Barbados", "Bélgica", "Belice", "Benín", "Bielorrusia", "Birmania (Myanmar)", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi",
  "Bután", "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Ciudad del Vaticano", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba",
  "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Esuatini", "Etiopía",
  "Filipinas", "Finlandia", "Fiyi", "Francia", "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana",
  "Haití", "Honduras", "Hungría", "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia",
  "Jamaica", "Japón", "Jordania", "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kosovo", "Kuwait",
  "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo",
  "Macedonia del Norte", "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique",
  "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda",
  "Omán", "Países Bajos", "Pakistán", "Palaos", "Palestina", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal",
  "Reino Unido", "República Centroafricana", "República Checa", "República del Congo", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumania", "Rusia",
  "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam",
  "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu",
  "Ucrania", "Uganda", "Uruguay", "Uzbekistán", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Yibuti", "Zambia", "Zimbabue",
] as const;

export const COLOMBIA_LOCATIONS = [
  { department: "Amazonas", cities: ["Leticia"] },
  { department: "Antioquia", cities: ["Medellín", "Bello", "Envigado", "Itagüí", "Rionegro", "Apartadó"] },
  { department: "Arauca", cities: ["Arauca", "Saravena"] },
  { department: "Atlántico", cities: ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia"] },
  { department: "Bogotá D.C.", cities: ["Bogotá"] },
  { department: "Bolívar", cities: ["Cartagena", "Magangué", "Turbaco"] },
  { department: "Boyacá", cities: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá"] },
  { department: "Caldas", cities: ["Manizales", "Chinchiná", "La Dorada"] },
  { department: "Caquetá", cities: ["Florencia"] },
  { department: "Casanare", cities: ["Yopal", "Aguazul", "Villanueva"] },
  { department: "Cauca", cities: ["Popayán", "Santander de Quilichao"] },
  { department: "Cesar", cities: ["Valledupar", "Aguachica"] },
  { department: "Chocó", cities: ["Quibdó"] },
  { department: "Córdoba", cities: ["Montería", "Cereté"] },
  { department: "Cundinamarca", cities: ["Soacha", "Chía", "Zipaquirá", "Facatativá", "Girardot"] },
  { department: "Guainía", cities: ["Inírida"] },
  { department: "Guaviare", cities: ["San José del Guaviare"] },
  { department: "Huila", cities: ["Neiva", "Pitalito"] },
  { department: "La Guajira", cities: ["Riohacha", "Maicao"] },
  { department: "Magdalena", cities: ["Santa Marta", "Ciénaga"] },
  { department: "Meta", cities: ["Villavicencio", "Acacías"] },
  { department: "Nariño", cities: ["Pasto", "Ipiales", "Tumaco"] },
  { department: "Norte de Santander", cities: ["Cúcuta", "Ocaña", "Villa del Rosario"] },
  { department: "Putumayo", cities: ["Mocoa", "Puerto Asís"] },
  { department: "Quindío", cities: ["Armenia", "Calarcá"] },
  { department: "Risaralda", cities: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"] },
  { department: "San Andrés, Providencia y Santa Catalina", cities: ["San Andrés", "Providencia"] },
  { department: "Santander", cities: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"] },
  { department: "Sucre", cities: ["Sincelejo", "Corozal"] },
  { department: "Tolima", cities: ["Ibagué", "Espinal", "Melgar"] },
  { department: "Valle del Cauca", cities: ["Cali", "Palmira", "Buenaventura", "Tuluá", "Buga", "Cartago", "Jamundí"] },
  { department: "Vaupés", cities: ["Mitú"] },
  { department: "Vichada", cities: ["Puerto Carreño"] },
] as const;

export const COLOMBIA_DEPARTMENTS = COLOMBIA_LOCATIONS.map((location) => location.department);

export function getColombianCities(department: string) {
  return COLOMBIA_LOCATIONS.find((location) => location.department === department)?.cities ?? [];
}

export function isColombia(country: string) {
  return country === "Colombia";
}

export type StoredShippingAddress = {
  address?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  department?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export function formatShippingAddress(address?: StoredShippingAddress | null) {
  if (!address) return "";
  const region = isColombia(address.country ?? "Colombia") ? address.department : (address.stateProvince ?? address.department);
  return [address.address, address.addressLine2, address.city, region, address.postalCode, address.country]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(", ");
}
