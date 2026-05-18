import { useState } from 'react'

export function useCollaboration(sceneId: string) {
  const [activeUsers] = useState<any[]>([])

  const broadcastCursor = (pt: any) => {
    // sceneId and pt will be utilized in Phase 5 for presence channels
    console.log('Collaboration scene:', sceneId, 'cursor point:', pt)
  }

  return { activeUsers, broadcastCursor }
}
