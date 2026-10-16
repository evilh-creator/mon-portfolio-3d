import Dexie, { type EntityTable, type Table } from "dexie";
import type { ActionDefinition, ActionId, DictionaryVersion } from "../domain/action";
import { DICTIONNAIRE_V2 } from "../domain/action";
import type { DictionaryRecord } from "../domain/dictionary";
import { DICTIONARIES } from "../domain/dictionary";
import type { Event, Match, MatchPlayer, Player } from "../domain/match";

export class HandballStatsDb extends Dexie {
  dictionaries!: EntityTable<DictionaryRecord, "version">;
  /** Clé primaire composée [dictionary_version+action_id] : un même action_id peut être redéfini d'une version à l'autre. */
  actions!: Table<ActionDefinition, [DictionaryVersion, ActionId]>;
  players!: EntityTable<Player, "player_id">;
  matches!: EntityTable<Match, "match_id">;
  /** Clé primaire composée [match_id+player_id]. */
  match_players!: Table<MatchPlayer, [string, string]>;
  events!: EntityTable<Event, "event_id">;

  constructor() {
    super("handball-stats-evdrlhb");

    this.version(1).stores({
      dictionaries: "version",
      actions: "[dictionary_version+action_id], dictionary_version, [dictionary_version+lettre], actif",
      players: "player_id, equipe",
      matches: "match_id, date, equipe, statut, dictionary_version",
      match_players: "[match_id+player_id], match_id, [match_id+numero]",
      events: "event_id, match_id, [match_id+ordre], action_id, annule",
    });

    this.on("populate", () => this.seedDictionnaireV2());
    this.on("ready", () => this.synchroniserDictionnaireV2());
  }

  private async seedDictionnaireV2() {
    await this.dictionaries.bulkAdd(DICTIONARIES as DictionaryRecord[]);
    await this.actions.bulkAdd(DICTIONNAIRE_V2 as ActionDefinition[]);
  }

  /**
   * `on("populate")` ne s'exécute qu'à la toute première création de la base : une action
   * ajoutée au dictionnaire après coup (ex. `carton_bleu`) ne serait donc jamais écrite sur une
   * installation déjà initialisée. `on("ready")` s'exécute à chaque ouverture de la base : on en
   * profite pour réécrire (upsert) le dictionnaire courant en entier, ce qui rattrape aussi bien
   * les nouvelles actions que les modifications de libellé/couleur d'actions existantes.
   */
  private async synchroniserDictionnaireV2() {
    await this.actions.bulkPut(DICTIONNAIRE_V2 as ActionDefinition[]);
  }
}

export const db = new HandballStatsDb();
