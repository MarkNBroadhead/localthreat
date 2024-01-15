import React, { useEffect, memo, useCallback, useRef } from "react";
import { schedule as fetchId } from "lib/fetch-ids";
import { schedule as fetchAffiliation } from "lib/fetch-affiliation";
import { schedule as fetchName } from "lib/fetch-names";
import { schedule as fetchStats } from "lib/fetch-stats";
import { PlayerData } from "lib/types";
import { Entity } from "components/entity";
import style from "./style.module.css";

type Props = PlayerData & { update: (data: PlayerData) => void };

export const Row = memo((props: Props) => {
  const mountedRef = useRef(true);

  const {
    name,
    id,
    corpId,
    corpName,
    allyId,
    allyName,
    ships,
    dangerRatio,
    gangRatio,
    shipsDestroyed,
    shipsLost,
    update: _update,
  } = props;

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

  const update: Props["update"] = useCallback(
    (data) => {
      if (mountedRef.current) {
        _update(data);
      }
    },
    [_update]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  });

  /** Resolve a CCP ID to Character, Corporation, or Alliance name. */
  useEffect(() => {
    if (id) {
      return;
    }
    fetchId(name).then((id) => update({ name, id }));
  }, [name, id, update]);

  /** Get Capsuleer's Corporation and Alliance affiliations. */
  useEffect(() => {
    if (!id || corpId) {
      return;
    }
    let localStorageIsAvailable = isLocalStorageAvailable();
    if (localStorageIsAvailable) {
      let affiliation = localStorage.getItem(`affil-${id}`);
      if (!!affiliation) {
        let affil = JSON.parse(affiliation);
        update({ name, corpId: affil.corpId, allyId: affil.allyId, });
        return;
      }
    }
    fetchAffiliation(id).then((affiliation) => {
      const { corporation_id: corpId, alliance_id: allyId } = affiliation;
      update({ name, corpId, allyId, });
      if (localStorageIsAvailable) {
        localStorage.setItem("affil-" + name, JSON.stringify({corpId, allyId}));
      }
    });
  }, [name, id, corpId, update]);

  /** Resolve Corporation Name from ID. */
  useEffect(() => {
    if (!corpId || corpName) {
      return;
    }
    let localStorageIsAvailable = isLocalStorageAvailable();
    if (localStorageIsAvailable) {
      let corpName = localStorage.getItem(`${corpId}`);
      if (!!corpName) {
        update({ name, corpName });
        return;
      }
    }
    fetchName(corpId).then((corpName) => {
      update({ name, corpName });
    });
  }, [name, corpId, corpName, update]);

  /** Resolve Alliance Name from ID */
  useEffect(() => {
    if (!allyId || allyName) {
      return;
    }
    let localStorageIsAvailable = isLocalStorageAvailable();
    if (localStorageIsAvailable) {
      let allianceName = localStorage.getItem(`${allyId}`);
      if (!!allianceName) {
        update({ name, allyName: allianceName });
        return;
      }
    }
    fetchName(allyId).then((allyName) => {
      update({ name, allyName });
    });
  }, [name, allyId, allyName, update]);

  /** Get stats for Capsuleer. */
  useEffect(() => {
    if (!id || dangerRatio) {
      return;
    }
    let localStorageIsAvailable = isLocalStorageAvailable();
    if (localStorageIsAvailable) {
      let stats = localStorage.getItem(`stats-${id}`)
      if (!!stats){
        update({
          name,
          ...(JSON.parse(stats)),
        });
        return;
      }
    }
    fetchStats(id).then((stats) => {
      update({
        name,
        ...stats,
      });
      if (localStorageIsAvailable) {
        localStorage.setItem(`stats-${id}`, JSON.stringify(stats));
      }
    });
  }, [name, id, dangerRatio, update]);

  if (!id) {
    return null;
  }

  return (
    <tr>
      <td>
        <Entity type="char" name={name} ids={[id]} />
      </td>
      <td>
        <Entity type="corp" name={corpName} ids={[corpId]} />
      </td>
      <td>
        <Entity type="ally" name={allyName} ids={[allyId]} />
      </td>
      <td>
        <div className={style.ships}>
          {ships?.map((ship) => (
            <Entity
              key={ship.id}
              type="ship"
              ids={[ship.id, id]}
              name={ship.name}
              truncate
            />
          ))}
        </div>
      </td>
      <td>{dangerRatio}</td>
      <td>{gangRatio}</td>
      <td>{shipsDestroyed}</td>
      <td>{shipsLost}</td>
    </tr>
  );
});
