'use client'

import { create } from 'zustand'
import type { SubscriptionTier } from '@/lib/pricing.config'

interface UpgradePromptState {
  isOpen: boolean
  currentTier: SubscriptionTier
  requiredTier?: SubscriptionTier
  feature?: string
  limitType?: 'projects' | 'exports'
  currentCount?: number
  limit?: number

  showPrompt: (params: {
    currentTier: SubscriptionTier
    requiredTier?: SubscriptionTier
    feature?: string
    limitType?: 'projects' | 'exports'
    currentCount?: number
    limit?: number
  }) => void

  hidePrompt: () => void
}

export const useUpgradePrompt = create<UpgradePromptState>((set) => ({
  isOpen: false,
  currentTier: 'free',

  showPrompt: (params) => set({
    isOpen: true,
    ...params
  }),

  hidePrompt: () => set({
    isOpen: false,
    requiredTier: undefined,
    feature: undefined,
    limitType: undefined,
    currentCount: undefined,
    limit: undefined
  }),
}))

/**
 * Helper function to show project limit prompt
 */
export function showProjectLimitPrompt(
  currentTier: SubscriptionTier,
  currentCount: number,
  limit: number
) {
  const { showPrompt } = useUpgradePrompt.getState()
  showPrompt({
    currentTier,
    requiredTier: currentTier === 'free' ? 'essentials' : 'premium',
    limitType: 'projects',
    currentCount,
    limit,
  })
}

/**
 * Helper function to show export limit prompt
 */
export function showExportLimitPrompt(
  currentTier: SubscriptionTier,
  currentCount: number,
  limit: number
) {
  const { showPrompt } = useUpgradePrompt.getState()
  showPrompt({
    currentTier,
    requiredTier: 'premium',
    limitType: 'exports',
    currentCount,
    limit,
  })
}

/**
 * Helper function to show feature locked prompt
 */
export function showFeatureLockedPrompt(
  currentTier: SubscriptionTier,
  feature: string,
  requiredTier: SubscriptionTier
) {
  const { showPrompt } = useUpgradePrompt.getState()
  showPrompt({
    currentTier,
    requiredTier,
    feature,
  })
}
