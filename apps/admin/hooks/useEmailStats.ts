'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface EmailStats {
  totalSubscribers: number
  totalCampaignsSent: number
  openRate: number
}

export function useEmailStats() {
  return useQuery<EmailStats>({
    queryKey: ['emailStats'],
    queryFn: async () => {
      const [subsRes, campaignsRes] = await Promise.all([
        api.get('/api/subscribers?limit=1'),
        api.get('/api/campaigns?status=SENT&limit=1'),
      ])

      const totalSubscribers = subsRes.data.data.total ?? 0
      const totalCampaignsSent = campaignsRes.data.data.total ?? 0

      // Calculate open rate from recent campaigns
      let openRate = 0
      if (totalCampaignsSent > 0) {
        try {
          const recentRes = await api.get('/api/campaigns?status=SENT&limit=10')
          const campaigns = recentRes.data.data.campaigns ?? []
          let totalSent = 0
          let totalOpened = 0
          for (const c of campaigns) {
            if (c.sentCount > 0) {
              totalSent += c.sentCount
              // Fetch individual campaign stats
              const detail = await api.get(`/api/campaigns/${c.id}`)
              totalOpened += detail.data.data._stats?.opened ?? 0
            }
          }
          openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
        } catch {
          openRate = 0
        }
      }

      return { totalSubscribers, totalCampaignsSent, openRate }
    },
  })
}
