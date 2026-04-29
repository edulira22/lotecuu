export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VehicleStatus = 'published' | 'hidden' | 'draft' | 'sold' | 'reserved'
export type EventType = 'view' | 'whatsapp_click' | 'share_click'

export type Database = {
  public: {
    Tables: {
      sellers: {
        Row: {
          id: string
          name: string
          business_name: string | null
          slug: string
          whatsapp: string
          phone: string | null
          logo_url: string | null
          profile_photo_url: string | null
          description: string | null
          address: string | null
          google_maps_url: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          business_name?: string | null
          slug: string
          whatsapp: string
          phone?: string | null
          logo_url?: string | null
          profile_photo_url?: string | null
          description?: string | null
          address?: string | null
          google_maps_url?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_name?: string | null
          slug?: string
          whatsapp?: string
          phone?: string | null
          logo_url?: string | null
          profile_photo_url?: string | null
          description?: string | null
          address?: string | null
          google_maps_url?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          id: string
          seller_id: string
          slug: string
          title: string
          brand: string | null
          model: string | null
          version: string | null
          year: number | null
          price: number | null
          mileage: number | null
          transmission: string | null
          fuel: string | null
          body_type: string | null
          color: string | null
          condition: string | null
          legal_status: string | null
          plates_state: string | null
          debt_status: string | null
          negotiable: boolean | null
          accepts_trade: boolean | null
          financing: boolean | null
          description: string | null
          status: VehicleStatus
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          slug: string
          title: string
          brand?: string | null
          model?: string | null
          version?: string | null
          year?: number | null
          price?: number | null
          mileage?: number | null
          transmission?: string | null
          fuel?: string | null
          body_type?: string | null
          color?: string | null
          condition?: string | null
          legal_status?: string | null
          plates_state?: string | null
          debt_status?: string | null
          negotiable?: boolean | null
          accepts_trade?: boolean | null
          financing?: boolean | null
          description?: string | null
          status?: VehicleStatus
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          slug?: string
          title?: string
          brand?: string | null
          model?: string | null
          version?: string | null
          year?: number | null
          price?: number | null
          mileage?: number | null
          transmission?: string | null
          fuel?: string | null
          body_type?: string | null
          color?: string | null
          condition?: string | null
          legal_status?: string | null
          plates_state?: string | null
          debt_status?: string | null
          negotiable?: boolean | null
          accepts_trade?: boolean | null
          financing?: boolean | null
          description?: string | null
          status?: VehicleStatus
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vehicles_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'sellers'
            referencedColumns: ['id']
          },
        ]
      }
      vehicle_photos: {
        Row: {
          id: string
          vehicle_id: string
          url: string
          storage_path: string
          sort_order: number
          is_cover: boolean
          alt_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          url: string
          storage_path: string
          sort_order?: number
          is_cover?: boolean
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          url?: string
          storage_path?: string
          sort_order?: number
          is_cover?: boolean
          alt_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_photos_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      vehicle_events: {
        Row: {
          id: string
          vehicle_id: string
          seller_id: string | null
          event_type: EventType
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          seller_id?: string | null
          event_type: EventType
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          seller_id?: string | null
          event_type?: EventType
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/* Convenience row types */
export type Seller = Database['public']['Tables']['sellers']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehiclePhoto = Database['public']['Tables']['vehicle_photos']['Row']
export type VehicleEvent = Database['public']['Tables']['vehicle_events']['Row']

export type VehicleWithSeller = Vehicle & {
  seller: Seller
  cover_photo: VehiclePhoto | null
  photos?: VehiclePhoto[]
}
