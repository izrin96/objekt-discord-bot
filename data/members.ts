import { ofetch } from "ofetch"

export type Artist = {
    name: string
    title: string
    fandomName: string
    logoImageUrl: string
}

export type Member = {
    artist: string
    name: string
    units: string[]
    alias: string
    profileImageUrl: string
    mainObjektImageUrl: string
    order: number
}

async function fetchArtist() {
    console.log('fetching artist')
    const result = await ofetch<{
        artists: Artist[]
    }>(`https://api.cosmo.fans/artist/v1`)

    return result.artists
}

async function fetchMembers(group: string) {
    console.log('fetching members', group)
    const result = await ofetch<{
        artist: Artist & {
            members: Member[]
        }
    }>(`https://api.cosmo.fans/artist/v1/${group}`)

    return result.artist
}

export const artists = await fetchArtist()

const shortformMembers: Record<string, string> = {
    'naky': 'NaKyoung',
    'tone': 'Kotone',
    'sulin': 'Sullin',
    'choery': 'Choerry',
    'sy': 'SeoYeon',
    'yy': 'YooYeon',
    'jb': 'JooBin',
    'dh': 'DaHyun',
    'kd': 'Kaede',
    'hr': 'HyeRin',
    'jw': 'JiWoo',
    'cy': 'ChaeYeon',
    'sm': 'SooMin',
    'nk': 'NaKyoung',
    'yb': 'YuBin',
    'k': 'Kaede',
    'yj': 'YeonJi',
    'n': 'Nien',
    'sh': 'SoHyun',
    'x': 'Xinyu',
    'm': 'Mayu',
    'l': 'Lynn',
    'hy': 'HaYeon',
    'so': 'ShiOn',
    'cw': 'ChaeWon',
    's': 'Sullin',
    'sa': 'SeoAh',
    'jy': 'JiYeon',
    'hj': 'HeeJin',
    'hs': 'HaSeul',
    'kl': 'KimLip',
    'js': 'JinSoul',
    'c': 'Choerry',
    'triples': 'tripleS',
    'kre': '+(KR)E',
    'aaa': 'AAA',
    'tokyohaus': 'TokyoHaus'
}

export const members = (await Promise.all(artists.map(async (artist) => {
    const { members } = await fetchMembers(artist.name);
    return members
}))).flat()

export function getMember(member: string) {
    const lowerCaseMember = member?.toLowerCase();
    const shortformMember = shortformMembers[lowerCaseMember]
    if (shortformMember) {
        return members.find(m => m.name === shortformMember);
    }
    return members.find(m => m.name.toLowerCase() === lowerCaseMember) ?? {} as Member;
}

export function getArtist(artist: string) {
    const lowerCaseArtist = artist?.toLowerCase();
    return artists.find(a => a.name.toLowerCase() === lowerCaseArtist) ?? {} as Artist;
}
