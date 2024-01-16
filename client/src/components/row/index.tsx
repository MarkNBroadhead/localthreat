import React, { useEffect, memo, useCallback, useRef } from "react";
import { schedule as fetchId } from "lib/fetch-ids";
import { schedule as fetchAffiliation } from "lib/fetch-affiliation";
import { schedule as fetchName } from "lib/fetch-names";
import { schedule as fetchStats } from "lib/fetch-stats";
import { PlayerData } from "lib/types";
import { Entity } from "components/entity";
import style from "./style.module.css";
import { ApiCache } from "lib/cache";

type Props = PlayerData & { update: (data: PlayerData) => void };

let cache = new ApiCache();

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
    let cachedId = cache.get(name);
    if (!!cachedId) {
      update({name, id: parseInt(cachedId)});
      return;
    }
    fetchId(name).then((id) => {
      update({ name, id });
      cache.set(name, id.toString());
    });
  }, [name, id, update]);

  /** Get Capsuleer's Corporation and Alliance affiliations. */
  useEffect(() => {
    if (!id || corpId) {
      return;
    }
    let cachedAffiliation = cache.get(`affil-${name}`);
    if (!!cachedAffiliation) {
      let affil = JSON.parse(cachedAffiliation);
      update({ name, corpId: affil.corpId, allyId: affil.allyId, });
      return;
    }
    fetchAffiliation(id).then((affiliation) => {
      const { corporation_id: corpId, alliance_id: allyId } = affiliation;
      update({ name, corpId, allyId, });
      cache.set("affil-" + name, JSON.stringify({corpId, allyId}));
    });
  }, [name, id, corpId, update]);

  /** Resolve Corporation Name from ID. */
  useEffect(() => {
    if (!corpId || corpName) {
      return;
    }
    let cachedCorpName = cache.get(`corp-${corpId.toString()}`);
    if (!!cachedCorpName) {
      update({ name, corpName: cachedCorpName });
      return;
    }
    fetchName(corpId).then((corpName) => {
      update({ name, corpName });
      cache.set(`corp-${corpId.toString()}`, corpName);
    });
  }, [name, corpId, corpName, update]);

  /** Resolve Alliance Name from ID */
  useEffect(() => {
    if (!allyId || allyName) {
      return;
    }
    let cachedAllianceName = cache.get(`ally-${allyId.toString()}`);
    if (!!cachedAllianceName) {
      update({ name, allyName: cachedAllianceName });
      return;
    }
    fetchName(allyId).then((allyName) => {
      update({ name, allyName });
      cache.set(`ally-${allyId.toString()}`, allyName);
    });
  }, [name, allyId, allyName, update]);

  /** Get stats for Capsuleer. */
  useEffect(() => {
    if (!id || dangerRatio) {
      return;
    }
    let cachedStats = cache.get(`stats-${id}`);
    if (!!cachedStats){
      update({
        name,
        ...JSON.parse(cachedStats),
      });
      return;
    }
    fetchStats(id).then((stats) => {
      update({
        name,
        ...stats,
      });
      cache.set(`stats-${id}`, JSON.stringify(stats));
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
