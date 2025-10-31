
import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./MainPage.css";
import { api, useApiAuth } from "../../lib/api";
import PropertieCard from "../../components/PropertieCard/PropertieCard.jsx";
import PropertieCardModal from "../../components/PropertieCardModal/PropertieCardModal.jsx";
import { adaptProperty } from "../../utils/propertyAdapter";
import { useAuth0 } from "@auth0/auth0-react";

const PAGE_SIZE = 20; // Máximo 20 propiedades por página

const MainPage = () => {
  useApiAuth();
  const { user } = useAuth0();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtros temporales (los que el usuario edita)
  const [tempFilters, setTempFilters] = useState({ 
    location: "", 
    minPrice: "", 
    maxPrice: "",
    startDate: "",
    endDate: ""
  });
  
  // Filtros aplicados (los que realmente se usan en la búsqueda)
  const [appliedFilters, setAppliedFilters] = useState({ 
    location: "", 
    minPrice: "", 
    maxPrice: "",
    startDate: "",
    endDate: ""
  });
  
  // Ordenamiento temporal (el que el usuario selecciona)
  const [tempSortBy, setTempSortBy] = useState("");
  
  // Ordenamiento aplicado (el que realmente se usa)
  const [appliedSortBy, setAppliedSortBy] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // Llamados a /properties con paginación, filtros y ordenamiento
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };
      
      // Filtros de ubicación
      if (appliedFilters.location?.trim()) {
        params.location = appliedFilters.location.trim();
      }
      
      // Filtros de precio
      if (appliedFilters.minPrice && !isNaN(Number(appliedFilters.minPrice))) {
        params.min_price = Number(appliedFilters.minPrice);
      }
      if (appliedFilters.maxPrice && !isNaN(Number(appliedFilters.maxPrice))) {
        params.max_price = Number(appliedFilters.maxPrice);
      }
      
      // Filtros de fecha
      if (appliedFilters.startDate) {
        params.start_date = appliedFilters.startDate;
      }
      if (appliedFilters.endDate) {
        params.end_date = appliedFilters.endDate;
      }

      // Ordenamiento
      if (appliedSortBy) {
        params.sort_by = appliedSortBy;
      }

      console.log("📤 Parámetros enviados a la API:", params);

      const { data } = await api.get("/properties", { params });
      console.log("📥 Datos recibidos de la API:", data);
      console.log(`📊 Total de propiedades recibidas: ${data?.length || 0}`);
      
      // Verificar si los filtros de precio se están aplicando correctamente
      if (params.min_price || params.max_price) {
        const pricesOutOfRange = data.filter(item => {
          const itemPrice = item.price;
          if (params.min_price && itemPrice < params.min_price) return true;
          if (params.max_price && itemPrice > params.max_price) return true;
          return false;
        });
        
        if (pricesOutOfRange.length > 0) {
          console.warn("⚠️ ADVERTENCIA: El backend retornó propiedades fuera del rango de precio:");
          console.warn(`   Rango solicitado: ${params.min_price || '0'} - ${params.max_price || '∞'}`);
          console.warn("   Propiedades fuera del rango:", pricesOutOfRange.map(p => ({
            name: p.name,
            price: p.price
          })));
        } else {
          console.log("✅ Todos los precios están dentro del rango solicitado");
        }
      }
      
      // Mapeamos cada ítem al formato que consumen tus componentes
      let adapted = (data || []).map(adaptProperty);
      const originalCount = adapted.length;
      
      // ═══════════════════════════════════════════════════════════════
      // FILTRADO LOCAL COMO RESPALDO (por si el backend no filtra correctamente)
      // Esto se puede eliminar cuando el backend funcione correctamente
      // ═══════════════════════════════════════════════════════════════
      
      // 1. FILTRO DE UBICACIÓN
      if (params.location) {
        const beforeLocation = adapted.length;
        adapted = adapted.filter(item => {
          const location = (item.location || '').toLowerCase();
          const searchTerm = params.location.toLowerCase();
          return location.includes(searchTerm);
        });
        if (beforeLocation !== adapted.length) {
          console.log(`🔧 Filtro de ubicación: ${beforeLocation} → ${adapted.length} propiedades`);
        }
      }
      
      // 2. FILTRO DE PRECIO
      if (params.min_price || params.max_price) {
        const beforePrice = adapted.length;
        adapted = adapted.filter(item => {
          const price = item.price;
          if (price == null) return false; // Excluir items sin precio
          if (params.min_price && price < params.min_price) return false;
          if (params.max_price && price > params.max_price) return false;
          return true;
        });
        if (beforePrice !== adapted.length) {
          console.log(`🔧 Filtro de precio: ${beforePrice} → ${adapted.length} propiedades`);
        }
      }
      
      // 3. FILTRO DE FECHAS (esto es más complejo, depende de qué campo de fecha uses)
      // Asumiendo que las propiedades tienen un campo de fecha de publicación o disponibilidad
      if (params.start_date || params.end_date) {
        const beforeDate = adapted.length;
        adapted = adapted.filter(item => {
          // Intentar obtener la fecha de la propiedad
          // Puede ser created_at, published_at, available_from, etc.
          const itemDate = item.created_at || item.published_at || item.date;
          if (!itemDate) return true; // Si no tiene fecha, la dejamos pasar
          
          const itemDateObj = new Date(itemDate);
          
          if (params.start_date) {
            const startDate = new Date(params.start_date);
            if (itemDateObj < startDate) return false;
          }
          
          if (params.end_date) {
            const endDate = new Date(params.end_date);
            // Ajustar al final del día
            endDate.setHours(23, 59, 59, 999);
            if (itemDateObj > endDate) return false;
          }
          
          return true;
        });
        if (beforeDate !== adapted.length) {
          console.log(`🔧 Filtro de fechas: ${beforeDate} → ${adapted.length} propiedades`);
        }
      }
      
      // 4. ORDENAMIENTO LOCAL
      if (params.sort_by) {
        console.log(`🔧 Aplicando ordenamiento: ${params.sort_by}`);
        adapted = [...adapted].sort((a, b) => {
          switch (params.sort_by) {
            case 'price_asc':
              return (a.price || 0) - (b.price || 0);
            
            case 'price_desc':
              return (b.price || 0) - (a.price || 0);
            
            case 'date_desc': {
              const dateA = new Date(a.created_at || a.published_at || a.date || 0);
              const dateB = new Date(b.created_at || b.published_at || b.date || 0);
              return dateB - dateA; // Más reciente primero
            }
            
            case 'date_asc': {
              const dateA = new Date(a.created_at || a.published_at || a.date || 0);
              const dateB = new Date(b.created_at || b.published_at || b.date || 0);
              return dateA - dateB; // Más antiguo primero
            }
            
            default:
              return 0;
          }
        });
      }
      
      if (originalCount !== adapted.length) {
        console.log(`📊 Total filtrado local: ${originalCount} → ${adapted.length} propiedades`);
      }
      
      setItems(adapted);
      
      // Calculamos páginas totales basado en si hay resultados completos
      // Si recibimos menos de PAGE_SIZE, es la última página
      if (adapted.length < PAGE_SIZE) {
        setTotalPages(page);
      } else {
        // Asumimos que hay al menos una página más
        setTotalPages(page + 1);
      }
    } catch (e) {
      console.error("❌ Error al cargar propiedades:", e);
      setErr(e?.response?.data?.detail || e.message || "Error cargando propiedades");
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters, appliedSortBy]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Handlers UI
  const onView = useCallback((p) => {
    setSelected(p);
    setOpen(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setOpen(false);
    setSelected(null);
  }, []);

  // Callback cuando se agenda una visita
  const onScheduleVisit = useCallback((p) => {
    console.log(`Visita agendada para: ${p?.title}`);
    // El modal ya maneja toda la lógica de agendamiento
    // Aquí solo se registra para debugging
  }, []);

  // Aplicar filtros
  const handleApplyFilters = () => {
    console.log("🔍 Aplicando filtros:", tempFilters);
    console.log("🔍 Aplicando ordenamiento:", tempSortBy);
    setAppliedFilters({ ...tempFilters });
    setAppliedSortBy(tempSortBy);
    setPage(1);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    const emptyFilters = {
      location: "",
      minPrice: "",
      maxPrice: "",
      startDate: "",
      endDate: ""
    };
    setTempFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setTempSortBy("");
    setAppliedSortBy("");
    setPage(1);
  };

  // Contar filtros activos (basados en filtros aplicados)
  const activeFiltersCount = Object.values(appliedFilters).filter(v => v !== "").length + (appliedSortBy ? 1 : 0);

  return (
    <main className="main-with-sidebar">
      {/* Sidebar de filtros - Siempre visible */}
      <aside className="filters-sidebar">
        <div className="sidebar-header">
          <h2>🔍 Filtros</h2>
          {activeFiltersCount > 0 && (
            <span className="filter-count">{activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="sidebar-content">
          {/* Filtro de ubicación */}
          <div className="filter-group">
            <label htmlFor="location">📍 Ubicación</label>
            <input
              id="location"
              type="text"
              placeholder="Ej: Providencia..."
              value={tempFilters.location}
              onChange={(e) => setTempFilters((f) => ({ ...f, location: e.target.value }))}
            />
          </div>

          {/* Intervalo de precio */}
          <div className="filter-group">
            <label>💰 Precio</label>
            <input
              type="number"
              placeholder="Precio mínimo"
              value={tempFilters.minPrice}
              onChange={(e) => setTempFilters((f) => ({ ...f, minPrice: e.target.value }))}
              min="0"
            />
            <input
              type="number"
              placeholder="Precio máximo"
              value={tempFilters.maxPrice}
              onChange={(e) => setTempFilters((f) => ({ ...f, maxPrice: e.target.value }))}
              min="0"
            />
          </div>

          {/* Rango de fechas */}
          <div className="filter-group">
            <label>📅 Fechas</label>
            <input
              type="date"
              value={tempFilters.startDate}
              onChange={(e) => setTempFilters((f) => ({ ...f, startDate: e.target.value }))}
              title="Fecha de inicio"
            />
            <input
              type="date"
              value={tempFilters.endDate}
              onChange={(e) => setTempFilters((f) => ({ ...f, endDate: e.target.value }))}
              title="Fecha de fin"
            />
          </div>

          {/* Ordenamiento */}
          <div className="filter-group">
            <label>📊 Ordenar por</label>
            <select 
              value={tempSortBy} 
              onChange={(e) => setTempSortBy(e.target.value)}
            >
              <option value="">Sin ordenar</option>
              <option value="date_desc">Fecha más reciente</option>
              <option value="date_asc">Fecha más antigua</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
            </select>
          </div>

          {/* Botón aplicar filtros */}
          <button 
            className="btn-apply"
            onClick={handleApplyFilters}
          >
            🔍 Aplicar filtros
          </button>

          {/* Botón limpiar */}
          <button 
            className="btn-clear"
            onClick={handleClearFilters}
            disabled={activeFiltersCount === 0}
          >
            🗑️ Limpiar todo
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="main-content">
        <div className="content-header">
          <h1>Propiedades Disponibles</h1>
          {!loading && items.length > 0 && (
            <p className="results-count">{items.length} propiedades en esta página</p>
          )}
          
          {/* Mostrar filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="active-filters-display">
              <span className="filters-label">Filtros activos:</span>
              {appliedFilters.location && (
                <span className="filter-tag">📍 {appliedFilters.location}</span>
              )}
              {appliedFilters.minPrice && (
                <span className="filter-tag">💰 Desde ${Number(appliedFilters.minPrice).toLocaleString()}</span>
              )}
              {appliedFilters.maxPrice && (
                <span className="filter-tag">💰 Hasta ${Number(appliedFilters.maxPrice).toLocaleString()}</span>
              )}
              {appliedFilters.startDate && (
                <span className="filter-tag">📅 Desde {appliedFilters.startDate}</span>
              )}
              {appliedFilters.endDate && (
                <span className="filter-tag">📅 Hasta {appliedFilters.endDate}</span>
              )}
              {appliedSortBy && (
                <span className="filter-tag">
                  📊 {appliedSortBy === 'date_desc' ? 'Más recientes' : 
                       appliedSortBy === 'date_asc' ? 'Más antiguas' :
                       appliedSortBy === 'price_asc' ? 'Precio menor' : 
                       'Precio mayor'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Estado */}
        {loading && <p className="status-message">⏳ Cargando propiedades...</p>}
        {err && <p className="error-message">❌ {err}</p>}
        {!loading && !err && items.length === 0 && (
          <p className="status-message">😕 No se encontraron propiedades con estos filtros</p>
        )}

        {/* Grid */}
        <section className="items-grid">
          {items.map((p, i) => (
            <PropertieCard
              key={p.url || i}
              property={p}
              isOwner={false}
              onView={onView}
              // onBuy, onEdit, onDelete: solo para vista de dueño
            />
          ))}
        </section>

        {/* Paginación mejorada */}
        {items.length > 0 && (
          <div className="pager">
            <button 
              className="pager-btn" 
              disabled={page === 1} 
              onClick={() => setPage(1)}
              title="Primera página"
            >
              ⏮
            </button>
            <button 
              className="pager-btn" 
              disabled={page === 1} 
              onClick={() => setPage((x) => x - 1)}
            >
              ◀ Anterior
            </button>
            
            <div className="pager-numbers">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`pager-number ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="pager-btn" 
              disabled={items.length < PAGE_SIZE} 
              onClick={() => setPage((x) => x + 1)}
            >
              Siguiente ▶
            </button>
            <button 
              className="pager-btn" 
              disabled={items.length < PAGE_SIZE} 
              onClick={() => setPage(totalPages)}
              title="Última página"
            >
              ⏭
            </button>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <PropertieCardModal
        isOpen={open}
        onClose={onCloseModal}
        property={selected}
        currentUserId={user?.sub}
        onScheduleVisit={onScheduleVisit}
        // onEdit, onDelete: solo para vista de dueño
      />
    </main>
  );
};

export default MainPage;
