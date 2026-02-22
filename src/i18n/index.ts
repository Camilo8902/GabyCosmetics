import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Spanish translations
const es = {
  translation: {
    // Navigation
    nav: {
      home: 'Inicio',
      shop: 'Tienda',
      categories: 'Categorías',
      about: 'Nosotros',
      contact: 'Contacto',
      cart: 'Carrito',
      account: 'Mi Cuenta',
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      logout: 'Cerrar Sesión',
      admin: 'Administración',
      dashboard: 'Panel',
    },
    // Categories
    categories: {
      title: 'Nuestras Categorías',
      subtitle: 'Encuentra lo que necesitas',
      hair: 'Cuidado del Cabello',
      personal: 'Aseo Personal',
      view_all: 'Ver Todo',
    },
    // Products
    products: {
      featured: 'Productos Destacados',
      best_sellers: 'Más Vendidos',
      new_arrivals: 'Novedades',
      add_to_cart: 'Agregar al Carrito',
      view_details: 'Ver Detalles',
      out_of_stock: 'Agotado',
      in_stock: 'En Stock',
      price: 'Precio',
      quantity: 'Cantidad',
      total: 'Total',
      search: 'Buscar productos...',
      filters: 'Filtros',
      sort_by: 'Ordenar por',
      no_products: 'No se encontraron productos',
    },
    // Cart
    cart: {
      title: 'Carrito de Compras',
      empty: 'Tu carrito está vacío',
      subtotal: 'Subtotal',
      shipping: 'Envío',
      tax: 'Impuestos',
      total: 'Total',
      checkout: 'Proceder al Pago',
      continue_shopping: 'Continuar Comprando',
      remove: 'Eliminar',
      update: 'Actualizar',
    },
    // Auth
    auth: {
      login: 'Iniciar Sesión',
      register: 'Crear Cuenta',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirm_password: 'Confirmar Contraseña',
      full_name: 'Nombre Completo',
      forgot_password: '¿Olvidaste tu contraseña?',
      reset_password: 'Restablecer Contraseña',
      or_continue_with: 'O continuar con',
      google: 'Google',
      already_have_account: '¿Ya tienes cuenta?',
      dont_have_account: '¿No tienes cuenta?',
      verify_email: 'Verifica tu correo electrónico',
      verification_sent: 'Te hemos enviado un correo de verificación',
    },
    // Footer
    footer: {
      about: 'Sobre Nosotros',
      about_text: 'Gaby Cosmetics es tu destino para productos de belleza premium. Nos especializamos en el cuidado del cabello y productos de aseo personal de la más alta calidad.',
      quick_links: 'Enlaces Rápidos',
      customer_service: 'Servicio al Cliente',
      contact_us: 'Contáctanos',
      faq: 'Preguntas Frecuentes',
      shipping: 'Envíos',
      returns: 'Devoluciones',
      privacy: 'Privacidad',
      terms: 'Términos y Condiciones',
      newsletter: 'Suscríbete',
      newsletter_text: 'Recibe las últimas novedades y ofertas exclusivas',
      subscribe: 'Suscribirse',
      email_placeholder: 'Tu correo electrónico',
      rights: 'Todos los derechos reservados',
    },
    // Why Choose Us
    why_us: {
      title: '¿Por qué Elegirnos?',
      quality: 'Calidad Premium',
      quality_desc: 'Solo trabajamos con las mejores marcas y productos de alta calidad',
      shipping: 'Envío Rápido',
      shipping_desc: 'Entrega rápida y segura a tu puerta',
      support: 'Soporte 24/7',
      support_desc: 'Estamos aquí para ayudarte en cualquier momento',
      secure: 'Pago Seguro',
      secure_desc: 'Tus transacciones están 100% protegidas',
    },
    // Testimonials
    testimonials: {
      title: 'Lo que dicen nuestros clientes',
    },
    // Admin
    admin: {
      dashboard: 'Panel de Control',
      products: 'Productos',
      orders: 'Pedidos',
      users: 'Usuarios',
      categories: 'Categorías',
      companies: 'Empresas',
      settings: 'Configuración',
      reports: 'Reportes',
      inventory: 'Inventario',
    },
    // Common
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      yes: 'Sí',
      no: 'No',
      confirm: 'Confirmar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      view: 'Ver',
      close: 'Cerrar',
      actions: 'Acciones',
    },
  },
};

// English translations
const en = {
  translation: {
    // Navigation
    nav: {
      home: 'Home',
      shop: 'Shop',
      categories: 'Categories',
      about: 'About',
      contact: 'Contact',
      cart: 'Cart',
      account: 'My Account',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      admin: 'Admin',
      dashboard: 'Dashboard',
    },
    // Categories
    categories: {
      title: 'Our Categories',
      subtitle: 'Find what you need',
      hair: 'Hair Care',
      personal: 'Personal Care',
      view_all: 'View All',
    },
    // Products
    products: {
      featured: 'Featured Products',
      best_sellers: 'Best Sellers',
      new_arrivals: 'New Arrivals',
      add_to_cart: 'Add to Cart',
      view_details: 'View Details',
      out_of_stock: 'Out of Stock',
      in_stock: 'In Stock',
      price: 'Price',
      quantity: 'Quantity',
      total: 'Total',
      search: 'Search products...',
      filters: 'Filters',
      sort_by: 'Sort by',
      no_products: 'No products found',
    },
    // Cart
    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      tax: 'Tax',
      total: 'Total',
      checkout: 'Proceed to Checkout',
      continue_shopping: 'Continue Shopping',
      remove: 'Remove',
      update: 'Update',
    },
    // Auth
    auth: {
      login: 'Login',
      register: 'Create Account',
      email: 'Email',
      password: 'Password',
      confirm_password: 'Confirm Password',
      full_name: 'Full Name',
      forgot_password: 'Forgot your password?',
      reset_password: 'Reset Password',
      or_continue_with: 'Or continue with',
      google: 'Google',
      already_have_account: 'Already have an account?',
      dont_have_account: "Don't have an account?",
      verify_email: 'Verify your email',
      verification_sent: 'We have sent you a verification email',
    },
    // Footer
    footer: {
      about: 'About Us',
      about_text: 'Gaby Cosmetics is your destination for premium beauty products. We specialize in hair care and personal grooming products of the highest quality.',
      quick_links: 'Quick Links',
      customer_service: 'Customer Service',
      contact_us: 'Contact Us',
      faq: 'FAQ',
      shipping: 'Shipping',
      returns: 'Returns',
      privacy: 'Privacy',
      terms: 'Terms & Conditions',
      newsletter: 'Subscribe',
      newsletter_text: 'Get the latest news and exclusive offers',
      subscribe: 'Subscribe',
      email_placeholder: 'Your email',
      rights: 'All rights reserved',
    },
    // Why Choose Us
    why_us: {
      title: 'Why Choose Us?',
      quality: 'Premium Quality',
      quality_desc: 'We only work with the best brands and high-quality products',
      shipping: 'Fast Shipping',
      shipping_desc: 'Fast and secure delivery to your door',
      support: '24/7 Support',
      support_desc: "We're here to help you anytime",
      secure: 'Secure Payment',
      secure_desc: 'Your transactions are 100% protected',
    },
    // Testimonials
    testimonials: {
      title: 'What our customers say',
    },
    // Admin
    admin: {
      dashboard: 'Dashboard',
      products: 'Products',
      orders: 'Orders',
      users: 'Users',
      categories: 'Categories',
      companies: 'Companies',
      settings: 'Settings',
      reports: 'Reports',
      inventory: 'Inventory',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      view: 'View',
      close: 'Close',
      actions: 'Actions',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es,
      en,
    },
    lng: 'es', // Default language
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
