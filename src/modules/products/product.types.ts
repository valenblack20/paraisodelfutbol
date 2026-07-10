export interface Product {
  id: number;
  codigoFoto: string;
  nombre: string;
  descripcion: string | null;
  precioMinorista: number;
  precioMayorista: number;
  categoria: string;
  stock: number;
  createdAt?: Date;
}
