import mysql from 'mysql2/promise';

let pool = null;

// Intentar crear la conexión
try {
  // Comprobamos si las variables básicas están definidas
  if (process.env.DB_HOST) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'paraiso_futbol_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  } else {
    console.warn('⚠️ No se detectaron variables de entorno para MySQL. Se utilizará base de datos mock/temporal.');
  }
} catch (error) {
  console.error('❌ Error inicializando el pool de MySQL:', error.message);
}

// Mock database temporal en memoria por si MySQL no está conectado o falla
let mockCamisetas = [
  {
    id: 1,
    codigo_foto: 'arg_home_3stars',
    nombre: 'Camiseta Selección Argentina - 3 Estrellas',
    descripcion: 'La camiseta oficial del Campeón del Mundo con las tres estrellas doradas y el parche oficial de campeón de la FIFA.',
    precio_minorista: 45000.00,
    precio_mayorista: 32000.00,
    categoria: 'Selecciones',
    stock: 50
  },
  {
    id: 2,
    codigo_foto: 'boca_home_24',
    nombre: 'Camiseta Boca Juniors Titular 2024',
    descripcion: 'Camiseta titular de Boca Juniors. Sentí la pasión xeneize en tu piel con el diseño tradicional azul y oro.',
    precio_minorista: 42000.00,
    precio_mayorista: 30000.00,
    categoria: 'Clubes',
    stock: 30
  },
  {
    id: 3,
    codigo_foto: 'river_home_24',
    nombre: 'Camiseta River Plate Titular 2024',
    descripcion: 'Camiseta titular de River Plate. La mítica banda roja cruzada con detalles modernos y tecnología de alta respirabilidad.',
    precio_minorista: 42000.00,
    precio_mayorista: 30000.00,
    categoria: 'Clubes',
    stock: 25
  },
  {
    id: 4,
    codigo_foto: 'inter_miami_messi',
    nombre: 'Camiseta Inter Miami - Messi 10',
    descripcion: 'La camiseta rosa de las garzas con el nombre y número del mejor jugador de la historia del fútbol.',
    precio_minorista: 48000.00,
    precio_mayorista: 35000.00,
    categoria: 'Internacionales',
    stock: 40
  },
  {
    id: 5,
    codigo_foto: 'real_madrid_titular',
    nombre: 'Camiseta Real Madrid Titular 2024/25',
    descripcion: 'La clásica camiseta blanca del rey de Europa, con detalles en dorado y la máxima elegancia.',
    precio_minorista: 46000.00,
    precio_mayorista: 33000.00,
    categoria: 'Internacionales',
    stock: 15
  }
];

export async function query(sql, params = []) {
  if (pool) {
    try {
      const [results] = await pool.query(sql, params);
      return results;
    } catch (error) {
      console.error('❌ Error ejecutando query en MySQL:', error.message);
      console.warn('🚨 Usando base de datos mock como plan de contingencia.');
      return handleMockQuery(sql, params);
    }
  } else {
    return handleMockQuery(sql, params);
  }
}

// Simulador rudimentario de SQL para el Mock en memoria (para que el ABM funcione sin MySQL instalado)
function handleMockQuery(sql, params) {
  const cleanSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  
  if (cleanSql.startsWith('select * from camisetas') || cleanSql.startsWith('select * from `camisetas`')) {
    // Si tiene un WHERE
    if (cleanSql.includes('where id =') || cleanSql.includes('where `id` =')) {
      const id = params[0];
      return mockCamisetas.filter(c => c.id === id);
    }
    return mockCamisetas;
  }
  
  if (cleanSql.startsWith('insert into camisetas') || cleanSql.startsWith('insert into `camisetas`')) {
    const nextId = mockCamisetas.length > 0 ? Math.max(...mockCamisetas.map(c => c.id)) + 1 : 1;
    // Parámetros: codigo_foto, nombre, descripcion, precio_minorista, precio_mayorista, categoria, stock
    const newJersey = {
      id: nextId,
      codigo_foto: params[0],
      nombre: params[1],
      descripcion: params[2],
      precio_minorista: parseFloat(params[3]),
      precio_mayorista: parseFloat(params[4]),
      categoria: params[5],
      stock: parseInt(params[6]) || 0
    };
    mockCamisetas.push(newJersey);
    return { insertId: nextId, affectedRows: 1 };
  }
  
  if (cleanSql.startsWith('update camisetas') || cleanSql.startsWith('update `camisetas`')) {
    // Parámetros en orden de UPDATE ... SET ... WHERE id = ?
    // codigo_foto=?, nombre=?, descripcion=?, precio_minorista=?, precio_mayorista=?, categoria=?, stock=? WHERE id=?
    const id = params[7];
    const index = mockCamisetas.findIndex(c => c.id === id);
    if (index !== -1) {
      mockCamisetas[index] = {
        id: id,
        codigo_foto: params[0],
        nombre: params[1],
        descripcion: params[2],
        precio_minorista: parseFloat(params[3]),
        precio_mayorista: parseFloat(params[4]),
        categoria: params[5],
        stock: parseInt(params[6]) || 0
      };
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }
  
  if (cleanSql.startsWith('delete from camisetas') || cleanSql.startsWith('delete from `camisetas`')) {
    const id = params[0];
    const initialLength = mockCamisetas.length;
    mockCamisetas = mockCamisetas.filter(c => c.id !== id);
    return { affectedRows: initialLength - mockCamisetas.length };
  }

  return [];
}
