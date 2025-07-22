export class ScopeManager {
  scopes: Map<string, any>[]; // 用于管理作用域
  currentScope: Map<string, any> | null;
  constructor() {
    this.scopes = []; // 用于管理作用域
    this.currentScope = null;
    this.enterScope();
  }

  enterScope() {
    const newScope = new Map<string, any>();
    this.scopes.push(newScope);
    this.currentScope = newScope;
  }

  exitScope() {
    this.scopes.pop();
    this.currentScope = this.scopes[this.scopes.length - 1] || null;
  }

  declareVariable(name: string, value: any) {
    if (this.currentScope) {
      this.currentScope.set(name, value);
    }
  }

  getVariableValue<T>(name: string) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];
      if (scope.has(name)) {
        return scope.get(name) as T;
      }
    }
    return null;
  }
}
