import { EmbedBuilder } from "discord.js";

export function sendErrorEmbed(message: string) {
    return new EmbedBuilder()
        .setColor('Red')
        .setDescription(message)
}

export type Transfer = {
    count: number
    transfer: {
        id: string
        from: string
        to: string
        timestamp: string
        tokenId: number
        objektId: string
        collectionId: string
    }
    serial: number
    collection: Objekt
    nickname: string
}

export type Profile = {
    nickname: string
    address: string
}

export type ProfileImage = {
    artistName: string
    image: {
        original: string
        thumbnail: string
    }
}

export type Objekt = {
    id: string
    contract: string
    createdAt: string
    slug: string
    collectionId: string
    season: string
    member: string
    artist: string
    collectionNo: string
    class: string
    thumbnailImage: string
    frontImage: string
    backImage: string
    backgroundColor: string
    textColor: string
    accentColor: string
    comoAmount: number
    onOffline: string
}

export type ObjektOwned = {
    collectionId: string
    season: string
    member: string
    collectionNo: string
    class: string
    artists: string[]
    thumbnailImage: string
    frontImage: string
    backImage: string
    accentColor: string
    backgroundColor: string
    textColor: string
    comoAmount: number
    transferableByDefault: boolean
    tokenId: string
    tokenAddress: string
    objektNo: number
    transferable: boolean
    status: string
    usedForGrid: boolean
    lenticularPairTokenId: string
    mintedAt: string
    receivedAt: string
}

export type ObjektsFetch = {
    total: number
    objekts: Objekt[]
}

export type ObjektsOwnedFetch = {
    total: number
    objekts: ObjektOwned[]
}

export type ObjektsMetadata = {
    copies: number
    metadata: {
        id: number
        collectionId: string
        description: string
        contributor: string
        profile: {
            id: number
            userAddress: string
            cosmoId: number
            nickname: string
            artist: string
            privacyNickname: boolean
            privacyObjekts: boolean
            privacyComo: boolean
            privacyTrades: boolean
            gridColumns: number
            objektEditor: boolean
        }
    }
}

export function getRarity(copies: number) {
    if (copies <= 10) {
        return "Impossible";
    }
    if (copies <= 25) {
        return "Extremely Rare";
    }
    if (copies <= 50) {
        return "Very Rare";
    }
    if (copies <= 100) {
        return "Rare";
    }
    if (copies <= 350) {
        return "Uncommon";
    }
    return "Common";
}

export const validClasses = [
    "First",
    "Special",
    "Double",
    "Premier",
    "Welcome",
    "Zero",
] as const;

export function getSlug(collectionId: string) {
    return collectionId.toLowerCase().replace(/ /g, '-');
}
