import { StorageService } from '../../src/services/storage';

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(() => {
    storage = new StorageService();
  });

  test('should be instantiable', () => {
    expect(storage).toBeDefined();
  });

  test('should have saveBookmarks method', () => {
    expect(typeof storage.saveBookmarks).toBe('function');
  });

  test('should have getBookmarks method', () => {
    expect(typeof storage.getBookmarks).toBe('function');
  });

  test('should have saveFollowings method', () => {
    expect(typeof storage.saveFollowings).toBe('function');
  });

  test('should have getFollowings method', () => {
    expect(typeof storage.getFollowings).toBe('function');
  });

  test('should have saveCategories method', () => {
    expect(typeof storage.saveCategories).toBe('function');
  });

  test('should have getCategories method', () => {
    expect(typeof storage.getCategories).toBe('function');
  });

  test('should have exportData method', () => {
    expect(typeof storage.exportData).toBe('function');
  });

  test('should have importData method', () => {
    expect(typeof storage.importData).toBe('function');
  });

  test('should have clearAll method', () => {
    expect(typeof storage.clearAll).toBe('function');
  });
});
