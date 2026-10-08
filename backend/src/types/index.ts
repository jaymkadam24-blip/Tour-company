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
  application_id: string; // e.g. TOUR-000001
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
  extraction_confidence: number; // 0.0 to 1.0
  uncertain_fields?: string; // JSON array of string field names
  extraction_notes?: string;
  processing_status: ProcessingStatus;
  application_status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface ExtractedEmailData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  tour_package?: string;
  travel_date?: string;
  number_of_travelers?: number;
  pickup_location?: string;
  additional_requirements?: string;
  extraction_confidence: number;
  uncertain_fields: string[];
  extraction_notes: string;
  is_relevant_tour_inquiry: boolean;
}

export interface EmailMessage {
  message_id: string;
  thread_id?: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  received_at: string;
  reference_link?: string;
}

export interface SystemSettings {
  ai_provider: 'gemini' | 'openai' | 'heuristic';
  gemini_api_key?: string;
  openai_api_key?: string;
  ai_model_name?: string;
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  confidence_threshold: number; // below this auto-set to Needs Review
  gmail_connected: boolean;
  gmail_email?: string;
}
