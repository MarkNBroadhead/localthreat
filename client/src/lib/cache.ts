export class ApiCache {

  isLocalStorageAvailable = (): boolean =>  {
    var test = 'test';
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch(e) {
      return false;
    }
  }

  public set(id: string, value: string) {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(id, value);
    }
  }

  public get(id: string) {
    if (this.isLocalStorageAvailable()) {
      let value = localStorage.getItem(id);
      if (!!value) {
        return value;
      }
    }
  }
}