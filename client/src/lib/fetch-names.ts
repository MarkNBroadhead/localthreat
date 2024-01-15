const { setTimeout } = window;

type Request = {
  id: number;
  resolve: (name: string) => void;
};

type Response = {
  name: string;
  id: number;
}[];
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

/**
 * Resolve a set of IDs to names and categories.
 * @see https://esi.evetech.net/ui/#/Universe/post_universe_names
 * 
 * @param reqs Number array of IDs to resolve.
 */
const fetchNames = async (reqs: Request[]) => {
  let localStorageAvailable = isLocalStorageAvailable();
  let found = new Set();
  if (localStorageAvailable) {
    for (let req of reqs) {
      let item = localStorage.getItem(req.id.toString());
      if (!!item) {
        // console.log(`Found name for id ${req.id}, ${item} in local storage.`)
        found.add(req.id.toString());
        req.resolve(item);
      } else {
        // console.log(`No name found for id ${req.id} in local storage`);
      }
    }
  }
  if (found.size >= reqs.length) {
    // All ids found in cache, not calling ESI.
    return;
  }
  const resp = await fetch(`https://esi.evetech.net/latest/universe/names/`, {
    method: "post",
    body: JSON.stringify(Array.from(new Set(reqs.map((req) => req.id)))),
  });
  if (!resp.ok) {
    throw Error(resp.statusText);
  }
  const data = (await resp.json()) as Response;
  reqs?.forEach((req) => {
    const thing = data.find(({ id }) => id === req.id);
    if (!thing) {
      console.warn(`fetchNames: couldn't find response for id "${req.id}"`);
      return;
    }
    if (localStorageAvailable) {
      localStorage.setItem(thing.id.toString(), thing.name);
      localStorage.setItem(thing.name, thing.id.toString());
    }
    req.resolve(thing.name);
  });
};

export const schedule = (id: number) => {
  clearTimeout(timeoutRef);

  timeoutRef = setTimeout(() => {
    fetchNames(queue.splice(0, queue.length));
  }, 100);

  return new Promise<string>((resolve) => {
    queue.push({
      id,
      resolve,
    });
  });
};
