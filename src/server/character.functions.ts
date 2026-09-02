import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export type CharacterLookupResult = {
  characterName: string
  level: number
  jobName: string
  rank: number
  worldID: number
  imageUrl: string
}

const RankingResponseSchema = z.object({
  totalCount: z.number(),
  ranks: z.array(
    z.object({
      characterName: z.string(),
      level: z.number(),
      jobName: z.string(),
      rank: z.number(),
      worldID: z.number(),
      characterImgURL: z.string(),
    }),
  ),
})

// Undocumented endpoint behind Nexon's own public GMS rankings page
// (https://www.nexon.com/maplestory/rankings/north-america). No official
// GMS API exists yet, so this is the closest first-party data source.
export const lookupCharacter = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ name: z.string().trim().min(1).max(20) }))
  .handler(async ({ data }): Promise<CharacterLookupResult | null> => {
    const url = new URL('https://www.nexon.com/api/maplestory/no-auth/ranking/v2/na')
    url.searchParams.set('type', 'overall')
    url.searchParams.set('id', 'weekly')
    url.searchParams.set('character_name', data.name)
    url.searchParams.set('page_index', '1')

    const response = await fetch(url, {
      headers: { accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error('角色查询暂时不可用，请稍后再试')
    }

    const parsed = RankingResponseSchema.parse(await response.json())
    const entry = parsed.ranks[0]
    if (!entry) return null

    return {
      characterName: entry.characterName,
      level: entry.level,
      jobName: entry.jobName,
      rank: entry.rank,
      worldID: entry.worldID,
      imageUrl: entry.characterImgURL,
    }
  })
