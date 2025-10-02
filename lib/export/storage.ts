// Supabase Storage Integration for Exports

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ExportMetadata } from './types'

export interface StorageUploadResult {
  success: boolean
  path?: string
  url?: string
  error?: string
  size?: number
}

export interface ExportRecord {
  id: string
  sessionId: string
  userId: string
  filename: string
  path: string
  url: string
  size: number
  metadata: ExportMetadata
  version: string
  createdAt: Date
  expiresAt?: Date
}

export class ExportStorage {
  private bucketName = 'exports'
  
  // Upload export to Supabase Storage
  async uploadExport(
    buffer: Buffer,
    sessionId: string,
    userId: string,
    metadata: ExportMetadata
  ): Promise<StorageUploadResult> {
    try {
      const supabase = createSupabaseServerClient()
      
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${metadata.businessName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.zip`
      const path = `${userId}/${sessionId}/${filename}`
      
      // Ensure bucket exists
      await this.ensureBucketExists()
      
      // Upload file to storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, buffer, {
          contentType: 'application/zip',
          upsert: true,
          cacheControl: '3600'
        })
      
      if (error) {
        console.error('Storage upload error:', error)
        return {
          success: false,
          error: error.message
        }
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path)
      
      // Store export record in database
      const exportRecord = await this.saveExportRecord({
        sessionId,
        userId,
        filename,
        path,
        url: urlData.publicUrl,
        size: buffer.length,
        metadata,
        version: metadata.version
      })
      
      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl,
        size: buffer.length
      }
    } catch (error: any) {
      console.error('Export upload failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // Get signed URL for temporary access
  async getSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<{ url?: string; error?: string }> {
    try {
      const supabase = createSupabaseServerClient()
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(path, expiresIn)
      
      if (error) {
        return { error: error.message }
      }
      
      return { url: data.signedUrl }
    } catch (error: any) {
      return { error: error.message }
    }
  }
  
  // Download export file
  async downloadExport(path: string): Promise<{ data?: Buffer; error?: string }> {
    try {
      const supabase = createSupabaseServerClient()
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(path)
      
      if (error) {
        return { error: error.message }
      }
      
      // Convert blob to buffer
      const buffer = Buffer.from(await data.arrayBuffer())
      return { data: buffer }
    } catch (error: any) {
      return { error: error.message }
    }
  }
  
  // Delete export file
  async deleteExport(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createSupabaseServerClient()
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path])
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      // Remove database record
      await this.deleteExportRecord(path)
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // List exports for a user
  async listUserExports(userId: string): Promise<ExportRecord[]> {
    try {
      const supabase = createSupabaseServerClient()
      
      const { data, error } = await supabase
        .from('exports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching exports:', error)
        return []
      }
      
      return data.map(record => ({
        id: record.id,
        sessionId: record.session_id,
        userId: record.user_id,
        filename: record.filename,
        path: record.path,
        url: record.url,
        size: record.size,
        metadata: record.metadata,
        version: record.version,
        createdAt: new Date(record.created_at),
        expiresAt: record.expires_at ? new Date(record.expires_at) : undefined
      }))
    } catch (error) {
      console.error('Error listing exports:', error)
      return []
    }
  }
  
  // Get export by session ID
  async getSessionExport(sessionId: string): Promise<ExportRecord | null> {
    try {
      const supabase = createSupabaseServerClient()
      
      const { data, error } = await supabase
        .from('exports')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error || !data) {
        return null
      }
      
      return {
        id: data.id,
        sessionId: data.session_id,
        userId: data.user_id,
        filename: data.filename,
        path: data.path,
        url: data.url,
        size: data.size,
        metadata: data.metadata,
        version: data.version,
        createdAt: new Date(data.created_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined
      }
    } catch (error) {
      console.error('Error fetching session export:', error)
      return null
    }
  }
  
  // Private methods
  
  private async ensureBucketExists(): Promise<void> {
    const supabase = createSupabaseServerClient()
    
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    
    const bucketExists = buckets?.some(b => b.name === this.bucketName)
    
    if (!bucketExists) {
      // Create bucket with public access for exports
      await supabase.storage.createBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: ['application/zip', 'application/json'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
      })
    }
  }
  
  private async saveExportRecord(data: {
    sessionId: string
    userId: string
    filename: string
    path: string
    url: string
    size: number
    metadata: ExportMetadata
    version: string
  }): Promise<void> {
    try {
      const supabase = createSupabaseServerClient()
      
      await supabase
        .from('exports')
        .upsert({
          session_id: data.sessionId,
          user_id: data.userId,
          filename: data.filename,
          path: data.path,
          url: data.url,
          size: data.size,
          metadata: data.metadata,
          version: data.version,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
    } catch (error) {
      console.error('Error saving export record:', error)
    }
  }
  
  private async deleteExportRecord(path: string): Promise<void> {
    try {
      const supabase = createSupabaseServerClient()
      
      await supabase
        .from('exports')
        .delete()
        .eq('path', path)
    } catch (error) {
      console.error('Error deleting export record:', error)
    }
  }
  
  // Cleanup expired exports
  async cleanupExpiredExports(): Promise<number> {
    try {
      const supabase = createSupabaseServerClient()
      
      // Find expired exports
      const { data: expired } = await supabase
        .from('exports')
        .select('path')
        .lt('expires_at', new Date().toISOString())
      
      if (!expired || expired.length === 0) {
        return 0
      }
      
      // Delete files from storage
      const paths = expired.map(e => e.path)
      await supabase.storage
        .from(this.bucketName)
        .remove(paths)
      
      // Delete database records
      await supabase
        .from('exports')
        .delete()
        .lt('expires_at', new Date().toISOString())
      
      return paths.length
    } catch (error) {
      console.error('Error cleaning up exports:', error)
      return 0
    }
  }
  
  // Get storage usage for a user
  async getUserStorageUsage(userId: string): Promise<{
    totalSize: number
    fileCount: number
    oldestExport?: Date
    newestExport?: Date
  }> {
    try {
      const supabase = createSupabaseServerClient()
      
      const { data } = await supabase
        .from('exports')
        .select('size, created_at')
        .eq('user_id', userId)
      
      if (!data || data.length === 0) {
        return { totalSize: 0, fileCount: 0 }
      }
      
      const totalSize = data.reduce((sum, item) => sum + item.size, 0)
      const dates = data.map(d => new Date(d.created_at))
      
      return {
        totalSize,
        fileCount: data.length,
        oldestExport: new Date(Math.min(...dates.map(d => d.getTime()))),
        newestExport: new Date(Math.max(...dates.map(d => d.getTime())))
      }
    } catch (error) {
      console.error('Error calculating storage usage:', error)
      return { totalSize: 0, fileCount: 0 }
    }
  }
}