import { ofetch } from "ofetch";
import type { Objekt, ObjektsFetch } from "../utils";

export async function getObjekts({ collection, member, artist, class: classOption, on_offline, page }: { collection?: { season: string, number: string, type: string }, member: string, artist?: string, class?: string, on_offline?: string, page?: number }) {
    const { season, number, type } = collection || {};

    let result: Objekt[] = [];

    if (number) {
        const types = type ? [type.toUpperCase()] : ['Z', 'A'];
        result = (await Promise.all(
            types.map(t => fetchObjekts({
                collectionNo: `${number}${t}`,
                member,
                season,
                artist,
                class: classOption,
                on_offline,
                page
            }))
        )).flat();
    } else {
        result = await fetchObjekts({ member, season, artist, class: classOption, page });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function fetchObjekts({ member, collectionNo, season, artist, class: classOption, on_offline, page }: { member?: string, collectionNo?: string, season?: string, artist?: string, class?: string, on_offline?: string, page?: number }) {
    const { objekts } = await ofetch<ObjektsFetch>(`https://apollo.cafe/api/objekts`, {
        query: {
            collectionNo,
            sort: 'newest',
            member,
            season,
            artist,
            class: classOption,
            on_offline,
            page,
        },
    })
    return objekts
}