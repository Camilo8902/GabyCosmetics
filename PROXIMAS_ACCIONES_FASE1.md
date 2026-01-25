# 🎬 Próximas Acciones Inmediatas - Fase 1

## 🎯 Objetivo de Hoy/Mañana

**Conectar Landing Page con datos REALES de Supabase**

Tiempo estimado: **3-4 horas**  
Impacto: **Alto** (se ve 100% profesional)  
Riesgo: **Bajo** (no afecta otras partes)

---

## 📋 Checklist de Implementación

### 1️⃣ FeaturedProducts.tsx (30 min)

**Archivo**: `src/components/landing/FeaturedProducts.tsx`

**Cambio**:
```tsx
// ANTES: Usa demoProducts estático
const demoProducts: (Product & { image: string })[] = [ ... ]

// DESPUÉS: Usa useFeaturedProducts() del hook
const { data: featured, isLoading } = useFeaturedProducts(1, 4);
const products = featured?.data || [];
```

**Tareas**:
- [ ] Importar `useFeaturedProducts` de `@/hooks`
- [ ] Crear query para productos featured
- [ ] Mapear resultado a componente
- [ ] Agregar loading state
- [ ] Agregar empty state
- [ ] Agregar error handling

**QA Checklist**:
- [ ] Datos cargan sin error
- [ ] Loading animation aparece
- [ ] Imágenes cargan correctamente
- [ ] Links funcionan
- [ ] Responsive ok

---

### 2️⃣ BestSellers.tsx (45 min)

**Archivo**: `src/components/landing/BestSellers.tsx`

**Necesita**:
1. Hook nuevo `useBestSellers()` en `src/hooks/useBestSellers.ts`
2. Conectar con `orderService.getBestSellers()`

**Tareas**:
- [ ] Crear hook `useBestSellers()`
- [ ] Crear método `getBestSellers()` en orderService
  ```ts
  // Devuelve: Productos con count de ventas
  // Query: SELECT product_id, count(*) as sales
  //        FROM order_items GROUP BY product_id
  //        ORDER BY sales DESC
  ```
- [ ] Conectar BestSellers.tsx con hook
- [ ] Agregar loading/error states

**QA Checklist**:
- [ ] Top vendidos aparecen correctamente
- [ ] Ordenado por ventas
- [ ] Datos activos = true
- [ ] Imágenes ok

---

### 3️⃣ CategoriesSection.tsx (30 min)

**Archivo**: `src/components/landing/CategoriesSection.tsx`

**Cambio**:
```tsx
// ANTES: Usa demoCategories
const demoCategories = [ ... ]

// DESPUÉS: Usa useCategories()
const { data: categories, isLoading } = useCategories(1, 6);
```

**Tareas**:
- [ ] Importar `useCategories` del hook
- [ ] Conectar con datos
- [ ] Agregar loading state
- [ ] Agregar error state

**QA Checklist**:
- [ ] Categorías cargan
- [ ] Orden correcto (order_index)
- [ ] Solo activas (is_active = true)
- [ ] Links funcionan

---

### 4️⃣ Testimonials.tsx (45 min)

**Archivo**: `src/components/landing/Testimonials.tsx`

**Necesita**:
1. Hook nuevo `useReviews()` en `src/hooks/useReviews.ts`
2. Filtrar solo reviews aprobadas (is_approved = true)

**Tareas**:
- [ ] Crear hook `useReviews({ is_approved: true })`
- [ ] Conectar Testimonials.tsx
- [ ] Mapear reviews a testimonios
- [ ] Rating visible
- [ ] Nombre del reviewer visible
- [ ] Agregar fallback si no hay reviews

**QA Checklist**:
- [ ] Reviews aprobadas visible
- [ ] Rating (stars) correcto
- [ ] Carousek funciona (si existe)
- [ ] No muestra reviews no aprobadas

---

### 5️⃣ Newsletter.tsx (30 min)

**Archivo**: `src/components/landing/Newsletter.tsx`

**Cambio**:
```tsx
// ANTES: Fake submit
const handleSubscribe = async () => {
  toast.success('Suscripción exitosa');
}

// DESPUÉS: Guarda en DB
const handleSubscribe = async (email: string) => {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email, is_active: true }]);
  if (error) {
    toast.error('Error al suscribirse');
  } else {
    toast.success('¡Suscripción exitosa!');
    setEmail(''); // Limpiar
  }
}
```

**Tareas**:
- [ ] Validar email
- [ ] Verificar no duplicados
- [ ] Insertar en `newsletter_subscribers`
- [ ] Manejar errores
- [ ] Mensajes claros al usuario

**QA Checklist**:
- [ ] Email válido requerido
- [ ] Sin duplicados
- [ ] Toast de éxito
- [ ] Datos en Supabase
- [ ] Puede desuscribirse (opcional)

---

## 🧪 Testing Manual

### Por Cada Componente
```
1. Cargar página
2. ¿Datos cargan sin error?
3. ¿Loading state aparece mientras carga?
4. ¿Error handling funciona?
5. ¿Se ve bien en mobile/tablet/desktop?
6. ¿Links funcionan?
7. ¿Performance ok? (< 3s load)
```

### Verificación en Supabase
```
1. Abrir Vercel/Supabase console
2. Verificar que las queries se ejecutan
3. Ver datos retornados
4. Verificar RLS policies
5. Revisar logs de errores
```

---

## 📊 Estimado de Tiempo

| Tarea | Tiempo | Dificultad |
|-------|--------|-----------|
| 1. FeaturedProducts | 30 min | ⭐ Fácil |
| 2. BestSellers | 45 min | ⭐⭐ Medio |
| 3. CategoriesSection | 30 min | ⭐ Fácil |
| 4. Testimonials | 45 min | ⭐⭐ Medio |
| 5. Newsletter | 30 min | ⭐ Fácil |
| **Testing/QA** | 30 min | ⭐⭐ Medio |
| **TOTAL** | **3-4 horas** | |

---

## 🚀 Orden de Implementación

### Recomendado (por dependencia)
1. **CategoriesSection** (independiente)
2. **FeaturedProducts** (independiente)
3. **BestSellers** (requiere crear hook)
4. **Testimonials** (requiere crear hook)
5. **Newsletter** (independiente)

### Alternativa (por dificultad)
1. **Fáciles primero**: CategoriesSection, FeaturedProducts, Newsletter
2. **Medias después**: BestSellers, Testimonials

---

## 💾 Commits Sugeridos

```bash
# Commit 1: Categories y Featured
git commit -m "feat: connect landing categories and featured products to real data"

# Commit 2: Best sellers y testimonios
git commit -m "feat: add best sellers hook and connect testimonials"

# Commit 3: Newsletter
git commit -m "feat: implement newsletter subscription in supabase"

# Commit 4: Polish
git commit -m "refactor: improve landing page performance and ux"
```

---

## ✅ Definition of Done (por componente)

**Un componente está "HECHO" cuando**:
- ✅ Usa datos reales de Supabase
- ✅ Tiene loading state
- ✅ Tiene error handling
- ✅ Sin datos mock/hardcoded
- ✅ Testeado manualmente
- ✅ Responsive ok
- ✅ Performance ok (< 3s)
- ✅ Documentado si necesario

---

## 🐛 Posibles Errores y Soluciones

### "No hay datos"
- Verificar que los datos existen en Supabase
- Revisar RLS policies
- Verificar query en consola

### "Error de autenticación"
- Ya debería estar fijo (lo corregimos hoy)
- Si aún hay problema: revisar `useAuthStore`

### "Imágenes no cargan"
- Verificar URLs en DB
- Revisar CORS
- Usar fallback image

### "Performance lento"
- Agregar `staleTime` en hook
- Usar `select` para reducir datos
- Lazy load imágenes

---

## 📚 Recursos Útiles

**Hooks ya creados** (usa estos):
- `useCategories()` - Lista categorías
- `useProducts()` - Lista productos
- `useOrders()` - Lista órdenes (para BestSellers)
- `useUsers()` - Lista usuarios

**Servicios** (no los modificar):
- `categoryService.ts`
- `productService.ts`
- `orderService.ts`

**Utilidades**:
- `formatCurrency()` - Para precios
- `formatDate()` - Para fechas

---

## 🎯 Resultado Esperado

**ANTES**: Landing page con datos fake, se ve demo  
**DESPUÉS**: Landing page con datos REALES, se ve profesional

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar este documento
2. Buscar en `PROJECT_REVIEW.md`
3. Revisar tipos en `src/types/index.ts`
4. Preguntar en el código (comentarios)

---

**Creado**: Enero 25, 2026
**Status**: 🟢 Listo para empezar
**Próximo**: Commiting estos cambios a Github
