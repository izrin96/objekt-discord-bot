import { ofetch } from "ofetch";
import type { ObjektsOwnedFetch } from "../utils";

export async function fetchOwnedObjekts({ address, member, collection, season, artist, class: classOption, on_offline, start_after }: { address: string, member?: string, collection?: string, season?: string, artist?: string, class?: string, on_offline?: string, start_after?: number }) {
    const { objekts } = await ofetch<ObjektsOwnedFetch>(`https://api.cosmo.fans/objekt/v1/owned-by/${address}`, {
        query: {
            start_after,
            collection,
            sort: 'newest',
            member,
            season,
            artist,
            class: classOption,
            on_offline,
        },
    })
    return objekts
}