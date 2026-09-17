// El email de confirmación es la única constancia que le queda al cliente:
// una fecha corrida un día o un plazo mostrado en UTC lo hacen presentarse el
// día equivocado o perder la reserva. Estos tests cubren esos dos husos —que
// son distintos entre sí— y el escapado del nombre.

import { describe, it, expect } from 'vitest';
import { construirEmailConfirmacion } from './email';
import { codigoReserva } from './codigo-reserva';

const BASE = {
  reservaId: 'a3f91c2d-7b4e-4f1a-9c22-5e8d0b6a7f31',
  email: 'cliente@ejemplo.com',
  nombreCliente: 'María González',
  unidadNombre: 'Motorhome',
  parcelaNombre: 'Parcela 12',
  fechaIngreso: '2026-10-09',
  fechaSalida: '2026-10-12',
  noches: 3,
  detalle: [
    {
      clave: 'GRANDE',
      etiqueta: 'Motorhome grande',
      cantidad: 1,
      precioUnitario: 18000,
      subtotal: 54000,
    },
  ],
  montoTotal: 54000,
  fechaLimitePago: new Date('2026-10-01T21:30:00Z'),
};

describe('construirEmailConfirmacion', () => {
  it('muestra las fechas de estadía sin corrimiento de día', () => {
    // '2026-10-09' es un día, no un instante. Formateado en huso de Argentina
    // (UTC-3) daría "8 de octubre" y el cliente llegaría un día antes.
    const { html, text } = construirEmailConfirmacion(BASE);
    expect(html).toContain('viernes, 9 de octubre');
    expect(html).toContain('lunes, 12 de octubre');
    expect(text).toContain('Ingreso: viernes, 9 de octubre');
    expect(html).not.toContain('8 de octubre');
  });

  it('muestra el plazo de pago en hora de Argentina y en formato 24 h', () => {
    // 21:30 UTC son las 18:30 en Puerto Iguazú. El server de Vercel corre en
    // UTC, así que sin `timeZone` el plazo saldría 3 horas adelantado.
    const { html } = construirEmailConfirmacion(BASE);
    expect(html).toContain('18:30 hs');
    expect(html).not.toContain('21:30');
    expect(html).not.toContain('p. m.');
  });

  it('deriva el código de reserva del uuid', () => {
    const { html, text } = construirEmailConfirmacion(BASE);
    expect(html).toContain('A3F91C2D');
    expect(text).toContain('Código de reserva: A3F91C2D');
  });

  it('usa el mismo código que muestra y busca el Panel', () => {
    // Si el email derivara el código con una regla propia, Staff no podría
    // encontrar la reserva que el cliente está dictando por teléfono.
    const { html } = construirEmailConfirmacion(BASE);
    expect(html).toContain(codigoReserva(BASE.reservaId));
  });

  it('el código es buscable: 8 caracteres hexadecimales', () => {
    // El buscador del Panel reconoce el código con /^[0-9a-f]{8}$/i para
    // traducirlo a un rango de uuid. Un formato distinto (guiones, más largo)
    // dejaría de entrar por esa rama y la búsqueda no encontraría nada.
    expect(codigoReserva(BASE.reservaId)).toMatch(/^[0-9A-F]{8}$/);
  });

  it('escapa el nombre del cliente', () => {
    const { html } = construirEmailConfirmacion({
      ...BASE,
      nombreCliente: '<script>alert(1)</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('en la reserva manual no habla de plazo ni de cancelación automática', () => {
    const { html } = construirEmailConfirmacion({ ...BASE, fechaLimitePago: null });
    expect(html).toContain('se coordina directamente con nosotros');
    expect(html).not.toContain('se cancela automáticamente');
  });

  it('muestra el total, la seña y el saldo que queda para el ingreso', () => {
    // 50% de $54.000. El total tiene que seguir a la vista: es lo que el
    // cliente compara contra lo que reservó.
    const { html, text } = construirEmailConfirmacion(BASE);
    expect(html).toContain('$54.000'); // total
    expect(html).toContain('Seña (50% del total)');
    expect(html).toContain('$27.000'); // seña y saldo
    expect(text).toContain('Seña (50% del total): $27.000');
    expect(text).toContain('Saldo al ingresar: $27.000');
  });

  it('recomienda transferir el total', () => {
    const { html, text } = construirEmailConfirmacion(BASE);
    expect(html).toContain('Te recomendamos transferir el total');
    expect(text).toContain('Te recomendamos transferir el total de $54.000');
  });

  it('avisa que se cancela solo si no se registra ningún pago', () => {
    // El cron cancela con monto_pagado <= 0 (cancelar-vencidas.ts): quien
    // abona la seña conserva la reserva. Si el email dijera "sin el pago
    // total" estaría amenazando con algo que no ocurre.
    const { html, text } = construirEmailConfirmacion(BASE);
    expect(html).toContain('no registramos ningún pago');
    expect(text).toContain('no registramos ningún pago');
    expect(html).not.toContain('sin el pago acreditado');
  });

  it('nunca deja marcadores de posición a la vista del cliente', () => {
    const { html, text } = construirEmailConfirmacion(BASE);
    expect(html).not.toContain('COMPLETAR');
    expect(text).not.toContain('COMPLETAR');
    expect(html).not.toContain('undefined');
  });
});
