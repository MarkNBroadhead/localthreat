const { setTimeout } = window;

type Request = {
  name: string;
  resolve: (id: number) => void;
};

type Response = {
  characters?: {
    id: number;
    name: string;
  }[];
};

const queue: Request[] = [];

let timeoutRef = 0;

const isLocalStorageAvailable = (): boolean =>  {
    var test = 'test';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

const fetchIds = async (reqs: Request[]) => {
  let localStorageAvailable = isLocalStorageAvailable();
  let found = new Set();
  if (localStorageAvailable) {
    for (let req of reqs) {
      let item = localStorage.getItem(req.name);
      if (!!item) {
        found.add(req.name);
        req.resolve(parseInt(item));
      }
    }
  }
  if (found.size >= reqs.keys.length) {
    // All capsuleer IDs found in cache, not calling ESI.
    return;
  }
  const resp = await fetch(`https://esi.evetech.net/latest/universe/ids/`, {
    method: "post",
    body: JSON.stringify(reqs.filter(req => !found.has(req.name)).map((req) => req.name)),
  });
  if (!resp.ok) {
    throw Error(resp.statusText);
  }
  const data = (await resp.json()) as Response;
  data.characters?.forEach((char) => {
    const req = reqs.find(({ name }) => name === char.name);
    if (!req) {
      console.warn(`fetchIds: couldn't find response for name "${char.name}"`);
      return;
    }
    if (localStorageAvailable) {
      localStorage.setItem(char.name, char.id.toString());
    }
    req.resolve(char.id);
  });
};

export const schedule = (name: string) => {
  clearTimeout(timeoutRef);

  timeoutRef = setTimeout(() => {
    fetchIds(queue.splice(0, queue.length));
  }, 100);

  return new Promise<number>((resolve) => {
    queue.push({
      name,
      resolve,
    });
  });
};
