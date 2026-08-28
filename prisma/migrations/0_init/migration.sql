-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'TEACHER', 'TUTOR');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'TARDY', 'EXCUSED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('OPEN_MASSIVE', 'SLOT_BOOKING');

-- CreateEnum
CREATE TYPE "EventTargetScope" AS ENUM ('ALL_SCHOOL', 'ENVIRONMENTS', 'STUDENTS', 'EXTERNAL_GUESTS');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'DECLINED', 'ATTENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'IN_ADMISSION', 'ENROLLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT DEFAULT '',
    "country" TEXT DEFAULT '',
    "province" TEXT DEFAULT '',
    "city" TEXT DEFAULT '',
    "address" TEXT DEFAULT '',
    "map_lat" DOUBLE PRECISION,
    "map_lng" DOUBLE PRECISION,
    "logo_url" TEXT DEFAULT '',
    "primary_color" TEXT DEFAULT '#1b3b2b',
    "accent_color" TEXT DEFAULT '#c86d51',
    "phone" TEXT DEFAULT '',
    "email" TEXT DEFAULT '',
    "currency" TEXT DEFAULT 'MXN',
    "currency_symbol" TEXT DEFAULT '$',
    "timezone" TEXT DEFAULT 'America/Mexico_City',
    "locale" TEXT DEFAULT 'es-MX',
    "features" JSONB DEFAULT '{}',
    "consent_templates" TEXT DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT DEFAULT '',
    "description" TEXT DEFAULT '',
    "cover_image" TEXT DEFAULT '',
    "min_age_years" DOUBLE PRECISION,
    "max_age_years" DOUBLE PRECISION,
    "capacity" INTEGER DEFAULT 25,
    "color" TEXT DEFAULT '#1b3b2b',
    "start_time" TEXT DEFAULT '08:00',
    "end_time" TEXT DEFAULT '13:30',
    "schedule_days" TEXT DEFAULT '["Lunes","Martes","Miércoles","Jueves","Viernes"]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment_guides" (
    "id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_lead" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environment_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT DEFAULT '',
    "avatar_url" TEXT DEFAULT '',
    "phone" TEXT DEFAULT '',
    "job_title" TEXT DEFAULT '',
    "staff_role" TEXT DEFAULT 'LEAD_GUIDE',
    "certifications" TEXT DEFAULT '',
    "practice_start_year" INTEGER,
    "years_of_experience" INTEGER DEFAULT 0,
    "bio" TEXT DEFAULT '',
    "supervisor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "environment_id" TEXT,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT DEFAULT '',
    "gender" TEXT DEFAULT '',
    "date_of_birth" TIMESTAMP(3),
    "national_id" TEXT DEFAULT '',
    "id_document_url" TEXT DEFAULT '',
    "grade" TEXT DEFAULT '',
    "enrollment_code" TEXT DEFAULT '',
    "enrollment_date" TIMESTAMP(3),
    "previous_school" TEXT DEFAULT '',
    "previous_methodology" TEXT DEFAULT '',
    "blood_type" TEXT DEFAULT '',
    "allergies" TEXT DEFAULT '',
    "food_allergies" TEXT DEFAULT '[]',
    "dietary_restrictions" TEXT DEFAULT '',
    "medical_notes" TEXT DEFAULT '',
    "internal_notes" TEXT DEFAULT '',
    "authorized_contacts" TEXT DEFAULT '[]',
    "consents" TEXT DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_tutors" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tutor_user_id" TEXT NOT NULL,
    "relationship" "Relationship" NOT NULL DEFAULT 'GUARDIAN',
    "is_primary_contact" BOOLEAN NOT NULL DEFAULT false,
    "authorized_pick_up" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_tutors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "title_en" TEXT DEFAULT '',
    "description_en" TEXT DEFAULT '',
    "access_type" TEXT NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "title_en" TEXT DEFAULT '',
    "description_en" TEXT DEFAULT '',
    "access_type" TEXT NOT NULL DEFAULT 'public',
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "title_en" TEXT DEFAULT '',
    "description_en" TEXT DEFAULT '',
    "icon_url" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_links" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "label_en" TEXT DEFAULT '',
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_categories" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "label_en" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_en" TEXT DEFAULT '',
    "description" TEXT DEFAULT '',
    "description_en" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_access_code" (
    "id" SERIAL NOT NULL,
    "school_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_access_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "montessori_areas" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'BookOpen',
    "color" TEXT DEFAULT '#1b3b2b',
    "description" TEXT DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "montessori_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "montessori_categories" (
    "id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "montessori_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "montessori_lessons" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "pedagogical_purpose" TEXT DEFAULT '',
    "parent_info" TEXT DEFAULT '',
    "media_assets" TEXT DEFAULT '[]',
    "min_age_years" DOUBLE PRECISION,
    "max_age_years" DOUBLE PRECISION,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "montessori_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_categories" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "slug" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'Activity',
    "color" TEXT DEFAULT '#1b3b2b',
    "description" TEXT DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_subcategories" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT DEFAULT '',
    "fields" TEXT DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_items" (
    "id" TEXT NOT NULL,
    "subcategory_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT DEFAULT '',
    "icon" TEXT DEFAULT 'Sparkles',
    "color" TEXT DEFAULT '#1b3b2b',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_lesson_progress" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "guide_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRESENTED',
    "presented_at" TIMESTAMP(3),
    "mastered_at" TIMESTAMP(3),
    "notes" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_observations" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "guide_user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "photo_url" TEXT DEFAULT '',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_attendances" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_categories" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1b3b2b',
    "icon" TEXT NOT NULL DEFAULT 'Calendar',
    "description" TEXT DEFAULT '',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_events" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "location" TEXT DEFAULT '',
    "cover_image" TEXT DEFAULT '',
    "event_type" "EventType" NOT NULL DEFAULT 'OPEN_MASSIVE',
    "target_scope" "EventTargetScope" NOT NULL DEFAULT 'ALL_SCHOOL',
    "status" "EventStatus" NOT NULL DEFAULT 'PUBLISHED',
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "start_date_time" TIMESTAMP(3) NOT NULL,
    "end_date_time" TIMESTAMP(3) NOT NULL,
    "slot_duration_minutes" INTEGER DEFAULT 45,
    "max_bookings_per_slot" INTEGER DEFAULT 1,
    "summary_notes" TEXT DEFAULT '',
    "photo_urls" JSONB DEFAULT '[]',
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_hosts" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_title" TEXT DEFAULT 'Anfitrión / Coordinador',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_volunteers" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "tutor_user_id" TEXT NOT NULL,
    "role_description" TEXT DEFAULT 'Tutor Voluntario',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_target_environments" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_target_environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_target_students" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_target_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_slots" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT DEFAULT '',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "max_capacity" INTEGER NOT NULL DEFAULT 1,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_bookings" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "slot_id" TEXT,
    "student_id" TEXT,
    "tutor_user_id" TEXT,
    "guest_name" TEXT DEFAULT '',
    "guest_email" TEXT DEFAULT '',
    "guest_phone" TEXT DEFAULT '',
    "guests_count" INTEGER NOT NULL DEFAULT 1,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_conference_reports" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "guide_user_id" TEXT,
    "term_name" TEXT NOT NULL,
    "conference_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "executive_summary" TEXT NOT NULL DEFAULT '',
    "strengths" TEXT NOT NULL DEFAULT '',
    "challenges" TEXT NOT NULL DEFAULT '',
    "recommendations_home" TEXT NOT NULL DEFAULT '',
    "agreements" TEXT NOT NULL DEFAULT '',
    "mastery_snapshot" JSONB DEFAULT '{}',
    "audio_recording_url" TEXT DEFAULT '',
    "audio_transcription" TEXT DEFAULT '',
    "attachments" JSONB DEFAULT '[]',
    "attendees" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_conference_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_characterizations" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "author_user_id" TEXT,
    "author_name" TEXT NOT NULL,
    "author_role" TEXT NOT NULL,
    "context_area" TEXT NOT NULL DEFAULT 'GENERAL',
    "period" TEXT NOT NULL DEFAULT 'ACTUAL',
    "observation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "independence_level" INTEGER NOT NULL DEFAULT 3,
    "social_grace_level" INTEGER NOT NULL DEFAULT 3,
    "focus_regulation_level" INTEGER NOT NULL DEFAULT 3,
    "curiosity_engagement_level" INTEGER NOT NULL DEFAULT 3,
    "autonomy_care_notes" TEXT NOT NULL DEFAULT '',
    "social_grace_notes" TEXT NOT NULL DEFAULT '',
    "focus_regulation_notes" TEXT NOT NULL DEFAULT '',
    "interests_passions_notes" TEXT NOT NULL DEFAULT '',
    "anecdote_highlight" TEXT NOT NULL DEFAULT '',
    "tags" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_characterizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_concepts" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'TUITION',
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "default_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_plan_templates" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "school_year" TEXT NOT NULL DEFAULT '2025-2026',
    "environment_stage" TEXT DEFAULT 'CASA',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "items" JSONB NOT NULL DEFAULT '[]',
    "batch_discount_pct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "prompt_payment_discount_pct" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "prompt_payment_day_limit" INTEGER NOT NULL DEFAULT 5,
    "default_installments_count" INTEGER NOT NULL DEFAULT 10,
    "invoice_cut_day" INTEGER NOT NULL DEFAULT 1,
    "due_day_limit" INTEGER NOT NULL DEFAULT 7,
    "late_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fee_plans" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "template_id" TEXT,
    "plan_name" TEXT NOT NULL,
    "school_year" TEXT NOT NULL DEFAULT '2025-2026',
    "payment_modality" TEXT NOT NULL DEFAULT 'MONTHLY_10',
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "installments_count" INTEGER NOT NULL DEFAULT 10,
    "invoice_cut_day" INTEGER NOT NULL DEFAULT 1,
    "due_day_limit" INTEGER NOT NULL DEFAULT 7,
    "late_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allow_late_fee_exemption" BOOLEAN NOT NULL DEFAULT false,
    "total_gross_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_net_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_fee_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_installments" (
    "id" TEXT NOT NULL,
    "student_fee_plan_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "concept_name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'TUITION',
    "installment_number" INTEGER NOT NULL DEFAULT 1,
    "total_installments" INTEGER NOT NULL DEFAULT 10,
    "invoice_cut_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3) NOT NULL,
    "original_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_reason" TEXT DEFAULT '',
    "net_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "late_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "late_fee_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_late_fee_applied" BOOLEAN NOT NULL DEFAULT false,
    "is_late_fee_waived" BOOLEAN NOT NULL DEFAULT false,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "payment_method" TEXT DEFAULT '',
    "payment_reference" TEXT DEFAULT '',
    "receipt_url" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "child_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "gender" TEXT DEFAULT 'NOT_SPECIFIED',
    "target_environment_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parent_name" TEXT NOT NULL,
    "parent_email" TEXT DEFAULT '',
    "parent_phone" TEXT DEFAULT '',
    "relationship" TEXT DEFAULT 'MOTHER',
    "preferred_start_date" TIMESTAMP(3),
    "notes" TEXT DEFAULT '',
    "previous_school" TEXT DEFAULT '',
    "previous_methodology" TEXT DEFAULT '',
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enrolled_student_id" TEXT,
    "admission_application_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_stages" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "slug" TEXT DEFAULT '',
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "color" TEXT DEFAULT '#1b3b2b',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_initial" BOOLEAN NOT NULL DEFAULT false,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "is_terminal_rejected" BOOLEAN NOT NULL DEFAULT false,
    "required_documents" JSONB DEFAULT '[]',
    "required_forms" JSONB DEFAULT '[]',
    "form_questions" JSONB DEFAULT '[]',
    "hooks_config" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "portal_token" TEXT,
    "child_first_name" TEXT DEFAULT '',
    "child_last_name" TEXT DEFAULT '',
    "child_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "gender" TEXT DEFAULT 'NOT_SPECIFIED',
    "target_environment_id" TEXT,
    "target_environment_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_start_date" TIMESTAMP(3),
    "previous_school" TEXT DEFAULT '',
    "previous_methodology" TEXT DEFAULT '',
    "tutor_name" TEXT NOT NULL,
    "tutor_email" TEXT DEFAULT '',
    "tutor_phone" TEXT DEFAULT '',
    "tutor_relationship" TEXT DEFAULT 'MOTHER',
    "secondary_tutor_name" TEXT DEFAULT '',
    "secondary_tutor_phone" TEXT DEFAULT '',
    "address" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "submitted_documents" JSONB DEFAULT '[]',
    "form_submissions" JSONB DEFAULT '[]',
    "custom_form_responses" JSONB DEFAULT '{}',
    "internal_notes" TEXT DEFAULT '',
    "enrolled_student_id" TEXT,
    "history" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_form_templates" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "category" TEXT DEFAULT 'GENERAL',
    "schema" JSONB NOT NULL DEFAULT '[]',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletters" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "preheader" TEXT,
    "content_html" TEXT NOT NULL,
    "content_json" JSONB,
    "cover_image_url" TEXT,
    "author_name" TEXT,
    "target_type" TEXT NOT NULL DEFAULT 'ALL_SCHOOL',
    "target_audience" TEXT NOT NULL DEFAULT 'PARENTS_AND_STAFF',
    "target_environment_ids" JSONB,
    "specific_emails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "logs" JSONB DEFAULT '[]',
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "environment_guides_environment_id_user_id_key" ON "environment_guides"("environment_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_user_id_school_id_key" ON "school_memberships"("user_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_tutors_student_id_tutor_user_id_key" ON "student_tutors"("student_id", "tutor_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_school_id_key_key" ON "site_settings"("school_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "student_lesson_progress_student_id_lesson_id_key" ON "student_lesson_progress"("student_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendances_student_id_date_key" ON "student_attendances"("student_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "event_hosts_event_id_user_id_key" ON "event_hosts"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_volunteers_event_id_tutor_user_id_key" ON "event_volunteers"("event_id", "tutor_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_target_environments_event_id_environment_id_key" ON "event_target_environments"("event_id", "environment_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_target_students_event_id_student_id_key" ON "event_target_students"("event_id", "student_id");

-- CreateIndex
CREATE INDEX "newsletters_school_id_status_idx" ON "newsletters"("school_id", "status");

-- CreateIndex
CREATE INDEX "newsletters_scheduled_at_idx" ON "newsletters"("scheduled_at");

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_guides" ADD CONSTRAINT "environment_guides_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_guides" ADD CONSTRAINT "environment_guides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_tutors" ADD CONSTRAINT "student_tutors_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_tutors" ADD CONSTRAINT "student_tutors_tutor_user_id_fkey" FOREIGN KEY ("tutor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_links" ADD CONSTRAINT "application_links_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_categories" ADD CONSTRAINT "gallery_categories_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "gallery_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_access_code" ADD CONSTRAINT "global_access_code_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "montessori_categories" ADD CONSTRAINT "montessori_categories_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "montessori_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "montessori_lessons" ADD CONSTRAINT "montessori_lessons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "montessori_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracker_subcategories" ADD CONSTRAINT "tracker_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tracker_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracker_items" ADD CONSTRAINT "tracker_items_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "tracker_subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_lesson_progress" ADD CONSTRAINT "student_lesson_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_lesson_progress" ADD CONSTRAINT "student_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "montessori_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_observations" ADD CONSTRAINT "student_observations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendances" ADD CONSTRAINT "student_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "school_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "school_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_tutor_user_id_fkey" FOREIGN KEY ("tutor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_target_environments" ADD CONSTRAINT "event_target_environments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "school_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_target_environments" ADD CONSTRAINT "event_target_environments_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_target_students" ADD CONSTRAINT "event_target_students_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "school_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_target_students" ADD CONSTRAINT "event_target_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_slots" ADD CONSTRAINT "event_slots_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "school_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bookings" ADD CONSTRAINT "event_bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "school_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bookings" ADD CONSTRAINT "event_bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "event_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bookings" ADD CONSTRAINT "event_bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bookings" ADD CONSTRAINT "event_bookings_tutor_user_id_fkey" FOREIGN KEY ("tutor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_conference_reports" ADD CONSTRAINT "progress_conference_reports_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_conference_reports" ADD CONSTRAINT "progress_conference_reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_conference_reports" ADD CONSTRAINT "progress_conference_reports_guide_user_id_fkey" FOREIGN KEY ("guide_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_characterizations" ADD CONSTRAINT "student_characterizations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_characterizations" ADD CONSTRAINT "student_characterizations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_characterizations" ADD CONSTRAINT "student_characterizations_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_concepts" ADD CONSTRAINT "fee_concepts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plan_templates" ADD CONSTRAINT "fee_plan_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_plans" ADD CONSTRAINT "student_fee_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_plans" ADD CONSTRAINT "student_fee_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_plans" ADD CONSTRAINT "student_fee_plans_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "fee_plan_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_installments" ADD CONSTRAINT "fee_installments_student_fee_plan_id_fkey" FOREIGN KEY ("student_fee_plan_id") REFERENCES "student_fee_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_installments" ADD CONSTRAINT "fee_installments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_installments" ADD CONSTRAINT "fee_installments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_enrolled_student_id_fkey" FOREIGN KEY ("enrolled_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_admission_application_id_fkey" FOREIGN KEY ("admission_application_id") REFERENCES "admission_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_stages" ADD CONSTRAINT "admission_stages_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "admission_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_enrolled_student_id_fkey" FOREIGN KEY ("enrolled_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_target_environment_id_fkey" FOREIGN KEY ("target_environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_form_templates" ADD CONSTRAINT "admission_form_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

