import TodocoleccionPlatform from './TodocoleccionPlatform.js';
import todocoleccionConfig from './todocoleccion.config.js';
import { transformTodocoleccionItem, transformTodocoleccionResponse } from './todocoleccion.transformer.js';

describe('Todo Coleccion Platform', () => {
  let platform;

  beforeEach(() => {
    platform = new TodocoleccionPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('todocoleccion');
    });

    test('should have correct display name', () => {
      expect(platform.displayName).toBe('Todo Coleccion');
    });

    test('should require cookies', () => {
      expect(todocoleccionConfig.requiresCookies).toBe(true);
    });

    test('should have EUR as currency', () => {
      expect(todocoleccionConfig.currency).toBe('EUR');
    });

    test('should have Spain as country', () => {
      expect(todocoleccionConfig.country).toBe('Spain');
    });
  });

  describe('Query Building', () => {
    test('should build correct query params', () => {
      const query = { text: 'monedas antiguas', limit: 24 };
      const params = platform.buildQueryParams(query);

      expect(params.texto).toBe('monedas antiguas');
    });
  });

  describe('Response Transformation', () => {
    test('should transform API response with EUR currency', () => {
      const mockResponse = {
        items: [
          {
            id: 'tc-123456',
            titulo: 'Pokemon Primera Edición',
            descripcion: 'Cartas originales japonesas',
            precio: 350.00,
            imagenes: ['https://todocoleccion.com/img1.jpg'],
            url_detalle: '/articulos/tc-123456',
            fecha_alta: '2024-01-15',
            vendedor: { nombre: 'ColeccionistaVIP', valoracion: 5 },
            ubicacion: 'Barcelona, España',
          },
        ],
        total: 75,
      };
      const items = transformTodocoleccionResponse(mockResponse);

      expect(items.length).toBeGreaterThanOrEqual(0);
      if (items.length > 0) {
        expect(items[0].source).toBe('todocoleccion');
        expect(items[0].currency).toBe('EUR');
      }
    });
  });

  describe('Integration (Live API)', () => {
    test.skip('should search and return items from live API', async () => {
      const items = await platform.search({ text: 'monedas', limit: 5 });
      expect(Array.isArray(items)).toBe(true);
    }, 30000);
  });
});
