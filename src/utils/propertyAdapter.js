export function adaptProperty(p) {
  if (!p) return null;
  return {
    // Campos que pides en las Cards/Modal
    id: p.id,
    title: p.name || "",
    image: p.img || "",
    price: p.price ?? null,
    description: "", // backend no trae descripción; déjalo vacío por ahora
    location: (p.location && (p.location.address || p.location.Address || p.location.ADDRESS)) || "",
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    m2: p.m2,
    visitsAvailable: typeof p.visit_slots !== "undefined" ? p.visit_slots : undefined,
    isProject: p.is_project,
    url: p.url,

    // Campos dueños (no vienen aún; quedan listos por si luego los agregas)
    ownerId: p.owner_id,
    ownerName: p.owner_name,
    
    // Campos de fecha (para filtrado)
    created_at: p.created_at || p.createdAt,
    published_at: p.published_at || p.publishedAt,
    date: p.date || p.created_at || p.createdAt,
  };
}
