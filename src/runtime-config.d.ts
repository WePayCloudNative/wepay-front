interface RuntimeConfig {
  VITE_SPA_CLIENT_ID: string;
  VITE_ENTRA_TENANT_ID: string;
  VITE_API_CLIENT_ID: string;
  VITE_BFF_BASE_URL: string;
  /** Opcional. Minutos sin confirmar el pago antes de alertar (por defecto 1, para la demo; real: 30). */
  MINUTOS_ALERTA_PAGO?: number;
}

interface Window {
  RUNTIME_CONFIG: RuntimeConfig;
}