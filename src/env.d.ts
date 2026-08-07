/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    usuario: { id: string; nombre: string; rol: 'staff' | 'admin' } | null;
  }
}
