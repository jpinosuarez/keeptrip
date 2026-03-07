import { Component } from 'react';
import { ErrorFallback } from './ErrorFallback';

/**
 * Error Boundary para capturar errores de renderizado en React
 * Evita que errores en componentes hijos crasheen toda la app
 * 
 * Uso:
 * <ErrorBoundary fallback={<CustomFallback />}>
 *   <ComponenteQuePodriaFallar />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar state para que el siguiente render muestre el fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error a servicio de reporting (Sentry, etc.)
    console.error('ErrorBoundary capturó error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({ errorInfo });

    // Aquí se podría integrar con Sentry:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });

    // Opcionalmente recargar la página si el error persiste
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback custom o el default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
