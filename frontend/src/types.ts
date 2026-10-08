export type ApplicationStatus =
  | 'New'
  | 'Contacted'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'
  | 'Needs Review';

export type ProcessingStatus = 'Pending' | 'Processed' | 'Failed' | 'Ignored';

export interface Application {
  id: number;
  application_id: string; // TOUR-000001
  email_message_id: string;
  email_thread_id?: string;
  email_received_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  tour_package?: string;
  travel_date?: string;
  number_of_travelers?: number;
  pickup_location?: string;
  additional_requirements?: string;
  original_email_subject: string;
  original_email_body: string;
  original_email_sender: string;
  original_email_reference?: string;
  extraction_confidence: number;
  uncertain_fields: string[];
  extraction_notes?: string;
  processing_status: ProcessingStatus;
  application_status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStats {
  total: number;
  new_count: number;
  contacted_count: number;
  confirmed_count: number;
  completed_count: number;
  cancelled_count: number;
  needs_review_count: number;
}

export interface SystemSettings {
  ai_provider: 'gemini' | 'openai' | 'heuristic';
  gemini_api_key?: string;
  gemini_api_key_masked?: string;
  openai_api_key?: string;
  openai_api_key_masked?: string;
  ai_model_name?: string;
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  confidence_threshold: number;
  gmail_connected: boolean;
  gmail_email?: string;
}

export interface User {
  username: string;
  name: string;
  role: string;
  email: string;
}
