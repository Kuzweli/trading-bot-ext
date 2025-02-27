export class ModuleManager {
  constructor() {
    this.modules = new Map();
  }

  async registerModule(name, moduleInstance) {
    if (this.modules.has(name)) {
      throw new Error(`Module ${name} is already registered`);
    }
    
    if (typeof moduleInstance.init !== 'function') {
      throw new Error(`Module ${name} must have an init method`);
    }

    this.modules.set(name, moduleInstance);
    await moduleInstance.init();
  }

  getModule(name) {
    if (!this.modules.has(name)) {
      throw new Error(`Module ${name} not found`);
    }
    return this.modules.get(name);
  }

  async unregisterModule(name) {
    if (!this.modules.has(name)) {
      throw new Error(`Module ${name} not found`);
    }

    const module = this.modules.get(name);
    if (typeof module.cleanup === 'function') {
      await module.cleanup();
    }

    this.modules.delete(name);
  }
}