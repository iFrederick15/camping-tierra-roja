import { useEffect, useRef } from 'react';
import { parseDniPdf417, type DniScanResult } from '../lib/dniParser';

// Una pistola lectora en modo "keyboard wedge" tipea el string completo en
// milisegundos y termina con Enter (o Tab) — muy por debajo del intervalo
// entre teclas de una persona escribiendo a mano.
const UMBRAL_INTERVALO_MS = 50;
// Por debajo de esto, un Enter/Tab es el flujo normal del recepcionista
// (confirmar un campo, pasar al siguiente), no el final de un escaneo.
const LONGITUD_MINIMA_SCAN = 15;
// Si se corta un escaneo a mitad de camino (o nunca llega el Enter), no dejar
// el buffer contaminando el próximo tipeo.
const TIMEOUT_ABANDONO_MS = 200;

interface UseDniScannerOptions {
  activo: boolean;
  onScan: (resultado: DniScanResult) => void;
  onError?: () => void;
}

// Escucha el tipeo a nivel de ventana mientras `activo` es true y, cuando
// reconoce el patrón de una pistola lectora, intercepta esas teclas (no
// deben aparecer sueltas en el campo que tenga foco) y entrega el resultado
// parseado. El tipeo manual normal no se toca.
export function useDniScanner({ activo, onScan, onError }: UseDniScannerOptions) {
  const bufferRef = useRef('');
  const ultimoTiempoRef = useRef(0);
  const esScanRef = useRef(false);
  const timeoutAbandonoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activo) return;

    function limpiarBuffer() {
      bufferRef.current = '';
      esScanRef.current = false;
      if (timeoutAbandonoRef.current) {
        clearTimeout(timeoutAbandonoRef.current);
        timeoutAbandonoRef.current = null;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      const ahora = performance.now();
      const intervalo = ahora - ultimoTiempoRef.current;
      ultimoTiempoRef.current = ahora;

      if (e.key === 'Enter' || e.key === 'Tab') {
        const buffer = bufferRef.current;
        limpiarBuffer();
        if (buffer.length < LONGITUD_MINIMA_SCAN) return; // Enter/Tab normal del usuario

        const resultado = parseDniPdf417(buffer);
        e.preventDefault();
        if (resultado) {
          onScan(resultado);
        } else {
          onError?.();
        }
        return;
      }

      if (e.key.length !== 1) return; // ignora Shift, flechas, etc.

      if (intervalo > UMBRAL_INTERVALO_MS) {
        // Pausa larga desde la tecla anterior: probablemente arranca un
        // tipeo manual nuevo, no un escaneo.
        bufferRef.current = e.key;
        esScanRef.current = false;
      } else {
        bufferRef.current += e.key;
        if (bufferRef.current.length >= 3) esScanRef.current = true;
      }

      // Recién cuando el ritmo de tipeo confirma que es la pistola se
      // empiezan a interceptar las teclas (antes de eso, se dejan pasar
      // normalmente para no romper el tipeo manual).
      if (esScanRef.current) {
        e.preventDefault();
      }

      if (timeoutAbandonoRef.current) clearTimeout(timeoutAbandonoRef.current);
      timeoutAbandonoRef.current = setTimeout(limpiarBuffer, TIMEOUT_ABANDONO_MS);
    }

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      limpiarBuffer();
    };
  }, [activo, onScan, onError]);
}
