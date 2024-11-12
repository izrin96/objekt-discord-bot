import { ofetch } from "ofetch"
import { artists } from "./members"

export type Season = {
    artist: string
    title: string
    startDate: string
    endDate: string
    ongoing: boolean
}

async function fetchSeason(group: string) {
    console.log('fetching season', group)
    const result = await ofetch<{
        seasons: Season[]
        currentSeason: Season
    }>(`https://api.cosmo.fans/season/v2/${group}`)

    return result.seasons.map(a => a.title)
}

export const seasons = (await Promise.all(artists.map(a => fetchSeason(a.name)))).flat().reduce((acc, season) => {
    acc[season.toLowerCase().charAt(0)] = season;
    return acc;
}, {} as Record<string, string>);

export function getSeason(seasonCode: string) {
    const lowerCaseSeasonCode = seasonCode.toLowerCase();
    return seasons[lowerCaseSeasonCode];
}