const { setInterval } = window;

type Request = {
  id: number;
  resolve: (stats: Stats) => void;
};

type Stats = {
  dangerRatio: number;
  gangRatio: number;
  shipsLost: number;
  shipsDestroyed: number;
  ships: {
    id: number;
    name: string;
  }[];
};

const queue: Request[] = [];

setInterval(async () => {
  const req = queue.shift();
  if (!req) {
    return;
  }
  await fetch(
    `https://zkillboard.com/api/stats/characterID/${req.id}/`,
    {
      headers: {
        origin: window.location.hostname,
      },
    }
  )
  .then(async (resp) => {
    if (!resp.ok) {
      throw Error(`Bad status ${resp.status}`);
    }
    return resp.json();
  }).then(resp => {
    const {
      dangerRatio,
      gangRatio,
      shipsDestroyed,
      shipsLost,
      topLists,
    } = resp;
    const ships = topLists
      .find(({ type }: { type: string }) => type === "shipType")?.values
      .map(({ id, name }: { id: number; name: string }) => ({ id, name, }));
    req.resolve({ dangerRatio, gangRatio, shipsDestroyed, shipsLost, ships });
  })
  .catch(() => {
    console.warn("Fetch failed, back to the end of the queue");
    queue.push(req);
    return;
  });
}, 1000);

export const schedule = (id: number) => {
  return new Promise<Stats>((resolve) => {
    queue.push({
      id,
      resolve,
    });
  });
};

export const clear = () => {
  queue.splice(0, queue.length);
};
